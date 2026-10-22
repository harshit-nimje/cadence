/* =====================================================================
   Cadence — core: seed data, feature inference, taste engine, fetching
   ===================================================================== */
'use strict';

/* ---------- tiny helpers ---------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const uid = () => Math.random().toString(36).slice(2, 10);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const art600 = (u) => u ? u.replace(/\/\d+x\d+bb\.jpg$/, '/600x600bb.jpg') : '';
const todayKey = () => { const d = new Date(), p = n => String(n).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); };
/* after(name, cb): run cb after global function `name`, keeping its return value. Hooks run in registration order. */
const after = (n, cb) => { const o = window[n]; window[n] = function () { const r = o.apply(this, arguments); cb.apply(this, arguments); return r; }; };
const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

/* =====================================================================
   1. SEED CATALOG — real tracks with verified 30s preview URLs.
      Used for instant/offline start; the live iTunes Search API extends it.
   ===================================================================== */
const SEED = [
  { id: 1122782283, t: 'Yellow', a: 'Coldplay', g: 'Alternative', y: 2000, p: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/66/f3/1a/66f31a76-a6ed-cb4c-f353-23310a7ae9a8/mzaf_10593596652344378873.plus.aac.p.m4a', art: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/f5/93/8c/f5938c49-964c-31d1-4b33-78b634f71fb7/190295978075.jpg/100x100bb.jpg' },
  { id: 1122773680, t: 'Viva La Vida', a: 'Coldplay', g: 'Alternative', y: 2008, p: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/a3/30/8e/a3308eed-d8b7-e0b3-f09d-5e1b0f4d660a/mzaf_8517946447501075134.plus.aac.p.m4a', art: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/52/aa/85/52aa851f-15b7-6322-f91f-df84b15b7b19/190295978044.jpg/100x100bb.jpg' },
  { id: 829910927, t: 'A Sky Full of Stars', a: 'Coldplay', g: 'Alternative', y: 2014, p: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/f1/24/d0/f124d058-5d43-73ca-79e4-36f5eb42b172/mzaf_12358370529108063354.plus.aac.p.m4a', art: 'https://is1-ssl.mzstatic.com/image/thumb/Features125/v4/60/90/ad/6090adc3-8863-861d-afcc-23c55c6fe5da/dj.vmtulfyu.jpg/100x100bb.jpg' },
  { id: 617154366, t: 'Get Lucky', a: 'Daft Punk, Pharrell Williams & Nile Rodgers', g: 'Pop', y: 2013, p: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/57/a5/85/57a585aa-f1bc-7619-881b-f8a04a5541d5/mzaf_6906185026678279401.plus.aac.p.m4a', art: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/e8/43/5f/e8435ffa-b6b9-b171-40ab-4ff3959ab661/886443919266.jpg/100x100bb.jpg' },
  { id: 697195462, t: 'One More Time', a: 'Daft Punk', g: 'Dance', y: 2000, p: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/5d/93/d8/5d93d83f-ad1e-da4d-1d79-9937bdff24ec/mzaf_14396932211949300852.plus.aac.p.m4a', art: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/fd/4a/77/fd4a77db-0ebc-d043-41a2-f32fa1bb0fb4/dj.qrikkdwj.jpg/100x100bb.jpg' },
  { id: 696886431, t: 'Around the World', a: 'Daft Punk', g: 'Dance', y: 1997, p: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/4c/a5/d7/4ca5d77c-d5d9-efeb-9838-600f5b60bde8/mzaf_7271503176898847087.plus.aac.p.m4a', art: 'https://is1-ssl.mzstatic.com/image/thumb/Features115/v4/34/8d/c7/348dc71c-d75e-9baf-671a-994e9e74b018/dj.pimdxdmf.jpg/100x100bb.jpg' },
  { id: 1781270323, t: 'luther', a: 'Kendrick Lamar', g: 'Hip-Hop/Rap', y: 2024, p: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/e0/1d/98/e01d9881-0953-f0ed-b03d-3a4bd6f3c769/mzaf_8283505998481315852.plus.aac.p.m4a', art: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/50/c2/cc/50c2cc95-3658-9417-0d4b-831abde44ba1/24UM1IM28978.rgb.jpg/100x100bb.jpg' },
  { id: 1440881708, t: 'LOVE. (feat. Zacari)', a: 'Kendrick Lamar', g: 'Hip-Hop/Rap', y: 2017, p: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/72/71/89/72718957-3475-8f6f-3685-aedd470ddc20/mzaf_4044691450436775386.plus.aac.p.m4a', art: 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/86/c9/bb/86c9bb30-fe3d-442e-33c1-c106c4d23705/17UMGIM88776.rgb.jpg/100x100bb.jpg' },
  { id: 1440838060, t: 'Let It Happen', a: 'Tame Impala', g: 'Alternative', y: 2015, p: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/77/68/1f/77681ffc-56e6-813c-e1bc-d94a9b5893c1/mzaf_570579359857462588.plus.aac.p.m4a', art: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/a8/2e/b4/a82eb490-f30a-a321-461a-0383c88fec95/15UMGIM23316.rgb.jpg/100x100bb.jpg' },
  { id: 1497230972, t: 'Borderline', a: 'Tame Impala', g: 'Alternative', y: 2019, p: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/e5/b6/05/e5b605d9-5a44-e981-d9be-2c434cb61de4/mzaf_16402977899153564031.plus.aac.p.m4a', art: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/65/e3/e7/65e3e740-b69f-f5cb-f2e6-7dedb5265ac9/19UMGIM96748.rgb.jpg/100x100bb.jpg' },
  { id: 1440838708, t: 'New Person, Same Old Mistakes', a: 'Tame Impala', g: 'Alternative', y: 2015, p: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/55/9b/44/559b443e-06b6-bc62-f3f7-5f21a37971b0/mzaf_16483469776306833254.plus.aac.p.m4a', art: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/a8/2e/b4/a82eb490-f30a-a321-461a-0383c88fec95/15UMGIM23316.rgb.jpg/100x100bb.jpg' },
  { id: 1228739609, t: 'New Rules', a: 'Dua Lipa', g: 'Pop', y: 2017, p: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/6e/19/d9/6e19d9ca-1321-1eea-e797-51d7ab5b56c2/mzaf_5898999508314966855.plus.aac.p.m4a', art: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/c1/54/2d/c1542d45-c6c2-12ca-7308-6eacd762c562/190295807870.jpg/100x100bb.jpg' },
  { id: 1538003843, t: 'Levitating', a: 'Dua Lipa', g: 'Pop', y: 2020, p: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/59/dc/4d/59dc4dda-93ff-8f1c-c536-f005f6ea6af5/mzaf_3066686759813252385.plus.aac.p.m4a', art: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/6c/11/d6/6c11d681-aa3a-d59e-4c2e-f77e181026ab/190295092665.jpg/100x100bb.jpg' },
  { id: 6805877227, t: 'Training Season', a: 'Dua Lipa', g: 'Pop', y: 2024, p: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/d6/63/1f/d6631f86-e398-802f-470f-c3a1027759e4/mzaf_10400648329472023183.plus.aac.p.m4a', art: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/2d/1d/86/2d1d8629-34d0-f8f6-ffe8-2eca20741d33/1200214922771.jpg/100x100bb.jpg' },
  { id: 1689238922, t: 'Dance The Night', a: 'Dua Lipa', g: 'Pop', y: 2023, p: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/9d/9f/56/9d9f566f-abf6-5f10-bcdb-09e14dcace42/mzaf_10277018989080903908.plus.aac.p.m4a', art: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/c0/54/97/c05497aa-c19f-bf4f-de29-71edf30fbefb/075679688767.jpg/100x100bb.jpg' },
  { id: 1714502827, t: 'Houdini', a: 'Dua Lipa', g: 'Pop', y: 2023, p: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/2c/da/b5/2cdab5c6-04a8-5231-c697-00101e876479/mzaf_5586859405346659517.plus.aac.p.m4a', art: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/dd/af/ea/ddafeab5-797a-5b6f-7735-f96c537b45e0/5054197894091.jpg/100x100bb.jpg' },
  { id: 1364709436, t: 'One Kiss', a: 'Calvin Harris, Dua Lipa', g: 'Dance', y: 2018, p: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/33/81/fc/3381fc37-e216-04f3-2e61-a5ab7b9c79c3/mzaf_11986095118390090442.plus.aac.p.m4a', art: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/91/2a/7b/912a7bdb-c2f6-b887-9392-49728fece0df/886447044360.jpg/100x100bb.jpg' },
  { id: 1484636829, t: "Don't Start Now", a: 'Dua Lipa', g: 'Pop', y: 2019, p: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/24/3d/34/243d3413-a0fc-b229-f54a-1715ebd3a9ca/mzaf_11578996572221800393.plus.aac.p.m4a', art: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/41/ee/66/41ee66fa-f8dd-7e82-155a-3a1b360dc562/190295322175.jpg/100x100bb.jpg' },
  { id: 1578986673, t: 'Cold Heart (PNAU Remix)', a: 'Elton John & Dua Lipa', g: 'Pop', y: 2021, p: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/d7/4d/bd/d74dbdd2-54dc-ef9c-b45b-842e9e9b62ff/mzaf_7817050118634864412.plus.aac.p.m4a', art: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/ec/2f/92/ec2f929f-e7ea-b291-42d7-75081bd808a1/21UMGIM68484.rgb.jpg/100x100bb.jpg' }
];

/* Onboarding seed options → search terms */
const SEEDS = [
  { label: 'Pop',          term: 'pop hits',        g: 'Pop' },
  { label: 'Hip-Hop',      term: 'hip hop',         g: 'Hip-Hop/Rap' },
  { label: 'Indie',        term: 'indie',           g: 'Alternative' },
  { label: 'Electronic',   term: 'electronic',      g: 'Electronic' },
  { label: 'Rock',         term: 'rock',            g: 'Rock' },
  { label: 'R&B / Soul',   term: 'r&b soul',        g: 'R&B/Soul' },
  { label: 'Jazz',         term: 'jazz',            g: 'Jazz' },
  { label: 'Classical',    term: 'classical',       g: 'Classical' },
  { label: 'Dance / EDM',  term: 'edm dance',       g: 'Dance' },
  { label: 'Metal',        term: 'metal',           g: 'Metal' },
  { label: 'Country',      term: 'country',         g: 'Country' },
  { label: 'Latin',        term: 'latin',           g: 'Latin' },
  { label: 'Folk',         term: 'folk acoustic',   g: 'Folk' },
  { label: 'K-Pop',        term: 'k-pop',           g: 'Pop' },
  { label: 'Bollywood',    term: 'bollywood',       g: 'World' },
  { label: 'Lo-fi',        term: 'lofi chill',      g: 'Electronic' },
  { label: 'Ambient',      term: 'ambient',         g: 'Electronic' },
  { label: 'Punk',         term: 'punk',            g: 'Rock' }
];

/* =====================================================================
   2. FEATURE INFERENCE
   iTunes gives us no audio features, so we infer a stable profile from
   genre + title keywords + release era. This is honest approximation,
   not real signal analysis — the *learning* is what adapts.
   ===================================================================== */
const GENRE_PROFILE = {
  'Pop': { e: .62, v: .72, a: .18, d: .72 },
  'Dance': { e: .80, v: .70, a: .06, d: .88 },
  'Electronic': { e: .78, v: .55, a: .08, d: .82 },
  'Hip-Hop/Rap': { e: .68, v: .48, a: .12, d: .78 },
  'Alternative': { e: .58, v: .45, a: .42, d: .50 },
  'Rock': { e: .72, v: .52, a: .40, d: .48 },
  'Indie': { e: .55, v: .52, a: .55, d: .50 },
  'R&B/Soul': { e: .50, v: .60, a: .30, d: .62 },
  'Jazz': { e: .42, v: .58, a: .72, d: .45 },
  'Classical': { e: .30, v: .55, a: .92, d: .25 },
  'Metal': { e: .92, v: .30, a: .20, d: .42 },
  'Country': { e: .52, v: .62, a: .58, d: .45 },
  'Latin': { e: .78, v: .82, a: .20, d: .82 },
  'Reggae': { e: .55, v: .78, a: .35, d: .65 },
  'Blues': { e: .48, v: .45, a: .60, d: .42 },
  'Folk': { e: .35, v: .50, a: .82, d: .32 },
  'Singer/Songwriter': { e: .35, v: .48, a: .80, d: .35 },
  'World': { e: .55, v: .62, a: .50, d: .55 },
  'Soundtrack': { e: .45, v: .50, a: .55, d: .40 },
  'Vocal': { e: .45, v: .60, a: .55, d: .45 },
  'Punk': { e: .85, v: .45, a: .30, d: .50 },
  'default': { e: .55, v: .55, a: .35, d: .55 }
};
const GENRE_KEYS = Object.keys(GENRE_PROFILE).filter(k => k !== 'default');

function mapGenre(raw) {
  const g = String(raw || '');
  for (const k of GENRE_KEYS) if (g.toLowerCase() === k.toLowerCase()) return k;
  if (/hip.?hop|rap/i.test(g)) return 'Hip-Hop/Rap';
  if (/r&b|soul/i.test(g)) return 'R&B/Soul';
  if (/dance|house|techno|edm/i.test(g)) return 'Dance';
  if (/electron|ambient|idm/i.test(g)) return 'Electronic';
  if (/alternat|indie/i.test(g)) return /indie/i.test(g) ? 'Indie' : 'Alternative';
  if (/rock|metal|punk/i.test(g)) return /metal/i.test(g) ? 'Metal' : (/punk/i.test(g) ? 'Punk' : 'Rock');
  if (/pop/i.test(g)) return 'Pop';
  if (/country/i.test(g)) return 'Country';
  if (/latin|reggaeton|salsa/i.test(g)) return 'Latin';
  if (/jazz/i.test(g)) return 'Jazz';
  if (/classical|orchestr/i.test(g)) return 'Classical';
  if (/folk/i.test(g)) return 'Folk';
  if (/world|bollywood|indian/i.test(g)) return 'World';
  if (/soundtrack|score/i.test(g)) return 'Soundtrack';
  return GENRE_PROFILE[g] ? g : 'default';
}

const STOP = new Set('the a an and or of to in on for with feat featuring remix mix version edit live from by at is it my me you your'.split(' '));
function keywordsOf(title) {
  return norm(title).split(' ').filter(w => w.length > 2 && !STOP.has(w) && !/^\d+$/.test(w)).slice(0, 6);
}

function inferFeatures(track) {
  const base = GENRE_PROFILE[track.g] || GENRE_PROFILE.default;
  let { e, v, a, d } = base;
  const n = norm(track.t + ' ' + track.a);
  if (/remix|rmx|bootleg/.test(n)) { e += .12; d += .12; }
  if (/acoustic|unplugged/.test(n)) { a += .25; e -= .16; d -= .12; }
  if (/live/.test(n)) { e += .07; }
  if (/slowed|reverb|sped up|nightcore/.test(n)) { e -= .18; v -= .08; }
  if (/lofi|chill|sleep|calm|dream/.test(n)) { e -= .2; d -= .1; }
  if (/party|dance|night|club|wild/.test(n)) { v += .08; e += .08; }
  if (/love|baby|kiss|heart|beautiful/.test(n)) { v += .08; }
  if (/sad|cry|alone|goodbye|hurt|broken|lonely|tears/.test(n)) { v -= .2; }
  const age = clamp((new Date().getFullYear() - (track.y || 2010)) / 40, 0, 1);
  e = clamp(e + (1 - age) * .03 - .03);
  d = clamp(d - age * .06);
  return { energy: clamp(e), valence: clamp(v), acousticness: clamp(a), danceability: clamp(d) };
}

/* =====================================================================
   3. STATE + PERSISTENCE
   ===================================================================== */
const STORE_KEY = 'cadence.v1';
const FRESH_TASTE = () => ({
  likes: 0, nopes: 0, skips: 0,
  genre: {}, artist: {}, kw: {},
  feat: { energy: .5, valence: .5, acousticness: .5, danceability: .5 },
  featW: 0, era: { mean: 2012, w: 0 },
  liked: [], seen: [], history: [],
  seeds: [], spotifySeeded: false, saved: [],
  daily: null, streak: { last: null, count: 0 }, updatedAt: 0,
  sp: { clientId: '', redirect: '', token: null, refresh: null, expires: 0, user: null }
});

let S = loadState();
function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return FRESH_TASTE();
    const p = JSON.parse(raw);
    const f = FRESH_TASTE();
    return Object.assign(f, p, { feat: Object.assign(f.feat, p.feat || {}), era: Object.assign(f.era, p.era || {}), sp: Object.assign(f.sp, p.sp || {}) });
  } catch (e) { return FRESH_TASTE(); }
}
let saveTimer = null;
/* O(1) membership for S.seen. Cache follows the array: rebuilt if S.seen is replaced or shrinks, extended if it only grew. */
let seenC = null;
function seenHas(id) {
  const a = S.seen;
  if (!seenC || seenC.a !== a || a.length < seenC.n) seenC = { a, n: 0, set: new Set() };
  for (; seenC.n < a.length; seenC.n++) seenC.set.add(a[seenC.n]);
  return seenC.set.has(id);
}
/* Bound per-user state: seen ids, keyword and artist weights only ever grow. */
function trimState() {
  if (S.seen.length > 2000) { S.seen.splice(0, S.seen.length - 2000); seenC = null; }
  for (const [o, w] of [[S.kw, v => Math.abs(v)], [S.artist, v => Math.abs(v.score)]]) {
    const k = Object.keys(o);
    if (k.length > 400) k.sort((a, b) => w(o[b]) - w(o[a])).slice(300).forEach(x => delete o[x]);
  }
}
function save() {
  trimState();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) {} }, 120);
}

/* =====================================================================
   4. THE TASTE ENGINE
   ===================================================================== */
const LR = { like: .2, nope: .14, skip: .06 };

