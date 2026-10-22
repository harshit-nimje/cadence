// Run: node --test tests/   (no dependencies). Loads the real browser code, so tests fail when it breaks.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

const mem = () => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v) }, removeItem: k => { delete m[k] } }; };

/* ---- engine: first script of core.js (data + taste engine), before it touches the DOM ---- */
const core = read('core.js');
const engineSrc = core.slice(0, core.indexOf("const audio=$('#audio')"));
function loadEngine() {
  const ctx = vm.createContext({ localStorage: mem(), document: {}, window: {}, console, setTimeout: () => 0, clearTimeout() {} });
  return vm.runInContext(engineSrc + `\n;({applyFeedback,scoreTrack,trimState,seenHas,FRESH_TASTE,SEED,getS:()=>S,setS:v=>{S=v}})`, ctx);
}
const track = (n, g, a) => ({ id: n, t: 'Song ' + n, a: a || 'Artist ' + n, g, y: 2015 });

test('like raises genre weight, nope lowers it, liked list is capped', () => {
  const E = loadEngine(), S = E.getS();
  E.applyFeedback(track(1, 'Jazz'), 'like');
  assert.ok(S.genre.Jazz > 0);
  E.applyFeedback(track(2, 'Metal'), 'nope');
  assert.ok(S.genre.Metal < 0);
  for (let i = 10; i < 80; i++) E.applyFeedback(track(i, 'Pop'), 'like');
  assert.equal(S.liked.length, 60);
});

test('scoring prefers the genre the user likes', () => {
  const E = loadEngine(), hip = E.SEED.filter(t => t.g === 'Hip-Hop/Rap'), pop = E.SEED.filter(t => t.g === 'Pop');
  hip.forEach(t => E.applyFeedback(t, 'like')); pop.slice(0, 4).forEach(t => E.applyFeedback(t, 'nope'));
  assert.ok(E.scoreTrack(track(900, 'Hip-Hop/Rap')) > E.scoreTrack(track(901, 'Pop')));
});

test('trimState bounds seen, kw, artist and keeps the strongest', () => {
  const E = loadEngine(), S = E.getS();
  for (let i = 0; i < 2500; i++) S.seen.push(i);
  for (let i = 0; i < 500; i++) { S.kw['k' + i] = i - 250; S.artist['a' + i] = { score: i } }
  E.trimState();
  assert.equal(S.seen.length, 2000); assert.equal(S.seen[0], 500);
  assert.equal(Object.keys(S.kw).length, 300); assert.ok('k0' in S.kw && !('k250' in S.kw));
  assert.ok(S.artist.a499 && !S.artist.a0);
});

test('seenHas stays correct across push, trim and a replaced state', () => {
  const E = loadEngine(), S = E.getS();
  S.seen.push(1, 2); assert.ok(E.seenHas(1)); assert.ok(!E.seenHas(3));
  S.seen.push(3); assert.ok(E.seenHas(3));
  for (let i = 10; i < 2100; i++) S.seen.push(i);
  E.seenHas(10); E.trimState();               // drops oldest ids incl. 1,2,3
  assert.ok(!E.seenHas(1)); assert.ok(E.seenHas(2099));
  const f = E.FRESH_TASTE(); f.seen = [7]; E.setS(f);   // undo / sync replace S
  assert.ok(E.seenHas(7)); assert.ok(!E.seenHas(2099));
});

/* ---- Spotify refresh token: only a revoked grant may wipe the link ---- */
const ext = read('extras.js');
const i0 = ext.indexOf("const MIRROR='cadence.sp';"), i1 = ext.indexOf('const _api=SP.api.bind(SP);');
function loadSp(response) {
  const S = { sp: { clientId: 'cid', redirect: '', token: null, refresh: 'R1', expires: 0, user: 'u' }, spotifySeeded: true };
  const SP = {}, toasts = [];
  const fetch = async () => ({ ok: response.ok, status: response.status, json: async () => response.body });
  new Function('S', 'SP', 'localStorage', 'fetch', 'toast', 'renderSpStatus', 'STORE_KEY', ext.slice(i0, i1))(
    S, SP, mem(), fetch, m => toasts.push(m), () => {}, 'cadence.v1');
  return { S, SP, toasts };
}

test('refresh: invalid_grant wipes the link and asks to reconnect', async () => {
  const { S, SP } = loadSp({ ok: false, status: 400, body: { error: 'invalid_grant' } });
  assert.equal(await SP.refreshToken(), false);
  assert.equal(S.sp.refresh, null); assert.equal(S.sp.needsReconnect, true);
});

test('refresh: other 400/401/5xx errors keep the link', async () => {
  for (const [status, error] of [[400, 'invalid_request'], [401, 'server_error'], [503, 'x']]) {
    const { S, SP } = loadSp({ ok: false, status, body: { error } });
    assert.equal(await SP.refreshToken(), false);
    assert.equal(S.sp.refresh, 'R1', `status ${status} must not wipe`);
  }
});

test('refresh: success stores token and the rotated refresh token', async () => {
  const { S, SP } = loadSp({ ok: true, status: 200, body: { access_token: 'A2', refresh_token: 'R2', expires_in: 3600 } });
  assert.equal(await SP.refreshToken(), true);
  assert.equal(S.sp.token, 'A2'); assert.equal(S.sp.refresh, 'R2'); assert.ok(S.sp.expires > Date.now());
});