function applyFeedback(track, verdict) {
  const f = track.f || inferFeatures(track);
  if (verdict === 'like') {
    S.likes++; S.liked.unshift(summarize(track)); S.liked = S.liked.slice(0, 60);
  } else if (verdict === 'nope') { S.nopes++; }
  else { S.skips++; }

  // feature means
  const lr = LR[verdict] || .06;
  for (const k of Object.keys(S.feat)) {
    if (verdict === 'nope') S.feat[k] = clamp(S.feat[k] + (S.feat[k] - f[k]) * lr);
    else S.feat[k] = clamp(S.feat[k] * (1 - lr) + f[k] * lr);
  }
  S.featW++;

  // genre weights
  const g = track.g || 'default';
  const dg = verdict === 'like' ? 1 : verdict === 'nope' ? -.7 : .06;
  S.genre[g] = (S.genre[g] || 0) + dg;

  // artist affinity
  const ak = norm(track.a).split(',')[0].trim() || norm(track.a);
  if (ak) {
    const cur = S.artist[ak] || { name: track.a.split(',')[0].trim(), score: 0, count: 0 };
    cur.score += verdict === 'like' ? 1 : verdict === 'nope' ? -.8 : .04;
    cur.count++;
    S.artist[ak] = cur;
  }

  // era
  if (verdict === 'like' && track.y) { const lre = .15; S.era.mean = S.era.mean * (1 - lre) + track.y * lre; S.era.w++; }

  // title keywords
  for (const w of keywordsOf(track.t)) S.kw[w] = (S.kw[w] || 0) + (verdict === 'like' ? .5 : verdict === 'nope' ? -.3 : .03);

  if (!seenHas(track.id)) S.seen.push(track.id);
  S.history.unshift({ track: summarize(track), verdict });
  S.history = S.history.slice(0, 40);
  save();
}

function summarize(t) {
  return { id: t.id, t: t.t, a: t.a, g: t.g, y: t.y, p: t.p, art: t.art, f: t.f, why: t.why || '' };
}

function maxAbs(o) { return Math.max(1e-6, ...Object.values(o).map(Math.abs)); }
function strength() { return clamp((S.likes + S.nopes + S.skips) / 40); }

/* score a candidate against the taste vector */
function scoreTrack(t) {
  const f = t.f || inferFeatures(t);
  const gMax = maxAbs(S.genre);
  const genreSim = clamp(((S.genre[t.g] || 0) / gMax + .15) / 1.15);

  let featDiff = 0; const F = S.feat;
  featDiff += Math.abs(f.energy - F.energy); featDiff += Math.abs(f.valence - F.valence);
  featDiff += Math.abs(f.acousticness - F.acousticness); featDiff += Math.abs(f.danceability - F.danceability);
  const featSim = clamp(1 - featDiff / 4 * 1.35);

  const ak = norm(t.a).split(',')[0].trim() || norm(t.a);
  const aMax = Math.max(1e-6, ...Object.values(S.artist).map(x => Math.abs(x.score)));
  const artistSim = clamp(((S.artist[ak] ? S.artist[ak].score : 0) / aMax + .2) / 1.2);

  const eraSim = t.y ? Math.exp(-Math.abs(t.y - S.era.mean) / 13) : .5;

  const kws = keywordsOf(t.t);
  let kwSum = 0; for (const w of kws) kwSum += S.kw[w] || 0;
  const kwMax = Math.max(1e-6, maxAbs(S.kw));
  const kwSim = kws.length ? clamp((kwSum / kws.length) / kwMax * .8 + .2) : .3;

  const novelty = seenHas(t.id) ? 0 : .2;

  return .34 * genreSim + .22 * featSim + .18 * artistSim + .10 * eraSim + .08 * kwSim + .08 * novelty;
}

/* ranked queue: exploitation + a little exploration */
function recommend(n) {
  const eps = Math.max(.12, .55 - (S.likes + S.nopes + S.skips) / 260);
  const pool = POOL.filter(t => !seenHas(t.id));
  const ranked = pool.map(t => ({ t, s: scoreTrack(t) + (Math.random() < eps ? Math.random() * .35 : Math.random() * .04) }))
    .sort((a, b) => b.s - a.s);
  return ranked.slice(0, n).map(x => x.t);
}

/* =====================================================================
   5. DATA FETCHING — iTunes Search API over JSONP
      (iTunes CORS headers are unreliable, so we use a script-tag callback)
   ===================================================================== */
function jsonp(url) {
  return new Promise((resolve, reject) => {
    const cb = 'cad_cb_' + uid();
    const s = document.createElement('script');
    let done = false;
    const clean = () => { try { delete window[cb]; } catch (e) { window[cb] = undefined; } s.remove(); };
    window[cb] = (data) => { done = true; resolve(data); clean(); };
    s.onerror = () => { if (!done) { reject(new Error('network')); clean(); } };
    s.src = url + (url.includes('?') ? '&' : '?') + 'callback=' + cb;
    document.head.appendChild(s);
    setTimeout(() => { if (!done) { reject(new Error('timeout')); clean(); } }, 14000);
  });
}

function normalize(raw) {
  if (!raw || raw.kind !== 'song' || !raw.previewUrl) return null;
  const g = mapGenre(raw.primaryGenreName);
  const y = raw.releaseDate ? parseInt(raw.releaseDate.slice(0, 4), 10) : null;
  const t = {
    id: raw.trackId, t: raw.trackName || 'Unknown', a: raw.artistName || 'Unknown',
    g, y, p: raw.previewUrl, art: raw.artworkUrl100 || '',
    ms: raw.trackTimeMillis || 30000, src: 'itunes'
  };
  t.f = inferFeatures(t);
  return t;
}

async function searchItunes(term, limit = 25) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=${limit}`;
  const data = await jsonp(url);
  const out = [];
  for (const r of (data && data.results) || []) { const t = normalize(r); if (t) out.push(t); }
  return out;
}

/* ---- pool management ---- */
let POOL = [];
const poolKeys = new Set();
function addToPool(list) {
  let added = 0;
  for (const t of list) {
    const k = norm(t.t) + '|' + norm(t.a).split(' ')[0];
    if (poolKeys.has(k)) continue;
    poolKeys.add(k); POOL.push(t); added++;
  }
  return added;
}

async function seedPool(terms) {
  const uniq = [...new Set(terms)].slice(0, 6);
  const results = await Promise.allSettled(uniq.map(tm => searchItunes(tm, 25)));
  let added = 0;
  results.forEach(r => { if (r.status === 'fulfilled') added += addToPool(r.value); });
  return added;
}

/* refill the pool from what the taste vector now favours */
async function refillPool() {
  if (POOL.filter(t => !seenHas(t.id)).length > 14) return 0;
  const terms = [];
  const topGenres = Object.entries(S.genre).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 2).map(x => x[0]);
  const genreTerm = { 'Hip-Hop/Rap': 'hip hop', 'R&B/Soul': 'r&b', 'Alternative': 'indie alternative', 'Dance': 'dance', 'Electronic': 'electronic' };
  topGenres.forEach(g => terms.push(genreTerm[g] || g));
  const topArtists = Object.entries(S.artist).filter(([, v]) => v.score > 0).sort((a, b) => b[1].score - a[1].score).slice(0, 2).map(x => x[1].name);
  terms.push(...topArtists);
  if (!terms.length) terms.push(...(S.seeds.length ? S.seeds : ['pop hits', 'indie']));
  return seedPool(terms);
}

/* =====================================================================
   6. MOODS + DAILY PICK
   ===================================================================== */
const MOODS = {
  chill:     { name: 'Chill',      em: '🌊', e: .32, v: .58, a: .60, d: .42, genres: ['Alternative', 'Indie', 'R&B/Soul', 'Jazz', 'Folk'] },
  focus:     { name: 'Focus',      em: '🎯', e: .42, v: .50, a: .55, d: .45, genres: ['Electronic', 'Classical', 'Jazz', 'Soundtrack'] },
  workout:   { name: 'Workout',    em: '🔥', e: .90, v: .60, a: .08, d: .86, genres: ['Dance', 'Electronic', 'Hip-Hop/Rap', 'Rock'] },
  party:     { name: 'Party',      em: '🎉', e: .85, v: .86, a: .06, d: .90, genres: ['Dance', 'Pop', 'Latin', 'Electronic'] },
  sad:       { name: 'Sad hours',  em: '🌧️', e: .30, v: .25, a: .72, d: .35, genres: ['Alternative', 'Folk', 'Singer/Songwriter', 'R&B/Soul'] },
  happy:     { name: 'Feel-good',  em: '☀️', e: .68, v: .90, a: .20, d: .78, genres: ['Pop', 'Latin', 'Dance', 'Country'] },
  sleep:     { name: 'Wind down',  em: '🌙', e: .20, v: .45, a: .82, d: .25, genres: ['Electronic', 'Classical', 'Folk', 'Jazz'] },
  nostalgic: { name: 'Nostalgic',  em: '📼', e: .55, v: .62, a: .35, d: .55, genres: ['Pop', 'Rock', 'Alternative', 'R&B/Soul'] }
};

function moodScore(t, m) {
  const f = t.f || inferFeatures(t);
  let d = Math.abs(f.energy - m.e) + Math.abs(f.valence - m.v) + Math.abs(f.acousticness - m.a) + Math.abs(f.danceability - m.d);
  const moodFit = clamp(1 - d / 4 * 1.3);
  const genreFit = m.genres.includes(t.g) ? 1 : .25;
  const tasteFit = scoreTrack(t);
  return .46 * moodFit + .24 * genreFit + .30 * tasteFit;
}

function buildMood(key) {
  const m = MOODS[key];
  const cands = [...POOL, ...SEED.map(s => ({ ...s, f: inferFeatures(s) }))]
    .filter((t, i, arr) => arr.findIndex(x => x.id === t.id) === i);
  return cands.map(t => ({ t, s: moodScore(t, m) })).sort((a, b) => b.s - a.s).slice(0, 14).map(x => x.t);
}

function dailyPick() {
  const key = todayKey();
  if (S.daily && S.daily.date === key) {
    const t = findTrack(S.daily.id);
    if (t) return t;
  }
  const ranked = recommend(20);
  const pool = ranked.length ? ranked : SEED.map(s => ({ ...s, f: inferFeatures(s) }));
  // deterministic by date, so the pick is stable for the day
  let h = 0; const sig = key + JSON.stringify(S.genre) + S.likes;
  for (let i = 0; i < sig.length; i++) h = (h * 31 + sig.charCodeAt(i)) >>> 0;
  const pick = pool[h % Math.max(1, Math.min(pool.length, 10))];
  if (pick) { S.daily = { date: key, id: pick.id }; save(); }
  return pick || pool[0];
}

function findTrack(id) {
  return POOL.find(t => t.id === id) || S.liked.find(t => t.id === id) ||
    SEED.map(s => ({ ...s, f: inferFeatures(s) })).find(t => t.id === id);
}

/* reason text — why this was recommended */
function reasonFor(t) {
  const ak = norm(t.a).split(',')[0].trim() || norm(t.a);
  const art = S.artist[ak];
  if (art && art.score > .5) return 'More like ' + art.name;
  const gTop = Object.entries(S.genre).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])[0];
  if (gTop && gTop[0] === t.g) return 'Your ' + t.g + ' streak';
  const f = t.f || inferFeatures(t);
  if (f.energy > .75 && S.feat.energy > .6) return 'High energy';
  if (f.valence > .75 && S.feat.valence > .6) return 'Feel-good';
  if (f.acousticness > .6) return 'Acoustic side';
  return 'Taste match';
}

/* =====================================================================
   7. SPOTIFY (PKCE, optional)
   ===================================================================== */
const SCOPES = 'user-top-read user-library-modify playlist-modify-private playlist-read-private playlist-read-collaborative';
const SP = {
  b64url(bytes) { return btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); },
  rand(n) { const a = new Uint8Array(n); crypto.getRandomValues(a); return this.b64url(a); },
  async challenge(v) { const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(v)); return this.b64url(d); },
  redirect() { return S.sp.redirect || (location.origin + location.pathname); },
  available() { return !!(window.crypto && crypto.subtle) && location.protocol !== 'file:'; },
  connected() { return !!(S.sp.token && Date.now() < S.sp.expires); },
  async begin() {
    if (!this.available()) { toast('Spotify needs the page served over http(s) — see Settings.', 'err'); return; }
    if (!S.sp.clientId) { openModal('settings'); toast('Add your Spotify Client ID first.', 'err'); return; }
    const v = this.rand(64), st = this.rand(24);
    try { localStorage.setItem('cadence.pkce', v); localStorage.setItem('cadence.state', st); } catch (e) {}
    const ch = await this.challenge(v);
    const url = 'https://accounts.spotify.com/authorize?' + new URLSearchParams({
      client_id: S.sp.clientId, response_type: 'code', redirect_uri: this.redirect(),
      code_challenge_method: 'S256', code_challenge: ch, scope: SCOPES, show_dialog: 'false', state: st
    });
    location.href = url;
  },
  async handleReturn() {
    const p = new URLSearchParams(location.search);
    const code = p.get('code'), err = p.get('error'), st = p.get('state');
    let wantState = null; try { wantState = localStorage.getItem('cadence.state'); } catch (e) {}
    if (err) { toast('Spotify: ' + err, 'err'); history.replaceState({}, '', location.pathname); return; }
    if (!code) return;
    history.replaceState({}, '', location.pathname);
    if (wantState && st !== wantState) { try { localStorage.removeItem('cadence.state'); localStorage.removeItem('cadence.pkce'); } catch (e) {} toast('Spotify sign-in could not be verified. Please try again.', 'err'); return; }
    try {
      const body = new URLSearchParams({
        client_id: S.sp.clientId, grant_type: 'authorization_code', code,
        redirect_uri: this.redirect(), code_verifier: localStorage.getItem('cadence.pkce') || ''
      });
      const r = await fetch('https://accounts.spotify.com/api/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error_description || j.error || 'token failed');
      S.sp.token = j.access_token; S.sp.refresh = j.refresh_token; S.sp.expires = Date.now() + (j.expires_in - 60) * 1000;
      S.sp.needsReconnect = false;
      try { localStorage.removeItem('cadence.pkce'); localStorage.removeItem('cadence.state'); } catch (e) {}
      save(); toast('Spotify connected — seeding your taste…', 'ok');
      await seedFromSpotify();
    } catch (e) { toast('Spotify connect failed: ' + e.message, 'err'); }
  },
  async refreshToken() {
    if (!S.sp.refresh) return false;
    try {
      const body = new URLSearchParams({ client_id: S.sp.clientId, grant_type: 'refresh_token', refresh_token: S.sp.refresh });
      const r = await fetch('https://accounts.spotify.com/api/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
      const j = await r.json(); if (!r.ok) throw new Error(j.error || 'refresh failed');
      S.sp.token = j.access_token; S.sp.expires = Date.now() + (j.expires_in - 60) * 1000; save(); return true;
    } catch (e) { return false; }
  },
  async api(path, opts = {}) {
    if (!this.connected()) { const ok = await this.refreshToken(); if (!ok) throw new Error('Not connected to Spotify. Reconnect in Taste.'); }
    const go = () => fetch('https://api.spotify.com/v1' + path, Object.assign({}, opts, { headers: Object.assign({ Authorization: 'Bearer ' + S.sp.token }, opts.headers || {}) }));
    let r = await go();
    if (r.status === 401 && await this.refreshToken()) r = await go();
    if (!r.ok && r.status !== 204) {
      let m = r.statusText; try { m = (await r.json()).error.message || m; } catch (e) {}
      let msg = m;
      if (r.status === 403) msg = /scope/i.test(m) ? 'Spotify permission missing. Disconnect and reconnect Spotify in Taste, then accept every permission.' : /not registered|allowlist|user management/i.test(m) ? 'Your Spotify account is not added to this app. Add your email under User Management in the Spotify dashboard.' : 'Spotify refused (403). Check that the app owner has Premium and your account is under User Management in the Spotify dashboard.';
      else if (r.status === 429) msg = 'Spotify is rate limiting. Try again in a minute.';
      const err = new Error(msg); err.status = r.status; err.retryAfter = Number(r.headers.get('Retry-After')) || 0; throw err;
    }
    if (r.status === 204) return null;
    const txt = await r.text();
    if (!txt) return {};
    try { return JSON.parse(txt); } catch (e) { return {}; }
  },
  disconnect() { S.sp.token = null; S.sp.refresh = null; S.sp.expires = 0; S.sp.user = null; S.spotifySeeded = false; save(); }
};

/* seed the taste vector from the user's Spotify top artists + tracks */
async function seedFromSpotify() {
  const btn = $('#spotifyBtn');
  try {
    const [artists, tracks] = await Promise.all([
      SP.api('/me/top/artists?limit=25&time_range=medium_term'),
      SP.api('/me/top/tracks?limit=30&time_range=medium_term')
    ]);
    const names = (artists.items || []).map(a => a.name);
    const artistIds = (artists.items || []).map(a => a.id);
    const trackQ = (tracks.items || []).map(t => `${t.name} ${t.artists[0].name}`);

    // Pre-seed the taste vector directly from top artists' genres
    const genreCount = {};
    (artists.items || []).forEach(a => (a.genres || []).forEach(g => {
      const mapped = mapGenre(g); genreCount[mapped] = (genreCount[mapped] || 0) + 1;
    }));
    Object.entries(genreCount).forEach(([g, c]) => { S.genre[g] = (S.genre[g] || 0) + c * 1.2; });
    // Artist affinity from top artists
    (artists.items || []).slice(0, 25).forEach((a, i) => {
      const ak = norm(a.name); if (!ak) return;
      const cur = S.artist[ak] || { name: a.name, score: 0, count: 0 };
      cur.score += Math.max(1, 6 - i * .2); cur.count++; S.artist[ak] = cur;
    });
    S.spotifySeeded = true; S.sp.user = (await SP.api('/me').catch(() => null));
    save();

    // fetch previews for their top artists + tracks so the deck is personal immediately
    const terms = [...new Set([...names.slice(0, 8), ...trackQ.slice(0, 4)])].slice(0, 8);
    const added = await seedPool(terms);
    toast(`Seeded from Spotify: ${names.length} artists · ${added} new tracks`, 'ok');
    if (btn) { btn.innerHTML = '<span class="sp-dot"></span><span class="label">Spotify connected</span>'; }
    DECK = []; ensureDeck(); renderAll(); renderDeck();
  } catch (e) { toast('Could not read Spotify: ' + e.message, 'err'); }
}

/* save a track to the user's Liked Songs */
async function saveToSpotify(t) {
  if (!SP.connected()) { window.open('https://open.spotify.com/search/' + encodeURIComponent(t.t + ' ' + t.a), '_blank'); toast('Opening Spotify search…'); return; }
  try {
    const q = encodeURIComponent(`track:${t.t} artist:${t.a.split(',')[0]}`);
    const res = await SP.api('/search?type=track&limit=1&q=' + q);
    const hit = res.tracks && res.tracks.items && res.tracks.items[0];
    if (!hit) { window.open('https://open.spotify.com/search/' + encodeURIComponent(t.t + ' ' + t.a), '_blank'); toast('Not found on Spotify — opened search'); return; }
    await SP.api('/me/library?uris=' + encodeURIComponent('spotify:track:' + hit.id), { method: 'PUT' });
    if (!S.saved.includes(t.id)) S.saved.push(t.id);
    save(); toast('Saved to your Liked Songs ♥', 'ok');
  } catch (e) { toast('Could not save: ' + e.message, 'err'); }
};
'use strict';
const audio=$('#audio'),T=new Map();let DECK=[],undoStack=[],nowId=null,auto=false,view='discover',curMood='chill',picked=new Set();
const sv=(p,x='')=>`<svg viewBox="0 0 24 24" fill="${x?'currentColor':'none'}" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const IC={play:sv('<path d="M7 4v16l13-8z"/>',1),pause:sv('<path d="M7 4h3v16H7zM14 4h3v16h-3z"/>',1),heart:sv('<path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.800-8 11-8 11z"/>'),x:sv('<path d="M6 6l12 12M18 6L6 18"/>'),skip:sv('<path d="M12 5v14M6 13l6 6 6-6"/>'),undo:sv('<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>'),spotify:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9.1"/><path d="M7.1 9.3c3.4-1.15 7.3-.72 10.1 1.05"/><path d="M7.85 12.4c2.8-.9 5.9-.55 8.25 1"/><path d="M8.55 15.45c2.1-.66 4.55-.4 6.4.82"/></svg>',note:sv('<path d="M9 18V5l10-2v13"/><circle cx="6.5" cy="18" r="3"/><circle cx="16.5" cy="16" r="3"/>')};
const reg=t=>(T.set(String(t.id),t),t);
const hue=t=>(String(t.id).split('').reduce((a,c)=>(a*31+c.charCodeAt(0))|0,7)>>>0)%360;
function wave(t,n=60){let h=hue(t)+9,o='';for(let i=0;i<n;i++){h=(Math.imul(h,1103515245)+12345)>>>0;const v=.22+((h>>8)%100)/100*.78;o+=`<i style="height:${Math.round(10+v*90)}%"></i>`}return `<div class="wb">${o}</div><div class="wf">${o}</div><i class="ph"></i>`}
const artOf=t=>t.art?art600(t.art):'';
/* toast + modal shims (engine calls these) */
function toast(m,type){const e=document.createElement('div');e.className='t '+(type==='err'?'err':'');e.textContent=m;$('#toast').appendChild(e);setTimeout(()=>e.remove(),2800)}
function openModal(id){if(id==='settings')go('taste')}function closeModal(){}
/* audio */
function stopAudio(){try{audio.pause()}catch(e){}nowId=null;sync()}
function playTrack(t,force){if(nowId==t.id&&!force){audio.paused?audio.play().catch(()=>{}):audio.pause();return}nowId=t.id;audio.loop=view==='discover';audio.src=t.p;audio.play().catch(()=>{});sync()}
function sync(){$$('[data-play]').forEach(b=>{const on=String(b.dataset.play)===String(nowId)&&!audio.paused;b.classList.toggle('on',on);b.innerHTML=on?IC.pause:IC.play})}
audio.onplay=audio.onpause=sync;
audio.ontimeupdate=()=>{const p=audio.duration?audio.currentTime/audio.duration:0;$$(`.wave[data-id="${nowId}"] i`).forEach((b,i,a)=>b.classList.toggle('on',i/a.length<p))};
/* ambient backdrop */
function setBg(t){const bg=$('#bg'),u=t&&artOf(t);if(bg.dataset.u===u)return;bg.dataset.u=u;const d=document.createElement('div');d.style.backgroundImage=u?`url(${u})`:`linear-gradient(135deg,hsl(${t?hue(t):260} 60% 40%),#120e1d)`;bg.appendChild(d);requestAnimationFrame(()=>d.classList.add('in'));setTimeout(()=>{while(bg.children.length>2)bg.firstChild.remove()},1000)}
/* deck */


function ensureDeck(){let g=0;while(DECK.length<6&&g++<8){const m=recommend(10);if(!m.length)break;for(const t of m)if(!DECK.some(d=>d.id===t.id))DECK.push(t)}if(DECK.length<3)refillPool().then(a=>{if(a){ensureDeck();renderDeck()}})}

function vote(v){const t=DECK[0];if(!t)return;auto=true;commit(t,v,$('#deck .card:last-child'))}
function flyOut(c,v){const k={like:[1,0],nope:[-1,0],skip:[0,1]}[v];c.style.transition='transform .45s cubic-bezier(.5,0,.8,.4),opacity .45s';c.style.transform=`translate(${k[0]*620}px,${k[1]*500}px) rotate(${k[0]*28}deg)`;c.style.opacity=0;const s=c.querySelector('.stamp.'+(v==='skip'?'mid':v));if(s)s.style.opacity=1}
function commit(t,v,c){DECK=DECK.filter(x=>x.id!==t.id);const snap=JSON.stringify(Object.assign({},S,{history:undefined}));applyFeedback(t,v);undoStack.push({t,v,snap});if(undoStack.length>25)undoStack.shift();if(nowId==t.id)stopAudio();if(c)flyOut(c,v);hud();setTimeout(()=>{ensureDeck();renderDeck()},380)}
function undo(){const u=undoStack.pop();if(!u)return toast('Nothing to undo');S=Object.assign(FRESH_TASTE(),JSON.parse(u.snap),{history:(S.history||[]).slice(1),sp:S.sp}) /* keep live Spotify tokens: the snapshot's refresh token may have rotated since */;save();DECK.unshift(u.t);renderDeck();hud();toast('Undid last swipe')}

function renderAll(){hud();renderDeck()}
/* rows */
function rowHTML(t,extra=''){reg(t);return `<div class="item" data-row="${t.id}">${t.art?`<img src="${esc(art100(t))}" alt="">`:'<img alt="">'}<div class="m"><b>${esc(t.t)}</b><span>${esc(t.a)}</span></div>${extra}<button class="sm" data-save="${t.id}" aria-label="Save to Spotify">${IC.heart}</button><button class="sm" data-play="${t.id}" aria-label="Play">${IC.play}</button></div>`}
const art100=t=>t.art||'';
function bars(el,rows,fmt=v=>v.toFixed(0)){const mx=Math.max(...rows.map(r=>Math.abs(r[1])),.001);el.innerHTML=rows.length?rows.map(([l,v])=>`<div class="bar"><span>${esc(l)}</span><u><i style="width:${Math.max(5,Math.abs(v)/mx*100)}%"></i></u><span>${fmt(v)}</span></div>`).join(''):'<span class="sub">No signal yet — swipe a few cards.</span>'}
/* views */

function rForYou(){const l=recommend(14);$('#forList').innerHTML=l.length?l.map(t=>rowHTML(t)).join(''):'<p class="sub">Swipe a few songs first.</p>';sync()}
function rDaily(){const t=dailyPick();$('#dSub').textContent=`One song a day, chosen from your taste. Streak: ${S.streak.count||1} day${(S.streak.count||1)>1?'s':''}.`;if(!t)return;reg(t);$('#dailyBox').innerHTML=`<div class="hero">${t.art?`<img src="${esc(artOf(t))}" alt="">`:'<img alt="">'}<div><span class="why" style="background:var(--line)">${esc(reasonFor(t))}</span><h2>${esc(t.t)}</h2><p style="color:var(--dim)">${esc(t.a)}${t.y?' · '+t.y:''}</p><div class="wave" data-id="${t.id}" style="margin:18px 0;height:44px">${wave(t,56)}</div><div class="rowb"><button class="btn" data-play="${t.id}">Play</button><button class="btn ghost" data-save="${t.id}">Save to Spotify</button></div></div></div>`;sync()}

function rTaste(){const n=S.likes+S.nopes+S.skips;$('#readout').innerHTML=tasteReadout();$('#stats').innerHTML=`<div><b>${S.likes}</b><span>liked</span></div><div><b>${S.skips}</b><span>mid</span></div><div><b>${S.nopes}</b><span>disliked</span></div>`;bars($('#gBars'),topGenres(6));bars($('#fBars'),Object.entries(S.feat),v=>Math.round(v*100)+'%');$('#likedList').innerHTML=S.liked.length?S.liked.slice(0,12).map(t=>rowHTML(t)).join(''):'<span class="sub">Nothing liked yet.</span>';renderSpStatus();sync()}

function renderMoodChips(){}
/* events */
document.addEventListener('error',e=>{if(e.target.tagName==='IMG')e.target.classList.add('img-fail')},true);
document.addEventListener('click',e=>{const p=e.target.closest('[data-play]'),s=e.target.closest('[data-save]'),m=e.target.closest('[data-mood]');if(p&&!p.closest('.card')){auto=true;playTrack(T.get(p.dataset.play))}else if(p)playTrack(T.get(p.dataset.play));if(s)saveToSpotify(T.get(s.dataset.save));if(m){curMood=m.dataset.mood;rMoods()}});
$('#nav').onclick=e=>{const b=e.target.closest('button');if(b)go(b.dataset.v)};
$('#bLike').onclick=()=>vote('like');$('#bNope').onclick=()=>vote('nope');$('#bSkip').onclick=()=>vote('skip');$('#bUndo').onclick=undo;
$('#bLike').innerHTML=IC.heart;$('#bNope').innerHTML=IC.x;$('#bSkip').innerHTML=IC.skip;$('#bUndo').innerHTML=IC.undo;
document.addEventListener('keydown',e=>{if(/INPUT|TEXTAREA/.test(e.target.tagName)||view!=='discover'||$('#onboard').classList.contains('open'))return;const k=e.key;if(k==='ArrowRight')vote('like');else if(k==='ArrowLeft')vote('nope');else if(k==='ArrowUp'){e.preventDefault();openCard()}else if(k==='ArrowDown'){e.preventDefault();vote('skip')}else if(k===' '){e.preventDefault();auto=true;DECK[0]&&playTrack(DECK[0])}else if(k.toLowerCase()==='z')undo()});
$('#savePl').onclick=()=>{const l=buildMood(curMood);if(l.length)savePlaylist(MOODS[curMood].name,l)};
$('#spSave').onclick=()=>{S.sp.clientId=$('#spClient').value.trim();S.sp.redirect=$('#spRedirect').value.trim()||SP.redirect();save();toast('Saved','ok')};
$('#spotifyBtn').onclick=()=>SP.begin();$('#spOff').onclick=()=>{SP.disconnect();renderSpStatus();toast('Disconnected')};
$('#exp').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(exportSnapshot(),null,2)],{type:'application/json'}));a.download='cadence-taste.json';a.click()};
$('#rst').onclick=async()=>{if(confirm('Wipe your taste, history and Spotify link?')){clearTimeout(saveTimer);clearTimeout(pushT);if(sb&&sbUser){try{await sb.from('cadence_profiles').delete().eq('user_id',sbUser.id);await sb.auth.signOut()}catch(e){}}['cadence.onboarded','cadence.sp','cadence.pkce','cadence.state','cadence.afterSp','cadence.coach','cadence.toured'].forEach(k=>{try{localStorage.removeItem(k)}catch(e){}});localStorage.removeItem(STORE_KEY);location.href=location.pathname}};
async function init(){addToPool(SEED.map(s=>Object.assign({},s,{f:inferFeatures(s)})));ensureDeck();renderDeck();hud();
if(S.sp.clientId)$('#spClient').value=S.sp.clientId;if(/\/\/localhost/.test(S.sp.redirect||''))S.sp.redirect='';if(!S.sp.redirect)S.sp.redirect=SP.redirect();$('#spRedirect').value=S.sp.redirect;renderSpStatus();
if(location.search.includes('code=')||location.search.includes('error=')){localStorage.setItem('cadence.onboarded','1');await SP.handleReturn();if(localStorage.getItem('cadence.afterSp')){localStorage.removeItem('cadence.afterSp');startOb(3)}}
const demo=new URLSearchParams(location.search).has('demo');
if(!demo&&!localStorage.getItem('cadence.onboarded')&&S.likes+S.nopes+S.skips===0)startOb();
else if(!demo&&S.seeds&&S.seeds.length&&POOL.length<40)seedPool(S.seeds).then(a=>{if(a){ensureDeck();renderDeck()}});
}
/* ---- v2 ---- */
function topGenres(n){return Object.entries(S.genre).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]).slice(0,n)}
function tasteReadout(){const n=S.likes+S.nopes+S.skips;if(!n)return profileLine();const f=S.feat,a=Object.values(S.artist).filter(x=>x.score>0).sort((x,y)=>y.score-x.score)[0];return profileLine()+(a?` You keep coming back to <b>${esc(a.name)}</b>.`:'')+` <span style="color:var(--dim)">(${n} swipes in)</span>`}
SP.redirect=function(){return(S.sp.redirect&&!/\/\/localhost/.test(S.sp.redirect))?S.sp.redirect:location.origin.replace('//localhost','//127.0.0.1')+location.pathname};
const redirShown=()=>location.protocol==='file:'?'http://127.0.0.1:8000/':SP.redirect();
const CK=sv('<path d="M5 12.500l4.500 4.500L19 7"/>',0).replace('<svg','<svg class="ck"');
const NAV={discover:'<rect x="5" y="4" width="14" height="16" rx="3"/>',foryou:'<path d="M12 3l2.200 5.800L20 11l-5.800 2.200L12 19l-2.200-5.800L4 11l5.800-2.200z"/>',daily:'<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.600 5.600L7 7M17 17l1.400 1.400M5.600 18.400L7 17M17 7l1.400-1.400"/>',moods:'<circle cx="12" cy="12" r="9"/><path d="M8 14s1.500 2 4 2 4-2 4-2M9 9.500v.01M15 9.500v.01"/>',taste:'<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>'};
const MI={chill:'<path d="M3 9c3-3 6 3 9 0s6 3 9 0M3 15c3-3 6 3 9 0s6 3 9 0"/>',focus:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',workout:'<path d="M13 3L5 13h6l-1 8 8-10h-6z"/>',party:NAV.foryou,sad:'<path d="M7 14a4 4 0 1 1 1-7.900A5 5 0 0 1 18 8.500a3 3 0 0 1-1 5.500zM9 17l-1 3M13 17l-1 3M17 17l-1 3"/>',happy:NAV.daily,sleep:'<path d="M20 14.500A8 8 0 0 1 9.500 4 8 8 0 1 0 20 14.500z"/>',nostalgic:'<path d="M11 6l-7 6 7 6zM20 6l-7 6 7 6z"/>'};
$$('#nav button').forEach(b=>{const l=b.textContent;b.innerHTML=sv(NAV[b.dataset.v])+'<span>'+l+'</span>';b.setAttribute('aria-label',l)});
const VI={like:['heart','var(--like)'],nope:['x','var(--nope)'],skip:['skip','var(--mid)']};
const STAGES=[[0,'Getting started'],[10,'Finding your lane'],[25,'Getting personal'],[40,'Dialed in']],nSw=()=>S.likes+S.nopes+S.skips;
const stage=()=>STAGES.filter(s=>nSw()>=s[0]).pop()[1];
function nextUnlock(){const n=nSw();return n<10?`${10-n} swipes until moods sharpen`:n<25?`${25-n} swipes until For you gets personal`:n<40?`${40-n} swipes until fully tuned`:'Fully tuned. Every swipe still refines it.'}
function archetype(){const f=S.feat,hi=f.energy>.58,up=f.valence>.55;if(Math.abs(f.energy-.5)<.08&&Math.abs(f.valence-.5)<.08)return'Open-Eared Explorer';return hi?(up?'Daylight Dancer':'Night-Drive Intensity'):(up?'Golden-Hour Drifter':'Midnight Introvert')}
function profileLine(){const f=S.feat,g=topGenres(2).map(x=>x[0]);return`Leaning <b>${f.energy>.62?'high-energy':f.energy<.42?'mellow':'mid-tempo'}</b>, <b>${f.valence>.62?'upbeat':f.valence<.42?'moody':'balanced'}</b> and <b>${f.acousticness>.55?'acoustic':'electronic'}</b>${g.length?`, starting with <b>${esc(g.join(' and '))}</b>`:''}.`}
function hud(){$('#mbar').style.width=strength()*100+'%';$('#mlabel').textContent=stage();rInsights()}
function rInsights(){const g=topGenres(3),h=new Date().getHours(),hi=h<5?'Late night':h<12?'Good morning':h<18?'Good afternoon':'Good evening',sk=streakNow();
$('#strip').innerHTML=`<b>${archetype()}</b><span>${g[0]?esc(g[0][0])+' · ':''}${sk?sk+' day streak':'start a streak'}</span>`;
$('#insL').innerHTML=`<small>${hi}</small><h3>${archetype()}</h3><div class="read2">${nSw()?tasteReadout():profileLine()}</div><div id="insBars" style="margin:16px 0 10px"></div><small>${nextUnlock()}</small>${SP.connected()?'':'<br><button class="btn ghost" id="insSp" style="margin-top:18px">Connect Spotify</button>'}`;bars($('#insBars'),g);const b=$('#insSp');if(b)b.onclick=connectSpotify;
const rec=(S.history||[]).slice(0,5);$('#insR').innerHTML='<small>Recent swipes</small>'+(rec.length?rec.map(h=>{const[v,c]=VI[h.verdict]||VI.skip;return`<div class="rec"><img src="${esc(h.track.art||'')}" alt=""><div class="m"><b>${esc(h.track.t)}</b><span>${esc(h.track.a)}</span></div><span style="color:${c}">${IC[v]}</span></div>`}).join(''):'<p class="sub" style="margin-top:10px;font-size:14px">Your swipes show up here, with Z to undo.</p>')}
function go(v){view=v;$$('.view').forEach(e=>e.classList.toggle('on',e.id==='v-'+v));$$('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.v===v));({foryou:rForYou,daily:rDaily,moods:rMoods,taste:rTaste,discover:()=>{rInsights();if(auto&&DECK[0]&&nowId==null)playTrack(DECK[0])}})[v]();audio.loop=v==='discover'}
function rMoods(){$('#moodChips').innerHTML=Object.entries(MOODS).map(([k,m])=>`<button class="chip ${k===curMood?'on':''}" data-mood="${k}">${sv(MI[k])}${m.name}</button>`).join('');$('#moodList').innerHTML=buildMood(curMood).map(t=>rowHTML(t)).join('');sync()}
function renderSpStatus(){const c=SP.connected();let w='';if(!c){if(location.protocol==='file:')w=' You opened this as a file. Run python3 -m http.server 8000 in this folder, then open http://127.0.0.1:8000/';else if(location.hostname==='localhost')w=' Open this page at 127.0.0.1 instead of localhost. Spotify rejects localhost.'}
$('#spStat').textContent=c?'Connected. Likes save to Spotify and your top artists seed your taste.':'Seeds your taste from your top artists and saves songs and playlists. The redirect URI must be http://127.0.0.1:PORT/ or https.'+w;$('#spotifyBtn').textContent=c?'Spotify connected':'Connect';$('#spOff').style.display=c?'':'none'}
function connectSpotify(){const o=$('#onboard').classList.contains('open');if(!SP.available()||!S.sp.clientId){if(o)obSp();else{go('taste');$('#spClient').focus()}toast(!SP.available()?'Spotify needs the page served over http':'Add your Spotify Client ID first','err');return}localStorage.setItem('cadence.afterSp','1');SP.begin()}
$('#spotifyBtn').onclick=connectSpotify;
/* onboarding */
let obStep=0,obBase='{}',ob={e:.5,v:.5,a:.5,era:null};const OBN=5,ERAS=[['Right now',2023],['2010s',2015],['2000s',2005],['90s',1995],['Older',1980],['Mix it up',0]];
const pcText=()=>picked.size>=3?`${picked.size} picked. Nice range.`:`${picked.size} of 3 picked for the sharpest start`;
const obNav=(back,label,dis)=>`<div class="obnav">${back?'<button class="btn ghost" data-a="back">Back</button>':''}<span class="sp"></span><button class="btn" data-a="next" ${dis?'disabled':''}>${label}</button></div>`;
const sl=(k,a,b)=>`<div class="sl"><div><span>${a}</span><span>${b}</span></div><input type="range" min="0" max="100" value="${ob[k]*100}" data-k="${k}" aria-label="${a} to ${b}"></div>`;
function startOb(step=0,skipApply){obStep=step;obBase=JSON.stringify(S.genre);$('#onboard').classList.add('open');rOb()}
function applyOb(){S.genre=JSON.parse(obBase);S.feat.energy=ob.e;S.feat.valence=ob.v;S.feat.acousticness=ob.a;S.feat.danceability=clamp(ob.e*.6+ob.v*.4);picked.forEach(i=>{S.genre[SEEDS[i].g]=(S.genre[SEEDS[i].g]||0)+1.5});if(ob.era)S.era.mean=ob.era;S.seeds=[...picked].map(i=>SEEDS[i].term);save()}
function obSp(){const w=location.protocol==='file:'?'<p>You opened this as a file. Run <code>python3 -m http.server 8000</code> in this folder, then open <code>http://127.0.0.1:8000/</code>.</p>':location.hostname==='localhost'?`<p>Open <code>${esc(location.href.replace('//localhost','//127.0.0.1'))}</code> instead. Spotify rejects localhost.</p>`:'';
$('#obSp').innerHTML=`<div class="spbox"><b>Connect Spotify in 3 steps</b><ol><li>Create an app at <code>developer.spotify.com/dashboard</code>. The owner needs Spotify Premium.</li><li>Add this exact Redirect URI: <code>${esc(redirShown())}</code></li><li>Paste the app's Client ID:</li></ol><input id="obCid" placeholder="Client ID" value="${esc(S.sp.clientId)}"><button class="btn" data-a="spgo">Connect</button>${w}</div>`}
function rOb(){if(obStep===4&&(!sb||sbUser)){finishOb();return}$('#dots').innerHTML=Array.from({length:OBN},(_,i)=>`<i class="${i<=obStep?'on':''}"></i>`).join('');const el=$('#obStep');let h='';
if(obStep===0)h=`<div class="eq">${Array.from({length:22},(_,i)=>`<i style="animation-delay:${-i*.11}s;animation-duration:${.8+(i%5)*.15}s"></i>`).join('')}</div><h1>Your next favorite song is one swipe away.</h1><p class="sub">Four quick steps teach Cadence your taste. Everything stays on this device.</p><div class="obnav"><button class="btn" data-a="next">Get started</button><button class="btn ghost" data-a="sp">Connect Spotify</button></div><div id="obSp"></div><button class="lnk" data-a="skip">Skip setup</button>`;
else if(obStep===1)h=`<h1>What do you reach for?</h1><p class="sub" id="pc">${pcText()}</p><div class="chips">${SEEDS.map((s,i)=>`<button class="chip pop ${picked.has(i)?'on':''}" style="--i:${i}" data-i="${i}">${CK}${esc(s.label)}</button>`).join('')}</div>${obNav(1,'Continue',!picked.size)}`;
else if(obStep===2)h=`<h1>Set the mood.</h1><p class="sub">Drag to where you usually land. No wrong answers.</p>${sl('e','Calm','Energetic')}${sl('v','Moody','Upbeat')}${sl('a','Electronic','Acoustic')}<p class="sub" style="margin:26px 0 10px">Favorite era</p><div class="chips">${ERAS.map(([l,y])=>`<button class="chip ${ob.era===y?'on':''}" data-era="${y}">${l}</button>`).join('')}</div>${obNav(1,'See my profile')}`;
else if(obStep===3){const f=S.feat;h=`<small style="color:var(--dim)">Your starting profile</small><div class="reveal">${archetype()}</div><p class="pl">${profileLine()}</p><div>${[['Energy',f.energy],['Positivity',f.valence],['Acoustic',f.acousticness],['Danceable',f.danceability]].map(([l,v])=>`<div class="bar"><span>${l}</span><u><i data-w="${Math.round(v*100)}%"></i></u><span>${Math.round(v*100)}%</span></div>`).join('')}</div><p class="sub" style="margin-top:16px;font-size:14px">This sharpens with every swipe.</p><div class="obnav"><button class="btn ghost" data-a="back">Back</button><span class="sp"></span><button class="btn" data-a="next">Continue</button></div>`}
if(obStep===4)h=obAccount();
el.style.animation='none';void el.offsetWidth;el.style.animation='';el.innerHTML=h;if(obStep===3)setTimeout(()=>$$('#obStep [data-w]').forEach(i=>i.style.width=i.dataset.w),120)}
$('#obStep').addEventListener('click',e=>{const t=e.target.closest('[data-a],[data-i],[data-era]');if(!t)return;
if(t.dataset.i!==undefined){const i=+t.dataset.i;picked.has(i)?picked.delete(i):picked.add(i);t.classList.toggle('on');$('#pc').textContent=pcText();$('[data-a=next]').disabled=!picked.size;return}
if(t.dataset.era!==undefined){const y=+t.dataset.era;ob.era=ob.era===y?null:y;$$('[data-era]').forEach(b=>b.classList.toggle('on',ob.era!==null&&+b.dataset.era===ob.era));return}
const a=t.dataset.a;if(a==='next'){obStep++;if(obStep===3)applyOb();rOb()}else if(a==='back'){obStep--;rOb()}else if(a==='done'||a==='skip')finishOb();else if(a==='sp')(S.sp.clientId&&SP.available())?connectSpotify():obSp();else if(a==='spgo'){S.sp.clientId=$('#obCid').value.trim();S.sp.redirect=SP.redirect();save();S.sp.clientId?connectSpotify():toast('Paste your Client ID','err')}});
$('#obStep').addEventListener('input',e=>{if(e.target.dataset.k)ob[e.target.dataset.k]=e.target.value/100});


/* ---- Supabase accounts + sync ---- */
const SB_URL='https://xbybsbrpwywxvwgovaer.supabase.co',SB_KEY='sb_publishable_mlDl7YG1GXl5LnEHX7lcGw_wY5WGC_m';
let sbW=0;const warnOnce=m=>{if(!sbW++)toast('Sync failed: '+m,'err')};let sb=null,sbUser=null,pushT=null;
const _save=save;save=function(){if(nSw())S.updatedAt=Date.now();_save();if(sbUser){clearTimeout(pushT);pushT=setTimeout(sbPush,2500)}};
/* Remote wins if local is empty, else if newer by timestamp; rows without one fall back to swipe count. */
const remoteWins=r=>{const n=r.likes+r.nopes+r.skips;if(!nSw())return n>0;const rt=r.updatedAt||0,lt=S.updatedAt||0;return rt||lt?rt>lt:n>nSw()};
after('rInsights',()=>{if(sb&&!sbUser)$('#insL').insertAdjacentHTML('beforeend','<br><button class="btn ghost" id="insAcc" style="margin-top:12px">Sign in to sync</button>');const b=$('#insAcc');if(b)b.onclick=()=>{go('taste');const i=$('#acEmail');if(i)i.focus()}});
async function sbPush(){if(!sbUser)return;const t=Object.assign({},S);delete t.sp;const{error}=await sb.from('cadence_profiles').upsert({user_id:sbUser.id,taste:t,updated_at:new Date().toISOString()});if(error)warnOnce(error.message)}
async function sbPull(){const{data,error}=await sb.from('cadence_profiles').select('taste').maybeSingle();if(error)return warnOnce(error.message);const r=data&&data.taste;
if(r&&remoteWins(r)){const f=FRESH_TASTE();S=Object.assign(f,r,{feat:Object.assign(f.feat,r.feat||{}),era:Object.assign(f.era,r.era||{}),sp:S.sp});localStorage.setItem('cadence.onboarded','1');$('#onboard').classList.remove('open');_save();DECK=[];ensureDeck();renderAll();toast('Synced from your account','ok')}else await sbPush()}
function rAcct(){const el=$('#acBox');if(!el)return;el.innerHTML=sbUser?`<p class="sub" style="margin-bottom:12px">Signed in as ${esc(sbUser.email)}. Your taste syncs across devices.</p><div class="rowb"><button class="btn" data-ac="sync">Sync now</button><button class="btn ghost" data-ac="out">Sign out</button></div>`:`<p class="sub" style="margin-bottom:10px">Save your taste and use it on any device.</p><button class="btn" data-ac="google" style="width:100%;margin-bottom:12px">Continue with Google</button><label>Or use email</label><input id="acEmail" type="email" autocomplete="email"><label>Password</label><input id="acPass" type="password" autocomplete="current-password" placeholder="6+ characters"><div class="rowb"><button class="btn" data-ac="in">Sign in</button><button class="btn ghost" data-ac="up">Create account</button></div>`}
async function sbAuth(m){const email=$('#acEmail').value.trim(),password=$('#acPass').value;if(!email||password.length<6)return toast('Enter an email and a 6+ character password','err');
const r=m==='up'?await sb.auth.signUp({email,password}):await sb.auth.signInWithPassword({email,password});if(r.error)return toast(r.error.message,'err');if(!r.data.session)toast('Check your email to confirm, then sign in','ok')}
async function sbInit(){if(!window.supabase)return;sb=window.supabase.createClient(SB_URL,SB_KEY,{auth:{flowType:'implicit'}}); /* implicit: tokens return in #hash, so Spotify's ?code= handler never sees them */
$('#spStat').closest('.panel').insertAdjacentHTML('beforebegin','<div class="panel"><h3>Account</h3><div id="acBox"></div></div>');
$('#acBox').addEventListener('click',async e=>{const a=e.target.dataset.ac;if(a==='google'){if(location.protocol==='file:')return toast('Google sign-in needs the hosted app','err');const{error}=await sb.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+location.pathname}});if(error)toast(error.message,'err')}else if(a==='in'||a==='up')sbAuth(a);else if(a==='out')await sb.auth.signOut();else if(a==='sync'){await sbPull();toast('Synced','ok')}});
sb.auth.onAuthStateChange((ev,s)=>{sbUser=s?s.user:null;rAcct();rInsights();if(ev==='SIGNED_IN'||ev==='INITIAL_SESSION'){if(sbUser)sbPull()}});rAcct()}
if(window.supabase)sbInit();else addEventListener('load',function(){if(window.supabase)sbInit()});

/* ---- v3: playing cards, deal, riffle shuffle, guest/sign-in ---- */
const hasWA=!!document.documentElement.animate,vib=p=>navigator.vibrate&&navigator.vibrate(p);
const SUIT={d:'<path d="M12 2l7 10-7 10-7-10z"/>',c:'<circle cx="12" cy="7" r="4.2"/><circle cx="6.8" cy="14" r="4.2"/><circle cx="17.2" cy="14" r="4.2"/><path d="M10.8 14h2.4l1.6 7H9.200z"/>',h:'<path d="M12 21S3 15 3 9a4.500 4.500 0 0 1 9-1.500A4.500 4.500 0 0 1 21 9c0 6-9 12-9 12z"/>',s:'<path d="M12 2C8 7 4 9.500 4 13a4 4 0 0 0 7 2.500L10 21h4l-1-5.500A4 4 0 0 0 20 13c0-3.500-4-6-8-11z"/>'};
const suitOf=t=>{const f=t.f||inferFeatures(t),hi=f.energy>.55,up=f.valence>.55;return hi?(up?'d':'c'):(up?'h':'s')};
function cardHTML(t){reg(t);const k=suitOf(t),m=Math.round(clamp(scoreTrack(t)*1.4)*100);return `<div class="card" data-id="${t.id}"><div class="in"><div class="face" style="background:linear-gradient(160deg,hsl(${hue(t)} 55% 35%),#1a1326)">${t.art?`<img src="${esc(artOf(t))}" alt="" draggable="false">`:''}<div class="frame"></div><div class="idx s-${k}" aria-label="Match ${m}"><span>${m}</span><svg viewBox="0 0 24 24" fill="currentColor">${SUIT[k]}</svg><small>match</small></div><div class="stamp like">Like</div><div class="stamp nope">Nope</div><div class="stamp mid">Mid</div><div class="info"><span class="why">${esc(reasonFor(t))}</span><h2>${esc(t.t)}</h2><p>${esc(t.a)}</p><small>${esc(t.g||'')}${t.y?' · '+t.y:''}</small><div class="row2"><div class="wave" data-id="${t.id}">${wave(t)}</div><button class="pbtn" data-play="${t.id}" aria-label="Play">${IC.play}</button></div></div></div><div class="back"><div class="mark">c<i>.</i></div></div></div></div>`}
let firstDeal=true,shuffling=false,cold=0;
function renderDeck(d){const el=$('#deck');if(!DECK.length){el.innerHTML='<div class="empty"><b>Finding more tracks…</b><span>Your next batch is loading.</span></div>';refillPool().then(a=>{if(a){ensureDeck();renderDeck()}});setBg(null);return}
const dl=d===true||d==='pile'||(d===undefined&&firstDeal);firstDeal=false;el.innerHTML=DECK.slice(0,3).reverse().map(cardHTML).join('');drag(el.lastElementChild,DECK[0]);setBg(DECK[0]);sync();
if(dl)dealAnim(d==='pile'?'pile':'corner');else if(auto&&view==='discover')ensurePlaying(DECK[0])}
function dealAnim(origin){const cs=$$('#deck .card'),n=cs.length,REST=[['translateY(0) scale(1)','0deg'],['translateY(14px) scale(.95)','-3deg'],['translateY(26px) scale(.9)','2.5deg']],rf=$('#riffle');if(rf)rf.remove();
cs.forEach((c,i)=>{const r=REST[n-1-i],s=i%2?1:-1;c.classList.add('down');
if(hasWA){const pile=origin==='pile',from=pile?{transform:'translateY(0) scale(.92)',rotate:'0deg',opacity:1}:{transform:'translate(180px,-420px) scale(.55)',rotate:s*160+'deg',opacity:0},mid=pile?{transform:`translate(${s*40}px,-40px) scale(.98)`,rotate:-s*8+'deg',opacity:1,offset:.5}:{transform:`translate(${-s*30}px,-60px) scale(1.04)`,rotate:-s*10+'deg',opacity:1,offset:.6};
c.animate([from,mid,{transform:r[0],rotate:r[1],opacity:1}],{duration:700,delay:i*110,easing:'cubic-bezier(.2,.9,.25,1)',fill:'backwards'})}
setTimeout(()=>c.classList.remove('down'),i*110+(hasWA?560:0))});
setTimeout(()=>{if(auto&&view==='discover'&&DECK[0])ensurePlaying(DECK[0])},n*110+900);vib([6,40,6,40,10])}
function riffle(){return new Promise(res=>{if(!hasWA)return res();const st=$('.stage'),L=document.createElement('div'),N=12;L.id='riffle';L.innerHTML='<i class="cb"></i>'.repeat(N);st.appendChild(L);const cs=$$('.cb',L),w=$('#deck').offsetWidth;let done=0;
$$('#deck .card').forEach(c=>c.animate([{opacity:1},{opacity:0}],{duration:180,fill:'forwards'}));
cs.forEach((c,i)=>{const sd=i%2?1:-1,dx=sd*w*.46,rot=sd*9,y=-(i>>1)*1.5,P=`translate(${dx}px,${y}px) rotate(${rot}deg)`;c.style.zIndex=i;
c.animate([{transform:'translate(0,0)'},{transform:P}],{duration:260,easing:'cubic-bezier(.2,.8,.2,1)',fill:'forwards'}).onfinish=()=>{c.animate([{transform:P},{transform:`translate(${dx*.4}px,${y-34}px) rotate(${rot*.4}deg)`,offset:.45},{transform:`translate(0,${-i*1.4}px) rotate(${(Math.random()-.5)*2}deg)`}],{duration:300,delay:i*34,easing:'cubic-bezier(.3,.7,.3,1)',fill:'forwards'}).onfinish=()=>{if(++done===N)setTimeout(()=>{L.animate([{transform:'scale(1)'},{transform:'scale(1.05)',offset:.5},{transform:'scale(1)'}],{duration:180});setTimeout(res,170)},60)}}})})}
const GT={'Hip-Hop/Rap':'hip hop','R&B/Soul':'r&b','Alternative':'indie alternative','Dance':'dance','Electronic':'electronic'},MOD=['new','essentials','deep cuts','2020s','hits'];
function shuffleTerms(){const t=[],g=topGenres(3),pick=a=>a[Math.floor(Math.random()*a.length)];g.forEach(([x])=>t.push((GT[x]||x)+' '+pick(MOD)));t.push(pick(SEEDS).term);const ar=Object.values(S.artist).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,3);if(ar.length)t.push(pick(ar).name);if(!g.length)t.push(pick(SEEDS).term,pick(SEEDS).term);return t}
function pickFresh(n,ex){const pool=POOL.filter(t=>!seenHas(t.id)),fr=pool.filter(t=>!ex.has(t.id)),src=fr.length>=n+2?fr:pool;return src.map(t=>({t,s:scoreTrack(t)*.55+Math.random()*.6})).sort((a,b)=>b.s-a.s).slice(0,n).map(x=>x.t)}
async function shuffleDeck(){if(shuffling||view!=='discover')return;shuffling=true;cold=0;const b=$('#bShuf');b.classList.remove('nudge');b.classList.add('spin');stopAudio();vib([10,50,10,50,10,50,14]);
const f=Promise.race([seedPool(shuffleTerms()),new Promise(r=>setTimeout(r,2200))]).catch(()=>0);await Promise.all([riffle(),f]);
const ex=new Set(DECK.map(t=>t.id));DECK=pickFresh(8,ex);if(!DECK.length)DECK=recommend(8);ensureDeck();renderDeck('pile');b.classList.remove('spin');shuffling=false;toast('Fresh hand dealt')}
function drag(c,t){let sx,sy,dx=0,dy=0,on=0,mv=0;const st=k=>c.querySelector('.stamp.'+k),show=()=>{st('like').style.opacity=Math.max(0,dx/110);st('nope').style.opacity=Math.max(0,-dx/110);st('mid').style.opacity=Math.abs(dy)>Math.abs(dx)?Math.max(0,dy/110):0};
c.onpointerdown=e=>{if(e.target.closest('button'))return;on=1;mv=0;dx=dy=0;sx=e.clientX;sy=e.clientY;c.setPointerCapture(e.pointerId);c.style.transition='none';c.classList.add('dragging');auto=true};
c.onpointermove=e=>{if(!on)return;dx=e.clientX-sx;dy=e.clientY-sy;mv=Math.max(mv,Math.hypot(dx,dy));c.style.transform=`translate(${dx}px,${Math.max(dy,0)*.6}px) rotate(${dx/20}deg)`;c.style.setProperty('--dx',dx);show()};
c.onpointerup=c.onpointercancel=()=>{if(!on)return;on=0;c.style.transition='';c.classList.remove('dragging');if(dx>110)vote('like');else if(dx<-110)vote('nope');else if(dy>110)vote('skip');else{c.style.transform='';dx=dy=0;show();if(mv<8)playTrack(t)}}}
const _commit=commit;commit=function(t,v,c){_commit(t,v,c);vib(v==='like'?[8,30,8]:8);const co=$('#coach');if(co){co.remove();localStorage.setItem('cadence.coach','1')}cold=v==='like'?0:cold+1;const b=$('#bShuf');if(cold>=4&&!b.classList.contains('nudge')){b.classList.add('nudge');toast('Not feeling these? Try shuffle.')}};
$('#bShuf').innerHTML=sv('<path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>');$('#bShuf').onclick=shuffleDeck;
document.addEventListener('keydown',e=>{if(!/INPUT|TEXTAREA/.test(e.target.tagName)&&e.key.toLowerCase()==='s'&&view==='discover')shuffleDeck()});
if(!localStorage.getItem('cadence.coach'))$('.stage').insertAdjacentHTML('beforeend','<div id="coach">Swipe right to like · left to pass · down for mid · up to play it whole on Spotify</div>');
function finishOb(){localStorage.setItem('cadence.onboarded','1');$('#onboard').classList.remove('open');auto=true;DECK=[];ensureDeck();go('discover');renderDeck(true);hud();if(S.seeds&&S.seeds.length)seedPool(S.seeds).then(a=>{if(a&&!nSw()){DECK=[];ensureDeck();renderDeck()}})}
/* onboarding: account step */
const obAccount=()=>`<h1 style="margin-top:auto">Keep your taste.</h1><p class="sub">Sign in to carry it across devices, or stay a guest. Guest taste stays on this phone.</p><div><label>Email</label><input id="obE" type="email" autocomplete="email" inputmode="email"><label>Password</label><input id="obP" type="password" autocomplete="new-password" placeholder="6+ characters"></div><div class="obnav"><button class="btn" data-b="up" style="flex:1">Create account</button><button class="btn ghost" data-b="in" style="flex:1">Sign in</button></div><button class="lnk" data-b="guest" style="text-align:center;width:100%">Continue as guest</button>`;
async function sbAuthWith(m,email,password){if(!email||password.length<6){toast('Enter an email and a 6+ character password','err');return false}const r=m==='up'?await sb.auth.signUp({email,password}):await sb.auth.signInWithPassword({email,password});if(r.error){toast(r.error.message,'err');return false}if(!r.data.session)toast('Check your email to confirm. Continuing as guest for now.','ok');return true}
$('#obStep').addEventListener('click',async e=>{const b=e.target.closest('[data-b]');if(!b)return;if(b.dataset.b==='guest')return finishOb();b.disabled=true;const ok=await sbAuthWith(b.dataset.b,$('#obE').value.trim(),$('#obP').value);b.disabled=false;if(ok)finishOb()});


/* ================= v4 JS ================= */
const cl01=v=>Math.max(0,Math.min(1,v));
cardHTML=function(t){reg(t);const m=Math.round(clamp(scoreTrack(t)*1.4)*100),sc=m/100,sh=Math.round(225+sc*130);return `<div class="card" data-id="${t.id}" style="--sc:${sc};--sh:${sh}"><div class="glow"></div><div class="in"><div class="face" style="background:linear-gradient(160deg,hsl(${hue(t)} 55% 35%),#1a1326)">${t.art?`<img src="${esc(artOf(t))}" alt="" draggable="false">`:''}<div class="tint"></div><div class="score" aria-label="Taste match ${m} percent"><b>${m}<sup>%</sup></b><small>taste match</small></div><div class="info"><span class="why">${esc(reasonFor(t))}</span><div class="row2"><div class="ttl"><h2>${esc(t.t)}</h2><p>${esc(t.a)}</p></div><button class="pbtn" data-play="${t.id}" aria-label="Play">${IC.play}</button></div><div class="wave" data-id="${t.id}">${wave(t)}</div></div><div class="ov like">${IC.heart}<span>Love it</span></div><div class="ov nope">${IC.x}<span>Not for me</span></div><div class="ov mid">${IC.skip}<span>Mid</span></div><div class="ov open">${IC.spotify}<span>Play on Spotify</span></div><div class="scrim"></div></div></div></div>`};
renderDeck=function(d){const el=$('#deck');el.style.setProperty('--p',0);
if(!DECK.length){el.innerHTML='<div class="empty"><b>Finding more tracks…</b><span>Your next batch is loading.</span></div>';refillPool().then(a=>{if(a){ensureDeck();renderDeck()}});setBg(null);return}
const dl=d===true||d==='pile'||(d===undefined&&firstDeal);firstDeal=false;
el.innerHTML=DECK.slice(0,3).reverse().map(cardHTML).join('');drag(el.lastElementChild,DECK[0]);setBg(DECK[0]);sync();
if(dl)dealAnim();else{const cs=el.children;if(hasWA&&cs.length===3)cs[0].animate([{opacity:0}],{duration:380,easing:'ease-out',fill:'backwards'});if(auto&&view==='discover')ensurePlaying(DECK[0])}};
dealAnim=function(){const cs=$$('#deck .card');cs.forEach((c,i)=>{if(!hasWA)return;c.animate([{transform:'translateY(90px) scale(.86)',opacity:0}],{duration:800,delay:i*100,easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'})});
setTimeout(()=>{if(auto&&view==='discover'&&DECK[0])ensurePlaying(DECK[0])},cs.length*100+500);vib([8,40,8])};
riffle=function(){return new Promise(res=>{const cs=$$('#deck .card');if(!hasWA||!cs.length)return res();cs.forEach((c,i)=>c.animate([{transform:'translateY(-36px) scale(.9)',opacity:0}],{duration:380,delay:(cs.length-1-i)*60,easing:'cubic-bezier(.5,0,.75,.4)',fill:'forwards'}));setTimeout(res,380+cs.length*60)})};
drag=function(c,t){let sx,sy,dx=0,dy=0,on=0,mv=0,lx=0,lt=0,vx=0,vy=0,ly=0;const deck=$('#deck');
const show=()=>{const h=Math.abs(dx)>=Math.abs(dy)*.8;c.style.setProperty('--ol',h?cl01(dx/150):0);c.style.setProperty('--on',h?cl01(-dx/150):0);c.style.setProperty('--om',(!h&&dy>0)?cl01(dy/150):0);c.style.setProperty('--ou',(!h&&dy<0)?cl01(-dy/150):0);deck.style.setProperty('--p',cl01(Math.max(Math.abs(dx),Math.abs(dy))/220))};
c.onpointerdown=e=>{if(e.target.closest('button'))return;on=1;mv=0;dx=dy=0;vx=vy=0;sx=lx=e.clientX;sy=ly=e.clientY;lt=performance.now();c.setPointerCapture(e.pointerId);c.style.transition='none';c.classList.add('dragging');deck.classList.add('dragging');auto=true};
c.onpointermove=e=>{if(!on)return;dx=e.clientX-sx;dy=e.clientY-sy;mv=Math.max(mv,Math.hypot(dx,dy));const n=performance.now(),dt=Math.max(8,n-lt);vx=.7*vx+.3*(e.clientX-lx)/dt;vy=.7*vy+.3*(e.clientY-ly)/dt;lx=e.clientX;ly=e.clientY;lt=n;c.style.transform=`translate(${dx}px,${dy<0?dy:dy*.6}px) rotate(${dx/22}deg)`;show()};
c.onpointerup=c.onpointercancel=()=>{if(!on)return;on=0;c.classList.remove('dragging');deck.classList.remove('dragging');
if(dx>110||(vx>.6&&dx>35))return vote('like');if(dx<-110||(vx<-.6&&dx<-35))return vote('nope');
if(dy>110||(vy>.6&&dy>40&&Math.abs(dy)>Math.abs(dx)))return vote('skip');
const up=dy<-110||(vy<-.6&&dy<-40&&Math.abs(dy)>Math.abs(dx));
c.style.transition='transform .6s cubic-bezier(.34,1.45,.64,1)';c.style.transform='';dx=dy=0;show();if(!up&&mv<8)playTrack(t);
if(up)openCard()}};
flyOut=function(c,v){const k={like:[1,0],nope:[-1,0],skip:[0,1]}[v];c.classList.remove('dragging');c.style.transition='transform .45s cubic-bezier(.25,.8,.3,1),opacity .3s .08s';c.style.setProperty({like:'--ol',nope:'--on',skip:'--om'}[v],1);c.style.transform=`translate(${k[0]*(innerWidth+240)}px,${k[1]*innerHeight*.5}px) rotate(${k[0]*16}deg)`;c.style.opacity=0;$('#deck').style.setProperty('--p',1)};

/* ---- swipe up: open that exact track in Spotify ---- */
const SP_URI=new Map();
function spotifyMatch(items,t){
  const nt=norm(t.t),na=norm(t.a).split(',')[0].trim();let best=null,bs=-1;
  (items||[]).forEach(function(x,i){
    if(!x||!x.id)return;let sc=0;
    const xn=norm(x.name);
    if(xn===nt)sc+=3;else if(xn.indexOf(nt)>=0||nt.indexOf(xn)>=0)sc+=1.4;
    const xa=norm(((x.artists||[])[0]||{}).name);
    if(xa&&na&&(xa===na||xa.indexOf(na)>=0||na.indexOf(xa)>=0))sc+=2.2;
    sc-=i*0.05;
    if(sc>bs){bs=sc;best=x}
  });
  return best;
}
async function resolveSpotifyTrack(t){
  const key=String(t.id);
  if(t.spu)return t.spu;
  if(SP_URI.has(key))return SP_URI.get(key);
  if(!SP.connected())return null;
  const q='track:'+t.t+' artist:'+String(t.a).split(',')[0];
  const res=await SP.api('/search?type=track&limit=5&q='+encodeURIComponent(q));
  const hit=spotifyMatch(res&&res.tracks&&res.tracks.items,t);
  if(!hit)return null;
  const uri='spotify:track:'+hit.id;
  SP_URI.set(key,uri);t.spu=uri;
  return uri;
}
function openOnSpotify(t){
  if(!t)return;
  /* remember it, so a refresh keeps this card on top for continuity */
  try{S.up=summarize(t);save()}catch(e){}
  const searchUrl='https://open.spotify.com/search/'+encodeURIComponent(t.t+' '+t.a);
  toast(SP.connected()?'Opening in Spotify…':'Opening Spotify search…');
  resolveSpotifyTrack(t).then(function(uri){
    const url=uri?('https://open.spotify.com/track/'+uri.split(':').pop()):searchUrl;
    try{window.open(url,'_blank','noopener')}catch(e){try{window.open(searchUrl,'_blank')}catch(_){}}
  }).catch(function(){try{window.open(searchUrl,'_blank','noopener')}catch(e){}});
}
function openCard(){const t=DECK[0];if(!t)return;auto=true;openOnSpotify(t)}
const _commitU=commit;commit=function(t,v,c){if(S.up&&String(S.up.id)===String(t.id)){S.up=null;try{save()}catch(e){}}_commitU.apply(this,arguments)};
/* page transitions + sliding nav pill */
const ORDER=['discover','foryou','moods','game','taste'],ind=document.createElement('i');ind.id='navInd';$('#nav').prepend(ind);
let ix=0,iw=0,ih=0,ir=0,first=true;
function moveInd(snap){cancelAnimationFrame(ir);const f=()=>{const b=$('#nav button.on');if(!b)return;const tx=b.offsetLeft,tw=b.offsetWidth,k=(first||snap===2)?1:.2;first=false;ix+=(tx-ix)*k;iw+=(tw-iw)*k;ind.style.transform=`translate(${ix}px,${b.offsetTop}px)`;ind.style.width=iw+'px';ind.style.height=b.offsetHeight+'px';if(Math.abs(tx-ix)>.4||Math.abs(tw-iw)>.4)ir=requestAnimationFrame(f);else{ix=tx;iw=tw}};f()}
if(window.ResizeObserver)new ResizeObserver(()=>moveInd(2)).observe($('#nav'));
addEventListener('resize',()=>moveInd(2));
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>moveInd(2));
requestAnimationFrame(()=>moveInd(2));

/* ================= v5 JS ================= */
const FLAME=sv('<path d="M12 3c1 3.500 5 5.500 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 .3 1.500 1 2 2 2 0-3-.5-5 1-8z"/>');
const dayKey=(o=0)=>{const d=new Date(Date.now()-o*864e5),p=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())};
const hash32=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
const uniqT=a=>{const s=new Set();return a.filter(t=>t&&t.p&&!s.has(String(t.id))&&s.add(String(t.id)))};
const sameT=(a,b)=>String(a.id)===String(b.id)||(norm(a.t)===norm(b.t)&&norm(a.a).split(' ')[0]===norm(b.a).split(' ')[0]);
const matchOf=t=>Math.round(clamp(scoreTrack(t)*1.4)*100);
const hueOf=m=>Math.round(225+m/100*130);
const vib2=p=>{try{navigator.vibrate&&navigator.vibrate(p)}catch(e){}};
/* ---- state migration ---- */
(function(){if(!S.streak||S.streak.v!==2)S.streak={last:null,count:0,days:[],v:2};S.mids=S.mids||[];if(!S.mids.length)S.mids=(S.history||[]).filter(h=>h.verdict==='skip').map(h=>summarize(h.track)).slice(0,40);
S.game=S.game||{day:null,level:null,ans:null,guesses:[],done:false,won:false,pts:0,stats:{played:0,wins:0,streak:0,best:0,lastWin:null,pts:0}};if(S.impK==null)S.impK=1;if(S.daily&&!S.daily.t)S.daily=null})();
const streakNow=()=>{const s=S.streak;if(!s||!s.last)return 0;return(s.last===dayKey()||s.last===dayKey(1))?s.count:0};
/* ---- dual taste profile: organic (swipes) vs inorganic (Spotify import) ---- */
const newProf=()=>({n:0,genre:{},artist:{},kw:{},feat:{energy:.5,valence:.5,acousticness:.5,danceability:.5},era:{mean:2012,w:0},tracks:[],at:0});
function impLearn(t){const P=S.imp,f=t.f||inferFeatures(t),lr=.1;for(const k in P.feat)P.feat[k]=clamp(P.feat[k]*(1-lr)+f[k]*lr);const g=t.g||'default';P.genre[g]=(P.genre[g]||0)+1;const ak=norm(t.a).split(',')[0].trim()||norm(t.a);if(ak){const c=P.artist[ak]||{name:t.a.split(',')[0].trim(),score:0,count:0};c.score+=1;c.count++;P.artist[ak]=c}if(t.y){P.era.mean=P.era.mean*.9+t.y*.1;P.era.w++}for(const w of keywordsOf(t.t))P.kw[w]=(P.kw[w]||0)+.5;P.n++}
const impEvidence=()=>S.imp?Math.min(S.imp.n,60)*.5*(S.impK==null?1:S.impK):0;
function impWeight(){if(!S.imp||!S.imp.n)return 0;const i=impEvidence(),o=S.likes+S.nopes+S.skips;return i+o?clamp(i/(i+o),0,.85):0}
const _score0=scoreTrack;
scoreTrack=function(t){const w=impWeight();if(!w)return _score0(t);const o=_score0(t),real=S;S=Object.assign({},real,{genre:real.imp.genre,artist:real.imp.artist,kw:real.imp.kw,feat:real.imp.feat,era:real.imp.era});let i;try{i=_score0(t)}finally{S=real}return o*(1-w)+i*w};
const _fb=refillPool;
/* ---- sheet ---- */
const SHEET=$('#sheet'),SP2=$('#sheet .sp');
function openSheet(html,after){$('#sheet .sc').innerHTML=html;SP2.style.transform='';SHEET.classList.add('open');requestAnimationFrame(()=>requestAnimationFrame(()=>SHEET.classList.add('show')));if(after)after();vib2(6)}
function closeSheet(){SHEET.classList.remove('show');SP2.style.transform='';setTimeout(()=>{if(!SHEET.classList.contains('show'))SHEET.classList.remove('open')},520)}
$('#sheet .sb').onclick=closeSheet;
addEventListener('keydown',e=>{if(e.key==='Escape'&&SHEET.classList.contains('open'))closeSheet()});
(function(){let on=0,sy=0,dy=0;const gw=$('#sheet .grabw');gw.onpointerdown=e=>{on=1;sy=e.clientY;dy=0;gw.setPointerCapture(e.pointerId);SP2.classList.add('drag')};
gw.onpointermove=e=>{if(!on)return;dy=Math.max(0,e.clientY-sy);if(innerWidth<721)SP2.style.transform=`translateY(${dy}px)`};
gw.onpointerup=gw.onpointercancel=()=>{if(!on)return;on=0;SP2.classList.remove('drag');if(dy>110)closeSheet();else SP2.style.transform=''}})();
/* ---- page transitions (rewritten: leaving view is never re-toggled, so nothing restarts / flashes) ---- */
const RENDER={foryou:()=>rForYou(),game:()=>rGame(),moods:()=>rMoods(),taste:()=>rTaste(),discover:()=>{rInsights();renderPill();if(auto&&DECK[0]&&nowId==null)playTrack(DECK[0])}};
go=function(v){if(!RENDER[v])v='discover';const old=$('.view.on:not(.leaving)'),nu=$('#v-'+v),pi=ORDER.indexOf(view),ni=ORDER.indexOf(v);
$$('.view.leaving').forEach(e=>{e.getAnimations().forEach(a=>a.cancel());e.classList.remove('on','leaving')});
if(view==='game'&&v!=='game')gStop();view=v;$$('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.v===v));audio.loop=v==='discover';
if(!old||old===nu||!hasWA){$$('.view').forEach(e=>e.classList.toggle('on',e===nu));nu.scrollTop=0;RENDER[v]();requestAnimationFrame(()=>moveInd());return}
const dir=ni>pi?1:-1;RENDER[v]();nu.scrollTop=0;nu.style.setProperty('--sy',0);
$$('.view').forEach(e=>{if(e!==nu&&e!==old)e.classList.remove('on')});old.classList.add('leaving');nu.classList.add('on');
old.animate([{opacity:1,transform:'none'},{opacity:0,transform:`translateX(${-dir*30}px) scale(.985)`}],{duration:240,easing:'cubic-bezier(.4,0,.8,.3)',fill:'forwards'}).onfinish=function(){if(old.id!=='v-'+view)old.classList.remove('on');old.classList.remove('leaving');this.cancel()};
nu.animate([{opacity:0,transform:`translateX(${dir*34}px)`},{opacity:1,transform:'none'}],{duration:500,delay:70,easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'});
requestAnimationFrame(()=>moveInd())};
$$('.view').forEach(v=>{let r=0;v.addEventListener('scroll',()=>{if(r)return;r=requestAnimationFrame(()=>{r=0;v.style.setProperty('--sy',v.scrollTop)})},{passive:true})});
/* ---- expanding rows ---- */
const _row=rowHTML;
rowHTML=function(t,extra=''){const h=_row(t,extra),f=t.f||inferFeatures(t);const xp=`<div class="xp"><div><div class="xi"><div class="xm"><b>${matchOf(t)}%</b><span>taste match</span></div>${[['energy','enrg'],['valence','mood'],['acousticness','acou'],['danceability','danc']].map(([k,l])=>`<div class="xl"><span>${l}</span><u><i style="width:${Math.round(f[k]*100)}%"></i></u></div>`).join('')}</div></div></div>`;return h.replace(/<\/div>$/,xp+'</div>')};
document.addEventListener('click',e=>{const path=e.composedPath?e.composedPath():[e.target];const it=path.find(n=>n.nodeType===1&&n.hasAttribute&&n.hasAttribute('data-row'));if(!it)return;const btn=path.find(n=>n.nodeType===1&&n.tagName==='BUTTON');const play=!!(btn&&btn.hasAttribute&&btn.hasAttribute('data-play'));if(btn&&!play)return;const was=it.classList.contains('open');$$('.item.open',it.parentNode).forEach(x=>x.classList.remove('open'));if(play||!was)it.classList.add('open')});
/* ---- daily pill + sheet ---- */
$('.col').insertAdjacentHTML('afterbegin','<button class="dpill load" id="dpill" aria-label="Daily pick"></button>');
const dailyOn=()=>S.daily&&S.daily.date===dayKey()&&S.daily.t;
const dailyDone=()=>!!(S.daily&&S.daily.claimed===dayKey());
function renderPill(){const b=$('#dpill');if(!b)return;const d=dailyOn(),dn=d&&dailyDone(),sk=streakNow();b.className='dpill '+(dn?'done':d?'ready':'load');b.innerHTML=`<span class="fl">${dn?sv('<path d="M5 12.500l4.500 4.500L19 7"/>'):FLAME}</span><b>${dn?'Claimed':d?'Daily pick':'Finding today’s pick'}</b>${d&&!dn?`<em>${matchOf(S.daily.t)}%</em>`:''}<span class="sk">${sk} day${sk===1?'':'s'}</span>`}
let dailyBusy=null;
function ensureDaily(){if(dailyOn())return Promise.resolve();if(dailyBusy)return dailyBusy;dailyBusy=(async()=>{const terms=[],g=topGenres(2).map(x=>x[0]),GTm={'Hip-Hop/Rap':'hip hop','R&B/Soul':'r&b','Alternative':'indie alternative'};g.forEach(x=>terms.push(GTm[x]||x));Object.values(S.artist).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,2).forEach(x=>terms.push(x.name));if(S.imp)Object.values(S.imp.artist).sort((a,b)=>b.score-a.score).slice(0,2).forEach(x=>terms.push(x.name));if(!terms.length)terms.push('pop hits');
await Promise.race([seedPool(terms),new Promise(r=>setTimeout(r,2500))]).catch(()=>0);let best=null,bs=-1;for(const t of POOL){if(!t.p||seenHas(t.id))continue;const s=scoreTrack(t);if(s>bs){bs=s;best=t}}if(!best)best=POOL.find(t=>t.p);if(best){reg(best);S.daily={date:dayKey(),id:best.id,t:summarize(best),claimed:null};save()}dailyBusy=null;renderPill()})();return dailyBusy}
function claimDaily(){const k=dayKey();if(!S.daily||S.daily.claimed===k)return false;S.daily.claimed=k;const s=S.streak;s.count=s.last===dayKey(1)?(s.count||0)+1:1;s.last=k;s.days=[...(s.days||[]).filter(x=>x!==k),k].slice(-60);save();renderPill();const p=$('#dpill');if(p){p.classList.remove('pop');void p.offsetWidth;p.classList.add('pop')}rInsights();vib2([10,40,10,40,24]);toast(`Streak: ${s.count} day${s.count===1?'':'s'}`,'ok');return true}
const isDaily=t=>S.daily&&String(t.id)===String(S.daily.id)&&S.daily.date===dayKey();
function dailyHTML(){const t=S.daily.t;reg(t);const m=matchOf(t),dn=dailyDone(),sk=streakNow(),days=[];for(let i=6;i>=0;i--){const k=dayKey(i),d=new Date(Date.now()-i*864e5);days.push(`<div><i class="${(S.streak.days||[]).includes(k)?'y':''} ${i===0?'td':''}" data-d="${k}"></i>${'SMTWTFS'[d.getDay()]}</div>`)}
return `<div class="dhead"><span>${new Date().toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'short'})}</span><span class="dstreak">${FLAME}<b>${sk}</b> day streak</span></div>
<div class="dcard" style="--sc:${m/100};--sh:${hueOf(m)}"><div class="glow"></div><div class="face" style="background:linear-gradient(160deg,hsl(${hue(t)} 55% 35%),#1a1326)">${t.art?`<img src="${esc(artOf(t))}" alt="" draggable="false">`:''}<div class="tint"></div><div class="score"><b>${m}<sup>%</sup></b><small>taste match</small></div><div class="info"><span class="why">Today’s best fit</span><h2>${esc(t.t)}</h2><p>${esc(t.a)}</p><small>${esc(t.g||'')}${t.y?' · '+t.y:''}</small><div class="row2"><div class="wave" data-id="${t.id}">${wave(t)}</div><button class="pbtn" data-play="${t.id}" aria-label="Play">${IC.play}</button></div></div></div></div>
<div class="week">${days.join('')}</div>
<div class="rowb"><button class="btn" id="dFav" ${dn?'disabled':''}>${dn?'Streak counted':'Favourite it'}</button><button class="btn ghost" id="dSave">Save to Spotify</button></div>
<p class="note">${dn?'Come back tomorrow for a new pick.':'Favourite or save today’s pick to keep your streak alive.'}</p>`}
async function openDaily(){if(!dailyOn()){toast('Finding your pick…');await ensureDaily()}if(!dailyOn())return toast('No pick yet, try again','err');openSheet(dailyHTML());sync()}
$('#dpill').onclick=openDaily;
$('#sheet').addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;
if(b.id==='dFav'&&S.daily){const t=S.daily.t;if(!S.liked.some(x=>String(x.id)===String(t.id)))applyFeedback(t,'like');DECK=DECK.filter(x=>String(x.id)!==String(t.id));if(claimDaily()){$('#sheet .sc').innerHTML=dailyHTML();const i=$('#sheet .week i.td');if(i){i.classList.add('y','pop');setTimeout(()=>i.classList.remove('pop'),600)}}hud()}
else if(b.id==='dSave'&&S.daily){await saveToSpotify(S.daily.t);if(S.saved.includes(S.daily.t.id)&&claimDaily())$('#sheet .sc').innerHTML=dailyHTML();else if(!SP.connected())toast('Connect Spotify to count saves. Favouriting counts too.')}
else if(b.id==='impGo')runImportUI();else if(b.id==='impSp')spFetchUI();else if(b.dataset.close!=null)closeSheet()});
const _sts=saveToSpotify;saveToSpotify=async function(t){await _sts(t);if(S.saved.includes(t.id)&&isDaily(t)&&claimDaily()&&SHEET.classList.contains('open')&&$('#dFav'))$('#sheet .sc').innerHTML=dailyHTML()};
const _commit2=commit;commit=function(t,v,c){_commit2(t,v,c);if(v==='like'&&isDaily(t))claimDaily();if(v==='skip'){S.mids=[summarize(t),...S.mids.filter(x=>String(x.id)!==String(t.id))].slice(0,40);save()}};
const _undo=undo;undo=function(){const u=undoStack[undoStack.length-1],keep={game:S.game,streak:S.streak,daily:S.daily,imp:S.imp,impK:S.impK,mids:S.mids};_undo();if(!u)return;Object.assign(S,keep);if(u.v==='skip')S.mids=S.mids.filter(x=>String(x.id)!==String(u.t.id));if(u.v==='like'&&S.daily&&String(u.t.id)===String(S.daily.id)&&S.daily.claimed===dayKey()&&!S.saved.includes(u.t.id)){S.daily.claimed=null;const s=S.streak;s.days=(s.days||[]).filter(x=>x!==dayKey());s.count=Math.max(0,(s.count||1)-1);s.last=s.days.length?s.days[s.days.length-1]:null;renderPill()}save()};
/* ---- Spotify playlist import ---- */
function parseCSV(txt){const rows=[];let r=[],c='',q=false;for(let i=0;i<txt.length;i++){const ch=txt[i];if(q){if(ch==='"'){if(txt[i+1]==='"'){c+='"';i++}else q=false}else c+=ch}else if(ch==='"')q=true;else if(ch===','){r.push(c);c=''}else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&txt[i+1]==='\n')i++;r.push(c);c='';rows.push(r);r=[]}else c+=ch}if(c||r.length){r.push(c);rows.push(r)}return rows}
function parseList(txt){const first=(txt.split(/\r?\n/)[0]||'');if(/track name/i.test(first)){const rows=parseCSV(txt),h=rows[0].map(x=>x.toLowerCase()),ti=h.findIndex(x=>/track name/.test(x)),ai=h.findIndex(x=>/artist name/.test(x));return rows.slice(1).filter(r=>r[ti]).map(r=>({q:r[ti]+' '+(r[ai]||'').split(/[;,]/)[0]}))}
return txt.split(/\r?\n+/).map(l=>l.replace(/^\s*\d+[\.\)]\s*/,'').replace(/\s+[-–—]\s+/,' ').trim()).filter(l=>l.length>2).map(q=>({q}))}
async function fetchSpotifyPlaylist(input){const m=input.match(/playlist[\/:]([A-Za-z0-9]+)/)||input.trim().match(/^([A-Za-z0-9]{22})$/);if(!m)throw new Error('That is not a playlist link');let url='/playlists/'+m[1]+'/items?limit=50',out=[];try{for(let i=0;i<2&&url;i++){const r=await SP.api(url);(r.items||[]).forEach(x=>{const tr=x&&(x.item&&typeof x.item==='object'?x.item:(x.track&&typeof x.track==='object'?x.track:null));if(tr&&tr.name)out.push({q:tr.name+' '+((tr.artists||[])[0]||{}).name})});url=r.next?r.next.replace('https://api.spotify.com/v1',''):null}}catch(e){if(e.status===403||e.status===404)throw new Error('Spotify only lets this app read playlists you own or collaborate on. Copy it into your own playlist, or paste the tracks or an Exportify CSV below.');throw e}if(!out.length)throw new Error('No readable tracks. Spotify may only expose playlists you own or collaborate on.');return out}
function openImport(){openSheet(`<h2 class="sh2">Import a playlist</h2><p class="shp">Your Spotify taste is inorganic. It guides your score at first, then fades as your own swipes grow.</p>
${SP.connected()?`<label>Playlist link</label><input id="impUrl" placeholder="open.spotify.com/playlist/…" inputmode="url"><div class="rowb" style="margin-bottom:18px"><button class="btn ghost" id="impSp" style="flex:1">Fetch from Spotify</button></div>`:`<p class="shp" style="color:var(--mid)">Connect Spotify in Taste to fetch links directly. You can still paste tracks or drop an Exportify CSV below.</p>`}
<label>Paste tracks (one per line) or choose a CSV</label><textarea id="impTxt" placeholder="Heat Waves - Glass Animals&#10;Talk Khalid, Disclosure"></textarea><input type="file" id="impFile" accept=".csv,.txt,text/csv,text/plain" style="padding:10px">
<div class="prog"><i id="impBar"></i></div><small id="impMsg" style="color:var(--dim)">Up to 80 tracks per import.</small>
<div class="rowb" style="margin-top:16px"><button class="btn" id="impGo">Import and re-score</button></div>`,()=>{$('#impFile').onchange=async e=>{const f=e.target.files[0];if(f)$('#impTxt').value=await f.text()}})}
async function spFetchUI(){const u=$('#impUrl').value.trim();if(!u)return toast('Paste a playlist link','err');$('#impMsg').textContent='Reading playlist…';try{const l=await fetchSpotifyPlaylist(u);$('#impTxt').value=l.map(x=>x.q).join('\n');$('#impMsg').textContent=l.length+' tracks found. Press import.'}catch(e){$('#impMsg').textContent='Spotify refused: '+e.message+'. Paste the tracks or an Exportify CSV instead.'}}
let importing=false;
async function runImportUI(){if(importing)return;const list=parseList($('#impTxt').value||'').slice(0,80);if(!list.length)return toast('Nothing to import','err');importing=true;const bar=$('#impBar'),msg=$('#impMsg'),btn=$('#impGo');btn.disabled=true;
if(!S.imp)S.imp=newProf();const before=impWeight();let done=0,ok=0,nf=0,failed=0;const have=new Set(S.imp.tracks.map(t=>String(t.id)));
const work=async it=>{try{const r=await searchItunes(it.q,3);const t=r[0];if(t&&!have.has(String(t.id))){have.add(String(t.id));impLearn(t);addToPool([t]);if(!seenHas(t.id))S.seen.push(t.id);S.imp.tracks.unshift(summarize(t));ok++}else nf++}catch(e){failed++}done++;bar.style.width=done/list.length*100+'%';msg.textContent=`Matched ${ok} of ${done}…`+(failed?` · ${failed} failed`:``)};
const q=list.slice();await Promise.all(Array.from({length:5},async()=>{while(q.length)await work(q.shift())}));
S.imp.tracks=S.imp.tracks.slice(0,80);S.imp.at=Date.now();if(!S.imp.n){S.imp=null}save();importing=false;
if(!ok){btn.disabled=false;msg.textContent=failed?`Couldn't reach the music lookup (${failed} error${failed===1?'':'s'}). Check your connection and try again.`:'No tracks matched. Check the names and try again.';return}
const w=impWeight();msg.textContent='';const top=Object.entries(S.imp.genre).sort((a,b)=>b[1]-a[1]).slice(0,3).map(x=>x[0]);
$('#sheet .sc').innerHTML=`<h2 class="sh2">Taste re-scored</h2><p class="shp">${ok} tracks matched${(list.length-ok-failed)>0?`, ${list.length-ok-failed} not found`:''}${failed?` · ${failed} couldn't be checked`:''}. Top genres: ${esc(top.join(', ')||'mixed')}.</p><div class="split"><i class="so" style="width:${Math.round((1-w)*100)}%"></i><i class="ss" style="width:${Math.round(w*100)}%"></i></div><div class="legend"><span><u class="d o"></u>Organic <b>${Math.round((1-w)*100)}%</b><small>${nSw()} swipes</small></span><span><u class="d s"></u>Spotify <b>${Math.round(w*100)}%</b><small>${S.imp.n} tracks</small></span></div><p class="note">Was ${Math.round((1-before)*100)}% organic before this import.</p><div class="rowb" style="margin-top:18px"><button class="btn" data-close>Back to swiping</button></div>`;
const terms=Object.values(S.imp.artist).sort((a,b)=>b.score-a.score).slice(0,3).map(x=>x.name);seedPool(terms).then(()=>{DECK=[];ensureDeck();renderDeck();hud();if(view==='taste')rTaste()});DECK=[];ensureDeck();renderDeck();hud();if(view==='taste')rTaste();vib2([10,30,10])}
/* ---- taste page: sources + two-tone genres ---- */
function genreHTML(){const w=impWeight(),I=S.imp,oM=maxAbs(S.genre),iM=I?maxAbs(I.genre):1,set=new Set([...Object.keys(S.genre),...(I?Object.keys(I.genre):[])]);
const rows=[...set].map(g=>({g,o:Math.max(0,S.genre[g]||0)/oM*(1-w),i:I?Math.max(0,I.genre[g]||0)/iM*w:0})).map(r=>({...r,t:r.o+r.i})).filter(r=>r.t>.001).sort((a,b)=>b.t-a.t).slice(0,6);
if(!rows.length)return'<span class="sub">No signal yet. Swipe a few cards.</span>';const mx=rows[0].t;
return rows.map(r=>`<div class="bar two"><span>${esc(r.g)}</span><u><i style="width:${r.o/mx*100}%"></i>${r.i>0?`<i class="s" style="width:${r.i/mx*100}%"></i>`:''}</u><span>${Math.round(r.t/mx*100)}</span></div>`).join('')}
function rSrc(){const w=impWeight(),o=Math.round((1-w)*100),i=100-o,has=!!(S.imp&&S.imp.n);
$('#srcBody').innerHTML=`<div class="split"><i class="so" style="width:${o}%"></i><i class="ss" style="width:${i}%"></i></div><div class="legend"><span><u class="d o"></u>Organic <b>${o}%</b><small>${nSw()} swipes</small></span><span><u class="d s"></u>Spotify <b>${i}%</b><small>${has?S.imp.n+' tracks imported':'not imported'}</small></span></div>
${has?`<div class="sl"><div><span>Spotify influence</span><span id="kv">${Math.round(S.impK*50)}%</span></div><input type="range" id="impK" min="0" max="100" value="${Math.round(S.impK*50)}"></div>`:''}
<p class="sub" style="margin:8px 0 16px;font-size:14px">${has?'Spotify taste fades as your own swipes grow.':'Import a playlist to jump-start your score. It counts as inorganic until you swipe.'}</p>
<div class="rowb"><button class="btn" id="impOpen">Import playlist</button>${has?'<button class="btn ghost" id="impClr">Remove import</button>':''}</div>`}
$('#srcBody').addEventListener('click',e=>{if(e.target.id==='impOpen')openImport();else if(e.target.id==='impClr'&&confirm('Remove imported Spotify taste?')){S.imp=null;save();DECK=[];ensureDeck();renderDeck();hud();rTaste()}});
$('#srcBody').addEventListener('input',e=>{if(e.target.id==='impK'){S.impK=e.target.value/50;$('#kv').textContent=e.target.value+'%'}});
$('#srcBody').addEventListener('change',e=>{if(e.target.id==='impK'){save();rTaste();renderDeck();hud()}});
const _rTaste=rTaste;rTaste=function(){_rTaste();$('#gBars').innerHTML=genreHTML();rSrc()};
after('hud',()=>renderPill());
/* ---- mystery game ---- */
const LV={easy:{n:'Easy',c:'#5ee0a8',d:'A snippet from a song you favourited. Guess among your favourites.',need:3,why:'Favourite 3 songs to unlock'},medium:{n:'Medium',c:'#ffc65a',d:'A song you found mid. Decoys come from your favourites and mids.',need:3,why:'Mark 3 songs as mid to unlock'},hard:{n:'Hard',c:'#ff5c8a',d:'A random song from anywhere. Search the whole catalogue.',need:1,why:'Loading the catalogue…'}},CLIPS=[1,2,4],gA=new Audio();gA.preload='auto';let gRaf=0,gRes=[],gTok=0;
const poolFor=l=>l==='easy'?uniqT(S.liked):l==='medium'?uniqT(S.mids):uniqT(POOL);
const candsFor=l=>l==='easy'?uniqT(S.liked):l==='medium'?uniqT([...S.liked,...S.mids]):uniqT([...POOL,...S.liked,...S.mids,...(S.imp?S.imp.tracks:[])]);
const gDone=()=>S.game.day===dayKey()&&S.game.level;
function gStop(){cancelAnimationFrame(gRaf);try{gA.pause()}catch(e){}const b=$('#gPlay');if(b){b.classList.remove('on');b.innerHTML=IC.play}const f=$('#gFill');if(f)f.style.width='0'}
function gPlay(){const g=S.game;if(!g.ans)return;const len=CLIPS[Math.min(g.guesses.length,2)];stopAudio();cancelAnimationFrame(gRaf);if(gA.dataset.id!==String(g.ans.id)){gA.src=g.ans.p;gA.dataset.id=String(g.ans.id)}try{gA.currentTime=0}catch(e){}
const b=$('#gPlay'),f=$('#gFill');gA.play().then(()=>{if(b){b.classList.add('on');b.innerHTML=IC.pause}const t0=performance.now(),step=()=>{const e=(performance.now()-t0)/1000;if(f)f.style.width=Math.min(100,e/4*100)+'%';if(e>=len||gA.currentTime>=len){gStop();return}gRaf=requestAnimationFrame(step)};gRaf=requestAnimationFrame(step)}).catch(()=>toast('Tap play again','err'))}
function startLevel(l){const p=poolFor(l).sort((a,b)=>String(a.id).localeCompare(String(b.id)));if(p.length<LV[l].need)return;const a=p[hash32(dayKey()+l)%p.length];S.game=Object.assign(S.game,{day:dayKey(),level:l,ans:summarize(a),guesses:[],done:false,won:false,pts:0});save();rGame(true);vib2(12)}
function finishGame(won){const g=S.game,st=g.stats;g.done=true;g.won=won;st.played++;if(won){st.wins++;st.streak=st.lastWin===dayKey(1)?st.streak+1:1;st.lastWin=dayKey();st.best=Math.max(st.best,st.streak);g.pts=Math.round([300,200,100][g.guesses.length-1]*({easy:1,medium:1.5,hard:2}[g.level]));st.pts+=g.pts}else{st.streak=0}save();gStop();vib2(won?[10,40,10,40,20]:[30])}
const gStreak=()=>{const st=S.game.stats;return(st.lastWin===dayKey()||st.lastWin===dayKey(1))?st.streak:0};
function guess(t){const g=S.game;if(g.done)return;gStop();if(sameT(t,g.ans)){g.guesses.push({k:'hit',n:`${t.t} — ${t.a}`});finishGame(true)}else{g.guesses.push({k:'miss',n:`${t.t} — ${t.a}`});if(g.guesses.length>=3)finishGame(false)}save();rGame()}
function gSkip(){const g=S.game;if(g.done)return;gStop();g.guesses.push({k:'skip'});if(g.guesses.length>=3)finishGame(false);save();rGame()}
const cdText=()=>{const n=new Date(),m=new Date(n);m.setHours(24,0,0,0);const s=Math.max(0,Math.floor((m-n)/1000)),p=x=>String(x).padStart(2,'0');return`${p(Math.floor(s/3600))}:${p(Math.floor(s%3600/60))}:${p(s%60)}`};
function levelsHTML(){const st=S.game.stats;return `<div class="gstats"><div><b>${st.played}</b><span>played</span></div><div><b>${st.wins}</b><span>won</span></div><div><b>${gStreak()}</b><span>streak</span></div><div><b>${st.pts}</b><span>points</span></div></div>`+Object.entries(LV).map(([k,l])=>{const n=poolFor(k).length,lock=n<l.need;return `<div class="lv ${lock?'lock':''}" data-lv="${k}" style="--c:${l.c}"><div class="h"><b>${l.n}</b><span>${k==='hard'?'∞ songs':n+' song'+(n===1?'':'s')}</span></div><div class="x"><div><p>${l.d}</p><p style="color:var(--ink)">${lock?(k==='hard'?'Catalogue is still loading. Try again in a moment.':l.why):'One mystery per day. Three guesses, clips grow from 1s to 4s.'}</p>${lock?'':`<button class="btn" data-start="${k}">Start ${l.n.toLowerCase()}</button>`}</div></div></div>`}).join('')}
function roundHTML(){const g=S.game,l=LV[g.level],n=g.guesses.length;
if(g.done){const a=g.ans;reg(a);const sq=g.guesses.map(x=>x.k==='hit'?'🟩':x.k==='miss'?'🟥':'⬛').join('')+'⬜'.repeat(3-g.guesses.length);return `<div class="rtop" style="--c:${l.c}"><span class="lvtag">${l.n}</span><span>${n}/3</span></div><div class="verdict ${g.won?'w':'l'}">${g.won?'Got it':'Missed it'}</div><div class="sqs">${sq}</div><div class="reveal2">${a.art?`<img src="${esc(artOf(a))}" alt="">`:'<img alt="">'}<div><small>${g.won?`+${g.pts} points`:'It was'}</small><h2>${esc(a.t)}</h2><small>${esc(a.a)}${a.y?' · '+a.y:''}</small></div></div><div class="rowb"><button class="btn" id="gFull">Play full preview</button><button class="btn ghost" id="gShare">Copy result</button></div><div class="rowb" style="margin-top:10px"><button class="btn ghost" id="gLike">Add to my taste</button></div><div class="cd">Next mystery in <span id="cd">${cdText()}</span></div>`}
const slots=[0,1,2].map(i=>{const x=g.guesses[i];return x?`<div class="slot ${x.k}">${x.k==='skip'?'Skipped':'✕ '+esc(x.n)}</div>`:`<div class="slot ${i===n?'cur':''}">${i===n?'Your guess':''}</div>`}).join('');
return `<div class="rtop" style="--c:${l.c}"><span class="lvtag">${l.n}</span><span>Guess ${n+1} of 3</span></div><div class="segs">${[0,1,2].map(i=>`<i class="${i<=n?'u':''}"></i>`).join('')}<div class="fl" id="gFill"></div></div><div class="gplay"><button class="pbtn big" id="gPlay" aria-label="Play clip">${IC.play}</button><small>${CLIPS[Math.min(n,2)]}s clip</small></div><div class="slots">${slots}</div><input id="gQ" placeholder="${g.level==='hard'?'Search any song…':'Search your songs…'}" autocomplete="off"><div class="gres" id="gRes"></div><div class="rowb" style="margin-top:14px"><button class="btn ghost" id="gSkip">Skip${n<2?` · +${CLIPS[n+1]-CLIPS[n]}s`:''}</button></div>`}
function rGame(anim){gStop();const box=$('#gBox'),g=S.game;if(gDone()){$('#gSub').textContent=g.done?'One mystery a day. Today’s is done.':'Name the song from a short clip. One round per day.';box.innerHTML=roundHTML();if(!g.done)gA.src=g.ans.p,gA.dataset.id=String(g.ans.id)}else{$('#gSub').textContent='Pick a level. You get one mystery per day.';box.innerHTML=levelsHTML()}
if(anim&&hasWA)box.animate([{opacity:0,transform:'translateY(16px)'},{opacity:1,transform:'none'}],{duration:500,easing:'cubic-bezier(.22,1,.36,1)'});if(gDone()&&!g.done)showRes('')}
function showRes(q){const g=S.game,r=$('#gRes');if(!r)return;const my=++gTok,l=g.level,tokens=norm(q).split(' ').filter(Boolean);let c=candsFor(l).filter(t=>!g.guesses.some(x=>x.n===`${t.t} — ${t.a}`));if(tokens.length)c=c.filter(t=>{const h=norm(t.t+' '+t.a);return tokens.every(w=>h.includes(w))});else if(l!=='easy')c=[];
const draw=list=>{gRes=list.slice(0,7);r.innerHTML=gRes.map((t,i)=>`<button class="gr" data-gi="${i}"><b>${esc(t.t)}</b><span>${esc(t.a)}</span></button>`).join('')};draw(c);
if(l==='hard'&&q.trim().length>=2){clearTimeout(showRes.t);showRes.t=setTimeout(async()=>{try{const live=await searchItunes(q,12);if(my!==gTok)return;const seen=new Set(c.map(t=>String(t.id)));draw([...c,...live.filter(t=>!seen.has(String(t.id)))])}catch(e){}},380)}}
$('#gBox').addEventListener('click',e=>{const lv=e.target.closest('.lv'),b=e.target.closest('button');
if(b&&b.dataset.start)return startLevel(b.dataset.start);if(lv&&!lv.classList.contains('lock')&&!b){const was=lv.classList.contains('open');$$('.lv.open').forEach(x=>x.classList.remove('open'));if(!was)lv.classList.add('open');vib2(5);return}else if(lv&&lv.classList.contains('lock')&&!b){const was=lv.classList.contains('open');$$('.lv.open').forEach(x=>x.classList.remove('open'));if(!was)lv.classList.add('open');return}
if(!b)return;if(b.id==='gFull'){const a=S.game.ans;reg(a);playTrack(a);b.textContent=nowId==a.id&&!audio.paused?'Pause preview':'Play full preview'}else if(b.id==='gPlay'){if(b.classList.contains('on'))gStop();else gPlay()}else if(b.id==='gSkip')gSkip();else if(b.dataset.gi!=null){const t=gRes[+b.dataset.gi];if(t)guess(t)}
else if(b.id==='gShare'){const g=S.game,sq=g.guesses.map(x=>x.k==='hit'?'🟩':x.k==='miss'?'🟥':'⬛').join('')+'⬜'.repeat(3-g.guesses.length);const txt=`Cadence Mystery ${dayKey()} · ${LV[g.level].n}\n${sq}`;(navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).then(()=>toast('Copied','ok')).catch(()=>toast(txt))}
else if(b.id==='gLike'){const a=S.game.ans;if(!S.liked.some(x=>String(x.id)===String(a.id)))applyFeedback(a,'like');hud();toast('Added to your taste','ok')}});
$('#gBox').addEventListener('input',e=>{if(e.target.id==='gQ')showRes(e.target.value)});
$('#gBox').addEventListener('focusin',e=>{if(e.target.id==='gQ'&&!e.target.value)showRes('')});
setInterval(()=>{if(document.hidden||view!=='game')return;const c=$('#cd');if(c){c.textContent=cdText();if(c.textContent==='00:00:00'&&view==='game')rGame()}},1000);
/* ---- boot ---- */
$('[data-v="game"]').innerHTML=sv('<circle cx="12" cy="12" r="9"/><path d="M9.500 9.500a2.500 2.500 0 1 1 3.500 2.300c-.7.4-1 1-1 1.700M12 17v.01"/>')+'<span>Game</span>';
setTimeout(()=>{renderPill();ensureDaily()},600);

init();

/* ---- patch 4: live first-run tour (phantom half-swipes) ---- */
(function(){
const root=$('#tour'),hole=$('#tourHole'),fin=$('#tourFinger'),cap=$('#tourCap');
const STEPS=[
{t:'Swipe right to like',p:'Love it? Drag the card right. Every swipe teaches the app your taste.',sel:'#deck',sw:[1,0],pad:[8,90],card:1},
{t:'Swipe left to dislike',p:'Not your thing? Drag it left. It won’t come back, and similar songs rank lower.',sel:'#deck',sw:[-1,0],pad:[8,90],card:1},
{t:'Swipe down for mid',p:'Fine but forgettable? Drag down. It counts as a soft skip.',sel:'#deck',sw:[0,1],pad:[8,90],card:1},
{t:'Swipe up to play it whole',p:'Want the full song, not just a preview? Drag the card up — Cadence opens that exact track in Spotify, and the card springs right back so you can judge it after.',sel:'#deck',sw:[0,-1],pad:[8,90],card:1},
{t:'Tap to hear it',p:'This button plays a short preview. Tapping the card itself plays it too.',sel:'#deck .card:last-child .pbtn',card:1,round:1},
{t:'Taste match',p:'How well the song fits you, from 0 to 100. It sharpens as you swipe.',sel:'#deck .card:last-child .score',card:1},
{t:'Prefer buttons?',p:'Left to right: undo, dislike, like, mid, shuffle. Shuffle deals a fresh set of songs.',sel:'.dock'},
{t:'Daily pick',p:'The flame is one song a day, chosen for you. Open it, then like or save to keep your streak. Once you have dealt with it, it tucks away into the corner until tomorrow.',sel:'#dpill'},
{t:'Pages',p:'Swipe is home. For you ranks songs for you, Moods turns a feeling into a playlist, Game is a daily mystery clip, and Taste — far right — holds your profile and settings.',sel:'#nav'},
{t:'You’re set',p:'Swipe a few songs and your deck starts to fit you. You can replay this from Taste.',last:1}
];
let i=0,timers=[],active=false;
const later=(f,ms)=>timers.push(setTimeout(f,ms));
const topCard=()=>$('#deck .card:last-child');
function reset(){timers.forEach(clearTimeout);timers=[];fin.classList.remove('go');fin.style.opacity=0;const c=topCard();if(c){c.style.transition='none';c.style.transform='';void c.offsetWidth;c.style.transition='';['--ol','--on','--om','--ou'].forEach(k=>c.style.removeProperty(k))}$('#deck').style.removeProperty('--p')}
function rectOf(st){const e=st.sel&&$(st.sel);if(!e)return null;const r=e.getBoundingClientRect();return r.width&&r.height?r:null}
function phantom(dir){
  const c=topCard();if(!c)return;const r=c.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height*.55,dx=dir[0]*86,dy=dir[1]*86;
  const run=()=>{
    const cc=topCard();if(!cc||!active)return;
    fin.classList.remove('go');fin.style.transform=`translate(${cx}px,${cy}px)`;fin.style.opacity=1;
    later(()=>{
      fin.classList.add('go');fin.style.transform=`translate(${cx+dx}px,${cy+dy}px)`;
      cc.style.transition='transform .8s cubic-bezier(.3,.8,.3,1)';cc.style.transform=`translate(${dx}px,${dy<0?dy:dy*.6}px) rotate(${dx/22}deg)`;
      cc.style.setProperty('--ol',dir[0]>0?.8:0);cc.style.setProperty('--on',dir[0]<0?.8:0);cc.style.setProperty('--om',dir[1]>0?.8:0);cc.style.setProperty('--ou',dir[1]<0?.8:0);
      $('#deck').style.setProperty('--p',.5);
    },350);
    later(()=>{
      fin.style.opacity=0;cc.style.transition='transform .65s cubic-bezier(.34,1.45,.64,1)';cc.style.transform='';
      ['--ol','--on','--om','--ou'].forEach(k=>cc.style.setProperty(k,0));$('#deck').style.setProperty('--p',0);
    },1950);
    later(run,3100);
  };
  run();
}
let raf=0;
function place(st,r){const px=st.pad?st.pad[1]:8,py=st.pad?st.pad[0]:8;hole.style.left=(r.left-px)+'px';hole.style.top=(r.top-py)+'px';hole.style.width=(r.width+px*2)+'px';hole.style.height=(r.height+py*2)+'px'}
function track(){cancelAnimationFrame(raf);const f=()=>{if(!active)return;const st=STEPS[i],r=st&&rectOf(st);if(r)place(st,r);raf=requestAnimationFrame(f)};raf=requestAnimationFrame(f)}
function render(){
  reset();
  let st=STEPS[i];
  // skip steps whose target isn't on screen
  while(st&&!st.last&&(!rectOf(st)||(st.card&&!topCard()))){i++;st=STEPS[i]}
  if(!st){end();return}
  const r=rectOf(st),n=STEPS.length;
  if(r){place(st,r);hole.style.borderRadius=st.round?'999px':'24px';hole.style.opacity=1}
  else{hole.style.left='50%';hole.style.top='50%';hole.style.width='0';hole.style.height='0';hole.style.opacity=1}
  // caption goes on the side away from the target
  const mid=r?r.top+r.height/2:innerHeight/2,swipe=!!st.sw;
  cap.className=(swipe||mid<innerHeight*.5)?'bot':'top';
  if(!r)cap.className='bot';
  cap.innerHTML=`<small>${i+1} of ${n}</small><h3>${st.t}</h3><p>${st.p}</p><div class="tb">${st.last?'':'<button class="lnk" data-t="skip">Skip</button>'}<span class="sp"></span><span class="td2">${STEPS.map((_,k)=>`<i class="${k===i?'on':''}"></i>`).join('')}</span><button class="btn" data-t="next">${st.last?'Start swiping':'Next'}</button></div>`;
  if(st.sw)later(()=>phantom(st.sw),500);
  track();
}
function end(){active=false;cancelAnimationFrame(raf);reset();root.classList.remove('on');try{localStorage.setItem('cadence.toured','1')}catch(e){}}
function start(){if(active)return;i=0;active=true;root.classList.add('on');if(typeof go==='function')go('discover');setTimeout(render,250)}
cap.addEventListener('click',e=>{const b=e.target.closest('[data-t]');if(!b)return;if(b.dataset.t==='skip'){end();return}if(STEPS[i].last){end();return}i++;render()});
addEventListener('resize',()=>{if(active)render()});
window.startTour=start;
after('finishOb',()=>{let seen=0;try{seen=localStorage.getItem('cadence.toured')}catch(e){}if(!seen)setTimeout(start,900)});
})();

/* ---- patch 5: Spotify guide wiring, onboarding steps, missing savePlaylist ---- */
(function(){
const _rs=renderSpStatus;
renderSpStatus=function(){_rs();const e=$('#spRedirShow');if(e)e.textContent=redirShown();const st=$('#spStat');if(st&&!SP.connected()){const w=location.protocol==='file:'?' Serve the folder over http first (see “Something went wrong?”).':'';st.textContent='Optional. Follow the six steps to link your account.'+w}};
const cp=$('#spCopy');if(cp)cp.onclick=async()=>{const v=redirShown();try{await navigator.clipboard.writeText(v);toast('Redirect URI copied','ok')}catch(e){const r=document.createRange();r.selectNode($('#spRedirShow'));getSelection().removeAllRanges();getSelection().addRange(r);toast('Select and copy the address','err')}};
const tb=$('#tourBtn');if(tb)tb.onclick=()=>window.startTour&&window.startTour();
obSp=function(){const w=location.protocol==='file:'?'<p>You opened this as a file. Run <code>python3 -m http.server 8000</code> in this folder, then open <code>http://127.0.0.1:8000/</code>.</p>':location.hostname==='localhost'?`<p>Open <code>${esc(location.href.replace('//localhost','//127.0.0.1'))}</code> instead. Spotify rejects localhost.</p>`:'';
$('#obSp').innerHTML=`<div class="spbox sps2"><b>Connect Spotify in 4 steps</b><ol><li>Create an app at <code>developer.spotify.com/dashboard</code>. The owner needs Premium. Tick <b>Web API</b>.</li><li>Add this exact Redirect URI: <code>${esc(redirShown())}</code></li><li>In the app’s <b>Settings → User Management</b>, add your Spotify email.</li><li>Paste the Client ID, then accept every permission Spotify asks for:</li></ol><input id="obCid" placeholder="Client ID" value="${esc(S.sp.clientId)}"><button class="btn" data-a="spgo">Connect</button>${w}</div>`};
/* Moods -> private Spotify playlist (uses the 2026 endpoints) */
window.savePlaylist=async function(name,list){
  if(!SP.connected()){toast('Connect Spotify in Taste first','err');go('taste');return}
  const b=$('#savePl'),old=b.textContent;b.disabled=true;
  try{
    const tr=list.slice(0,25),uris=[];
    for(let i=0;i<tr.length;i++){b.textContent=`Finding songs ${i+1}/${tr.length}`;const t=tr[i];
      try{const q=encodeURIComponent(`track:${t.t} artist:${String(t.a).split(',')[0]}`);const r=await SP.api('/search?type=track&limit=1&q='+q);const h=r.tracks&&r.tracks.items&&r.tracks.items[0];if(h)uris.push(h.uri)}catch(e){if(e.status===401||e.status===403)throw e}}
    if(!uris.length)throw new Error('Could not match these songs on Spotify');
    b.textContent='Creating playlist…';
    const H={'Content-Type':'application/json'};
    const pl=await SP.api('/me/playlists',{method:'POST',headers:H,body:JSON.stringify({name:'Cadence · '+name,description:'Made with Cadence',public:false})});
    await SP.api('/playlists/'+pl.id+'/items',{method:'POST',headers:H,body:JSON.stringify({uris})});
    toast(`Saved ${uris.length} songs to “Cadence · ${name}”`,'ok');
  }catch(e){toast('Could not save playlist: '+e.message,'err')}
  b.disabled=false;b.textContent=old;
};
renderSpStatus();
})();

/* ---- patch 5b: saved hearts ---- */
(function(){
const mark=id=>$$(`[data-save="${id}"]`).forEach(b=>b.classList.add('saved'));
const _s=saveToSpotify;
saveToSpotify=async function(t){await _s.apply(this,arguments);if(S.saved.includes(t.id))mark(t.id)};
const _r=rowHTML;
rowHTML=function(t,extra){const h=_r(t,extra);return S.saved.includes(t.id)?h.replace('class="sm" data-save="'+t.id+'"','class="sm saved" data-save="'+t.id+'"'):h};
})();

/* ---- daily chip: big centred prompt while fresh, small corner chip once dealt with ---- */
(function(){
const pill=$('#dpill');if(!pill)return;
const setView=v=>{document.body.dataset.view=v};
setView(view);
const dealt=()=>{const d=S.daily;return !!(d&&(d.claimed===dayKey()||d.seen===dayKey()))};
const sheetOpen=()=>{const s=$('#sheet');return s.classList.contains('open')&&s.classList.contains('show')};
function setPillMode(){
  const want=dealt()?'mini':'big',cur=pill.dataset.mode||'';
  if(cur&&!pill.classList.contains(cur)){pill.classList.remove('big','mini');pill.classList.add(cur)}
  if(want===cur)return;
  if(want==='mini'&&sheetOpen())return;
  const was=cur,first=pill.getBoundingClientRect();
  pill.dataset.mode=want;
  pill.classList.remove('big','mini');pill.classList.add(want);
  const host=want==='big'?$('.col'):$('#meter');
  if(host&&pill.parentNode!==host)host.insertBefore(pill,host.firstChild);
  document.body.dataset.dpill=want;
  if(was&&hasWA){
    const last=pill.getBoundingClientRect();
    if(first.width>0&&last.width>0){
      const dx=first.left-last.left,dy=first.top-last.top,sx=first.width/last.width,sy=first.height/last.height;
      pill.animate([{transformOrigin:'0 0',transform:'translate('+dx+'px,'+dy+'px) scale('+sx+','+sy+')'},{transformOrigin:'0 0',transform:'none'}],{duration:460,easing:'cubic-bezier(.22,1,.36,1)'});
    }
  }
}
after('go',v=>{setView(v);setPillMode()});
after('renderPill',()=>setPillMode());
const _cd=claimDaily;claimDaily=function(){const r=_cd.apply(this,arguments);setPillMode();return r};
const _cs=closeSheet;closeSheet=function(){const had=!!$('#sheet #dFav');const r=_cs.apply(this,arguments);if(had&&S.daily){S.daily.seen=dayKey();save();setTimeout(setPillMode,380)}return r};
$('#sheet .sb').onclick=()=>closeSheet();
setPillMode();
})();
/* ================= v6 JS: real waveform + smooth playback progress ================= */
(function(){
  var cssEsc=function(s){return (window.CSS&&CSS.escape)?CSS.escape(s):String(s).replace(/["\\]/g,'\\$&')};
  var W=new Map(),ac=null,BARS=48;
  function actx(){try{if(!ac){var C=window.AudioContext||window.webkitAudioContext;ac=C?new C():null}if(ac&&ac.state==='suspended')ac.resume().catch(function(){});return ac}catch(e){return null}}
  /* loudness envelope: per-bucket RMS on a dB scale, with a little peak for definition.
     Peak-per-bucket alone pins every bar at full height on limited modern masters. */
  function envelopeOf(ab,n){
    var ch=Math.min(2,ab.numberOfChannels||1),len=ab.length||1,step=Math.max(1,Math.floor(len/n)),d=[],c,i,j,s,e;
    for(c=0;c<ch;c++)d.push(ab.getChannelData(c));
    var rms=new Float64Array(n),pk=new Float64Array(n);
    for(i=0;i<n;i++){
      s=i*step;e=Math.min(len,s+step);var ss=0,cnt=0,m=0;
      for(j=s;j<e;j++){var sq=0,ay=0;
        for(c=0;c<ch;c++){var y=d[c][j];sq+=y*y;var t2=y<0?-y:y;if(t2>ay)ay=t2}
        ss+=sq/ch;cnt++;if(ay>m)m=ay}
      rms[i]=cnt?Math.sqrt(ss/cnt):0;pk[i]=m}
    var db=new Array(n),k2;
    for(k2=0;k2<n;k2++)db[k2]=20*Math.log10(rms[k2]+1e-7);
    var sdb=db.slice().sort(function(a,b){return a-b});
    var ceil=sdb[Math.min(sdb.length-1,Math.floor(sdb.length*.95))];
    var lo=sdb[Math.max(0,Math.floor(sdb.length*.05))];
    var floor=Math.max(ceil-40,lo);   /* use the track's own range, up to 40 dB */
    floor=Math.min(floor,ceil-6);     /* but never amplify less than a 6 dB window */
    var out=new Float32Array(n);
    for(k2=0;k2<n;k2++){
      var a=Math.min(1,Math.max(0,(db[k2]-floor)/((ceil-floor)||1)));
      out[k2]=Math.pow(a,.9);
    }
    return out}
  function bars(p){var o='',i,a,b,k,v;
    for(i=0;i<BARS;i++){v=0;a=Math.floor(i/BARS*p.length);b=Math.max(a+1,Math.ceil((i+1)/BARS*p.length));
      for(k=a;k<b;k++)if(p[k]>v)v=p[k];
      o+='<i style="height:'+Math.max(8,Math.round(8+v*92))+'%"></i>'}
    return o}
  function paint(id){var r=W.get(id);if(!r||!r.peaks)return;var b=bars(r.peaks);
    $$('.wave[data-id="'+cssEsc(id)+'"]').forEach(function(el){
      var was=el.classList.contains('loading');
      el.innerHTML='<div class="wb">'+b+'</div><div class="wf">'+b+'</div><i class="ph"></i>';
      el.classList.remove('loading');
      if(was){el.classList.remove('live');void el.offsetWidth;el.classList.add('live')}
    })}
  var FAILED={};
  function load(t,tries){if(!t)return;var id=String(t.id);
    if(FAILED[id])return;
    var r=W.get(id);
    if(r){if(r.peaks)paint(id);return}
    var rec={peaks:null};W.set(id,rec);
    var url=t.p||'';if(!url||!window.fetch)return;
    $$('.wave[data-id="'+cssEsc(id)+'"]').forEach(function(el){el.classList.add('loading')});
    fetch(url,{mode:'cors',credentials:'omit'}).then(function(x){return x.ok?x.arrayBuffer():Promise.reject()}).then(function(buf){var c=actx();if(!c)throw 0;return c.decodeAudioData(buf)})
      .then(function(ab){rec.peaks=envelopeOf(ab,BARS);paint(id)})
      .catch(function(){W.delete(id);
        if(!tries){setTimeout(function(){load(t,1)},900)}
        else{FAILED[id]=1;$$('.wave[data-id="'+cssEsc(id)+'"]').forEach(function(el){el.classList.remove('loading')})}})}
  var hT=0;
  function hydrate(){clearTimeout(hT);hT=setTimeout(function(){
    var top=$('#deck .card:last-child .wave[data-id]');
    if(top){var t=T.get(top.dataset.id);if(t)load(t)}
    $$('#sheet .wave[data-id]').forEach(function(el){var t=T.get(el.dataset.id);if(t)load(t)})},140)}
  var _rd=renderDeck;renderDeck=function(){_rd.apply(this,arguments);hydrate()};
  var _os=openSheet;openSheet=function(){_os.apply(this,arguments);hydrate()};
  var raf=0;
  function setProg(){var el=nowId==null?null:$('.wave[data-id="'+cssEsc(String(nowId))+'"]');if(!el)return;
    var p=audio.duration?Math.min(1,audio.currentTime/audio.duration):0;
    el.style.setProperty('--prog',p);el.classList.toggle('playing',!audio.paused&&p>0&&p<1)}
  function loop(){setProg();if(!audio.paused&&!audio.ended&&nowId!=null)raf=requestAnimationFrame(loop)}
  function resetAll(){$$('.wave').forEach(function(w){w.style.setProperty('--prog',0);w.classList.remove('playing')})}
  audio.ontimeupdate=setProg;
  audio.onplay=function(){sync();cancelAnimationFrame(raf);loop()};
  audio.onpause=function(){sync();cancelAnimationFrame(raf);setProg()};
  audio.onended=function(){cancelAnimationFrame(raf);setProg();sync()};
  var _pt=playTrack;playTrack=function(t,f){var was=nowId;var r=_pt.apply(this,arguments);if(was==null||String(nowId)!==String(was))resetAll();if(t&&String(t.id)===String(nowId))load(t);return r};
  /* ---- shuffle: gather -> riffle -> collapse -> deal a fresh hand ---- */
  var SHUF_D=560,SHUF_STEP=30;
  function baseTf(c){var t=getComputedStyle(c).transform;return (!t||t==='none')?'':t}
  function tf(base,x,y,r,s){return (base?base+' ':'')+'translate('+x+'px,'+y+'px) rotate('+r+'deg) scale('+s+')'}
  function shuffleAnim(){
    return new Promise(function(res){
      var cs=$$('#deck .card');
      if(!hasWA||!cs.length){setTimeout(res,220);return}
      cs.forEach(function(c){c.getAnimations().forEach(function(a){a.cancel()})});
      var N=28,A=40,LIFT=26,ROT=9;
      cs.forEach(function(c,i){
        var base=baseTf(c),s=(i%2)?1:-1,kf=[];
        for(var k=0;k<=N;k++){
          var p=k/N;
          var osc=Math.sin(p*Math.PI*3)*Math.pow(1-p,.55);
          var x=s*A*osc;
          var y=-LIFT*Math.sin(Math.PI*Math.min(1,p*1.12))+10*p*p;
          var sc=1-.14*p;
          var op=p<.72?1:Math.max(0,1-(p-.72)/.28);
          kf.push({transform:tf(base,x,y,s*ROT*osc,sc),opacity:op,offset:p});
        }
        c.animate(kf,{duration:SHUF_D,delay:i*SHUF_STEP,easing:'linear',fill:'forwards'});
      });
      setTimeout(res,SHUF_D+(cs.length-1)*SHUF_STEP);
    });
  }
  function dealIn(){
    var cs=$$('#deck .card');
    cs.forEach(function(c,i){
      if(!hasWA)return;
      var s=(i%2)?1:-1,rest=getComputedStyle(c).transform;
      c.animate([
        {transform:'translate('+(s*10)+'px,26px) scale(.8) rotate('+(s*3)+'deg)',opacity:0},
        {transform:(!rest||rest==='none')?'none':rest,opacity:1}
      ],{duration:420,delay:i*40,easing:'cubic-bezier(.2,1.12,.35,1)',fill:'backwards'});
    });
  }
  shuffleDeck=async function(){
    if(shuffling||view!=='discover')return;
    shuffling=true;cold=0;
    var b=$('#bShuf');b.classList.remove('nudge');b.classList.add('spin');
    stopAudio();vib([10,40,10,40,10,40,12]);
    var net=Promise.race([seedPool(shuffleTerms()).catch(function(){return 0}),new Promise(function(r){setTimeout(r,SHUF_D)})]);
    await Promise.all([shuffleAnim(),net]);
    var ex=new Set(DECK.map(function(t){return t.id})),oldTop=DECK[0]?String(DECK[0].id):null;
    var nd=pickFresh(8,ex);if(!nd.length)nd=recommend(8);
    if(nd.length&&oldTop&&String(nd[0].id)===oldTop){
      var alt=POOL.filter(function(t){return !ex.has(t.id)&&String(t.id)!==oldTop});
      if(alt.length){var pk=alt[Math.floor(Math.random()*alt.length)];nd=[pk].concat(nd.filter(function(t){return String(t.id)!==String(pk.id)}))}
    }
    if(nd.length)DECK=nd;
    ensureDeck();
    renderDeck('shuffle');
    $$('#deck .card').forEach(function(c){c.getAnimations().forEach(function(a){a.cancel()})});
    dealIn();
    b.classList.remove('spin');shuffling=false;toast('Fresh hand dealt');
  };
  var bs=$('#bShuf');if(bs)bs.onclick=shuffleDeck;
  /* measure each nav label so the mobile pill can animate its width */
  function measureNav(){$$('#nav button').forEach(function(b){var sp=b.querySelector('span');if(!sp)return;
    var d=sp.style.cssText;
    sp.style.transition='none';sp.style.display='inline-block';sp.style.maxWidth='none';sp.style.marginLeft='8px';
    var w=Math.max(sp.scrollWidth,sp.getBoundingClientRect().width);
    sp.style.cssText=d;
    if(w>0)b.style.setProperty('--lw',Math.ceil(w)+'px')})}
  measureNav();
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(measureNav);
  addEventListener('resize',measureNav);
  setTimeout(hydrate,500);try{window.__hydrateWave=hydrate}catch(e){}
  setTimeout(function(){if(nowId!=null)load(T.get(String(nowId)))},650);
})();