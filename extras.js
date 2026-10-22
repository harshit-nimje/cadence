/* ================= v8: native app layer (TWA) ================= */
(function(){
const Q=s=>document.querySelector(s),root=document.documentElement;
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const STANDALONE=matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches||navigator.standalone===true||document.referrer.startsWith('android-app://');
const IS_TOUCH=matchMedia('(pointer: coarse)').matches;
const APP=STANDALONE||IS_TOUCH;   /* touch feel applies to phones; installed-only chrome handling below */
window.__IS_INSTALLED=STANDALONE;
if(STANDALONE)root.dataset.app='1';
if(IS_TOUCH)root.dataset.touch='1';
const tick=p=>{try{navigator.vibrate&&navigator.vibrate(p)}catch(e){}};

/* service worker: offline shell */
if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol))addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));

/* native feel: no context menu, no image drag, keyboard keeps focused field in view */
if(APP){
  addEventListener('contextmenu',e=>{if(!e.target.closest('input,textarea'))e.preventDefault()});
  addEventListener('dragstart',e=>e.preventDefault());
  addEventListener('gesturestart',e=>e.preventDefault());
}
addEventListener('focusin',e=>{if(e.target.matches&&e.target.matches('input,textarea'))setTimeout(()=>{try{e.target.scrollIntoView({block:'center',behavior:'smooth'})}catch(_){}},320)});

/* connectivity */
addEventListener('offline',()=>toast("You're offline. New songs need a connection.",'err'));
addEventListener('online',()=>toast('Back online'));

/* tab bar: haptic tick, tap the active tab to scroll to top */
Q('#nav').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;tick(5);if(b.classList.contains('on')){const v=Q('.view.on');if(v&&v.scrollTop>0)v.scrollTo({top:0,behavior:'smooth'})}},true);

/* haptics on chips and buttons in onboarding */
Q('#obStep').addEventListener('click',e=>{if(e.target.closest('.chip'))tick(6);else if(e.target.closest('.btn'))tick(8)});

/* audio: no background playback — stop as soon as the app leaves the foreground */
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){ try{ if(!audio.paused){ audio.pause(); sync(); } }catch(e){} }
});
addEventListener('pagehide',()=>{ try{ audio.pause(); }catch(e){} });

/* lock screen + notification controls, headset buttons */
if('mediaSession' in navigator&&window.MediaMetadata){
  const ms=navigator.mediaSession,_p=playTrack;
  playTrack=function(t){const r=_p.apply(this,arguments);try{if(t)ms.metadata=new MediaMetadata({title:t.t,artist:t.a,album:'Cadence',artwork:t.art?[{src:artOf(t),sizes:'600x600',type:'image/jpeg'}]:[]})}catch(_){}return r};
  audio.addEventListener('play',()=>{ms.playbackState='playing'});
  audio.addEventListener('pause',()=>{ms.playbackState='paused'});
  const set=(a,f)=>{try{ms.setActionHandler(a,f)}catch(_){}};
  set('play',()=>audio.play());set('pause',()=>audio.pause());
  set('nexttrack',()=>Q('#bSkip').click());set('previoustrack',()=>Q('#bUndo').click());
}

/* Android back button: close the top layer, then go Home, then double-press to exit */
if(STANDALONE){
  let armT=0;
  const arm=()=>{try{history.pushState({cadence:1},'')}catch(_){}};
  const closeTop=()=>{
    if(Q('#sheet').classList.contains('show')){closeSheet();return true}
    if(Q('#tour').classList.contains('on')){const b=Q('#tourCap [data-t="skip"]')||Q('#tourCap .btn');if(b)b.click();return true}
    if(Q('#onboard').classList.contains('open')&&obStep>0){obStep--;rOb();return true}
    return false;
  };
  try{history.replaceState({cadence:0},'')}catch(_){}
  arm();
  addEventListener('popstate',()=>{
    clearTimeout(armT);
    if(closeTop()){arm();return}
    if(view!=='discover'&&!Q('#onboard').classList.contains('open')){go('discover');arm();return}
    toast('Press back again to exit');
    armT=setTimeout(arm,2200);
  });
}

/* export: share sheet first (blob downloads are unreliable inside a TWA) */
Q('#exp').onclick=async()=>{
  const file=new File([JSON.stringify(exportSnapshot(),null,2)],'cadence-taste.json',{type:'application/json'});
  try{if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:'My Cadence taste'});return}}catch(e){if(e&&e.name==='AbortError')return}
  const a=document.createElement('a');a.href=URL.createObjectURL(file);a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000);
};

/* reset: in-app sheet instead of a browser confirm() dialog */
Q('#rst').onclick=()=>{
  openSheet('<h2 class="sh2">Reset Cadence?</h2><p class="shp">This wipes your taste, swipe history and Spotify link from this phone. It can\'t be undone.</p><div class="rowb"><button class="btn ghost" data-close>Keep my taste</button><button class="btn" id="rstGo" style="background:var(--like);color:#2a0a16">Reset everything</button></div>');
  Q('#rstGo').onclick=()=>{['cadence.onboarded','cadence.coach','cadence.toured','cadence.sp','cadence.pkce','cadence.state','cadence.afterSp'].forEach(k=>{try{localStorage.removeItem(k)}catch(e){}});try{localStorage.removeItem(STORE_KEY)}catch(e){};location.href=location.pathname};
};

/* ---------- onboarding ---------- */
let prevStep=0,heroT=0;
const _rOb=rOb;
rOb=function(){
  const dir=obStep>=prevStep?'fwd':'bck';prevStep=obStep;
  clearTimeout(heroT);
  _rOb.apply(this,arguments);
  const ob_=Q('#onboard'),el=Q('#obStep');
  if(!ob_.classList.contains('open'))return;
  ob_.dataset.s=obStep;
  if(obStep===0)buildHero(el);
  else if(obStep===2)buildLive(el);
  else if(obStep===3)buildReveal(el);
  el.classList.remove('fwd','bck');void el.offsetWidth;el.classList.add(dir);
};

function buildHero(el){
  const pool=SEED.filter(s=>s.art),pick=[3,6,0].map(i=>pool[i%pool.length]).filter(Boolean),match=[94,71,88];
  const card=(t,i)=>`<div class="c0" data-p="${i}" style="--h:${hue(t)}"><div class="c0f"><img src="${esc(t.art.replace('100x100bb','300x300bb'))}" alt="" draggable="false" onerror="this.remove()"><div class="c0s"><b>${match[i]}<sup>%</sup></b><small>taste match</small></div><div class="c0i"><h3>${esc(t.t)}</h3><p>${esc(t.a)}</p></div><div class="c0v like">${IC.heart}</div><div class="c0v nope">${IC.x}</div></div></div>`;
  const words='Your next favorite song is one swipe away.'.split(' ').map((w,i)=>`<span style="--w:${i}">${w}</span>`).join(' ');
  el.innerHTML=`<div class="hero0" aria-hidden="true"><div class="deck0">${pick.map(card).reverse().join('')}</div></div><h1 class="h0">${words}</h1><p class="sub">Four quick steps teach Cadence your taste. It stays on this phone unless you sign in.</p><div id="obSp"></div><div class="obnav col"><button class="btn big" data-a="next">Get started</button><div class="obx"><button class="lnk" data-a="sp">Connect Spotify</button><button class="lnk" data-a="skip">Skip setup</button></div></div>`;
  if(RM||pick.length<3)return;
  const wrap=el.querySelector('.hero0');let dir=1;
  const loop=()=>{
    if(!document.body.contains(wrap)||!Q('#onboard').classList.contains('open'))return;
    if(!document.hidden){
      const cards=[...wrap.querySelectorAll('.c0')],top=cards.find(c=>c.dataset.p==='0');
      top.dataset.o=dir>0?'r':'l';
      setTimeout(()=>{
        cards.forEach(c=>{if(c!==top)c.dataset.p=String(+c.dataset.p-1)});
        top.style.transition='none';top.dataset.o='';top.dataset.p='2';void top.offsetWidth;top.style.transition='';
        dir*=-1;
      },560);
    }
    heroT=setTimeout(loop,2500);
  };
  heroT=setTimeout(loop,1600);
}

function setLive(){const o=Q('#onboard');o.style.setProperty('--ev',ob.e);o.style.setProperty('--vh',Math.round(225+ob.v*130));o.style.setProperty('--ac',ob.a)}
function buildLive(el){
  const sub=el.querySelector('.sub');if(!sub)return;
  const lq=document.createElement('div');lq.className='lq';lq.setAttribute('aria-hidden','true');
  lq.innerHTML=Array.from({length:30},(_,i)=>`<i style="--d:${((i*37)%11)/11}"></i>`).join('');
  sub.after(lq);setLive();
}
let lastNotch=-1;
Q('#obStep').addEventListener('input',e=>{
  if(!e.target.dataset||!e.target.dataset.k)return;
  setLive();const n=Math.round(e.target.value/10);if(n!==lastNotch){lastNotch=n;tick(4)}
});

function countUp(sp){
  const to=parseInt(sp.textContent,10);if(isNaN(to)||RM)return;
  const t0=performance.now()+250;sp.textContent='0%';
  const f=n=>{const k=Math.min(1,Math.max(0,(n-t0)/1000));sp.textContent=Math.round(to*(1-Math.pow(1-k,3)))+'%';if(k<1)requestAnimationFrame(f)};
  requestAnimationFrame(f);
}
function burst(anchor){
  if(RM)return;
  const r=anchor.getBoundingClientRect(),box=document.createElement('div');
  box.className='burst';box.style.left=(r.left+r.width/2)+'px';box.style.top=(r.top+r.height/2)+'px';
  for(let i=0;i<18;i++){
    const a=Math.random()*Math.PI*2,d=70+Math.random()*110,p=document.createElement('i');
    p.style.cssText=`--dx:${Math.cos(a)*d}px;--dy:${Math.sin(a)*d+40}px;--r:${(Math.random()*540-270)|0}deg;--h:${[340,225,40,300][i%4]};animation-delay:${(Math.random()*80)|0}ms`;
    box.appendChild(p);
  }
  document.body.appendChild(box);setTimeout(()=>box.remove(),1300);tick([10,40,10,40,18]);
}
function buildReveal(el){
  const r=el.querySelector('.reveal');
  if(r&&!RM){
    let i=0;
    r.innerHTML=r.textContent.split(' ').map(w=>`<span class="wd">${[...w].map(c=>`<span class="lt" style="--i:${i++}">${esc(c)}</span>`).join('')}</span>`).join(' ');
    setTimeout(()=>burst(r),420);
  }
  el.querySelectorAll('.bar span:last-child').forEach(countUp);
}
/* init() already rendered step 0 before this layer loaded: render it again through the patched rOb */
if(Q('#onboard').classList.contains('open'))rOb();
})();;
/* ================= v9: performance, persistence + polish ================= */
(function(){
'use strict';
const Q=s=>document.querySelector(s);
/* installed (standalone/TWA) vs an ordinary phone browser: only installed mode hides scaffolding */
const IS_INSTALLED=(typeof window.__IS_INSTALLED==='boolean')?window.__IS_INSTALLED:(document.documentElement.dataset.app==='1');
/* credential-free snapshot for export / share (never leak tokens) */
window.exportSnapshot=function(){try{const o=JSON.parse(JSON.stringify(S));delete o.sp;return o}catch(e){return {}}};

/* ---- launch splash: fade out as soon as the app is interactive ---- */
(function(){
  const sp=Q('#splash'); if(!sp)return;
  let gone=false;
  const kill=()=>{if(gone)return;gone=true;sp.classList.add('out');setTimeout(()=>{try{sp.remove()}catch(e){}},420)};
  setTimeout(kill,640);
  addEventListener('load',()=>setTimeout(kill,60));
})();

/* ---- Spotify: durable link that survives app kill ---- */
(function(){
  const MIRROR='cadence.sp';
  function persist(){
    try{localStorage.setItem(MIRROR,JSON.stringify({clientId:S.sp.clientId,redirect:S.sp.redirect,refresh:S.sp.refresh,user:S.sp.user,at:Date.now()}))}catch(e){}
    try{localStorage.setItem(STORE_KEY,JSON.stringify(S))}catch(e){}   /* immediate, not debounced */
  }
  (function restore(){
    try{
      const m=JSON.parse(localStorage.getItem(MIRROR)||'null'); if(!m)return;
      if(!S.sp.refresh&&m.refresh)S.sp.refresh=m.refresh;
      if(!S.sp.clientId&&m.clientId)S.sp.clientId=m.clientId;
      if(!S.sp.redirect&&m.redirect)S.sp.redirect=m.redirect;
      if(!S.sp.user&&m.user)S.sp.user=m.user;
    }catch(e){}
  })();
  function clearCreds(){
    S.sp.token=null;S.sp.refresh=null;S.sp.expires=0;S.sp.user=null;S.spotifySeeded=false;
    try{localStorage.removeItem(MIRROR)}catch(e){}
    try{localStorage.setItem(STORE_KEY,JSON.stringify(S))}catch(e){}
  }
  /* a stored refresh token counts as connected, even when the access token has lapsed */
  SP.connected=function(){return !!((S.sp.token&&Date.now()<S.sp.expires)||S.sp.refresh)};
  let refreshP=null;   /* single-flight: one refresh at a time, so resume/API races can't clobber each other */
  SP.refreshToken=function(){
    if(refreshP)return refreshP;
    if(!S.sp.refresh)return Promise.resolve(false);
    refreshP=(async function(){
      try{
        const body=new URLSearchParams({client_id:S.sp.clientId,grant_type:'refresh_token',refresh_token:S.sp.refresh});
        const r=await fetch('https://accounts.spotify.com/api/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body});
        let j={}; try{j=await r.json()}catch(e){}
        if(!r.ok){
          /* invalid_grant = revoked, or past Spotify's refresh-token lifetime. Other errors may be transient: keep the link. */
          if(j.error==='invalid_grant'){
            clearCreds(); S.sp.needsReconnect=true;
            try{localStorage.setItem(STORE_KEY,JSON.stringify(S))}catch(e){}
            try{renderSpStatus()}catch(e){}
            try{toast('Spotify session expired — reconnect in Taste.','err')}catch(e){}
            return false;
          }
          throw new Error(j.error||'refresh failed');
        }
        S.sp.token=j.access_token;
        if(j.refresh_token)S.sp.refresh=j.refresh_token;   /* Spotify may rotate it */
        S.sp.expires=Date.now()+(j.expires_in-60)*1000;
        S.sp.needsReconnect=false;
        persist(); return true;
      }catch(e){return false}
      finally{refreshP=null}
    })();
    return refreshP;
  };
  const _api=SP.api.bind(SP);
  SP.api=async function(path,opts){
    if(!S.sp.token||Date.now()>=S.sp.expires){const ok=await this.refreshToken();if(!ok)throw new Error('Not connected to Spotify. Reconnect in Taste.')}
    for(let attempt=0;attempt<3;attempt++){
      try{ return await _api(path,opts); }
      catch(e){
        if(e&&e.status===429&&attempt<2){   /* respect Retry-After, bounded retries */
          const ra=Number((e&&e.retryAfter)||0);
          await new Promise(function(res){setTimeout(res,Math.min(8000,ra>0?ra*1000:1200*(attempt+1)))});
          continue;
        }
        throw e;
      }
    }
  };
  const _handle=SP.handleReturn.bind(SP);
  SP.handleReturn=async function(){await _handle.apply(this,arguments);if(S.sp.refresh)persist()};
  const _disc=SP.disconnect.bind(SP);
  SP.disconnect=function(){_disc.apply(this,arguments);S.sp.needsReconnect=false;try{localStorage.removeItem(MIRROR)}catch(e){}try{localStorage.setItem(STORE_KEY,JSON.stringify(S))}catch(e){}};
  const _begin=SP.begin.bind(SP);
  SP.begin=async function(){const r=await _begin.apply(this,arguments);if(S.sp.clientId)persist();return r};
  let busy=false;
  async function kick(){
    if(busy||!S.sp.refresh)return;
    if(S.sp.token&&Date.now()<S.sp.expires)return;
    busy=true;const ok=await SP.refreshToken();busy=false;
    if(ok){try{renderSpStatus()}catch(e){}try{rInsights()}catch(e){}}
  }
  kick();
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)kick()});
  addEventListener('focus',kick);
  addEventListener('pageshow',e=>{if(e.persisted)kick()});
  /* Ship your own Spotify app to drop the setup screens entirely.
     Set window.CADENCE_SPOTIFY_CLIENT_ID = '<your client id>' in a script that runs
     before this one (or paste it below) and users just tap Connect. */
  const SHIP_ID=(typeof window.CADENCE_SPOTIFY_CLIENT_ID==='string'&&window.CADENCE_SPOTIFY_CLIENT_ID)||'';
  window.__shipSpotifyId=SHIP_ID;
  if(SHIP_ID&&!S.sp.clientId){S.sp.clientId=SHIP_ID}
  const _rs=renderSpStatus;
  renderSpStatus=function(){
    _rs.apply(this,arguments);
    const st=Q('#spStat'), btn=Q('#spotifyBtn');
    if(!SP.connected()&&S.sp.needsReconnect){
      if(st)st.textContent='Spotify session expired. Tap Reconnect to link again.';
      if(btn)btn.textContent='Reconnect';
    }else if(IS_INSTALLED&&!SP.connected()){
      if(st)st.textContent='Connect Spotify to save songs and seed your taste.';
    }
  };
})();

/* ---- cards: reuse DOM nodes so cover art never re-decodes (kills swipe flicker) ---- */
(function(){
  const CAP=16,cache=new Map(),PRE=new Set();
  function preload(list){
    if(!list)return;
    list.slice(0,7).forEach(t=>{
      if(!t||!t.art)return;
      let u; try{u=artOf(t)}catch(e){return}
      if(!u||PRE.has(u))return; PRE.add(u);
      const im=new Image(); im.decoding='async';
      try{im.src=u}catch(e){return}
      if(im.decode)im.decode().catch(()=>{});
    });
  }
  window.__preloadArt=preload;
  function sigOf(t){try{return [t.t,t.a,t.art||'',t.g||'',t.y||'',reasonFor(t)].join(String.fromCharCode(1))}catch(e){return String(t.id)}}
  function node(t){
    const id=String(t.id); let n=cache.get(id); const sig=sigOf(t);
    if(n&&n.dataset.sig!==sig){cache.delete(id);n=null}   /* metadata changed since it was cached: rebuild */
    if(!n){
      const tmp=document.createElement('div'); tmp.innerHTML=cardHTML(t); n=tmp.firstElementChild;
      if(!n)return null;
      n.dataset.sig=sig;
      cache.set(id,n);
      if(cache.size>CAP){for(const k of cache.keys()){if(k!==id){cache.delete(k);break}}}
    }else{
      n.style.transition='none'; n.style.transform=''; n.style.opacity=''; n.classList.remove('dragging');
      ['--ol','--on','--om','--ou'].forEach(k=>n.style.removeProperty(k));
      try{
        const m=matchOf(t);
        n.style.setProperty('--sc',clamp(m/100)); n.style.setProperty('--sh',hueOf(m));
        const b=n.querySelector('.score b'); if(b)b.innerHTML=m+'<sup>%</sup>';
      }catch(e){}
      try{reg(t)}catch(e){}
    }
    return n;
  }
  const _rd=renderDeck;
  renderDeck=function(d){
    const el=Q('#deck');
    if(!DECK.length){_rd.apply(this,arguments);return}
    el.style.setProperty('--p',0);
    const dl=d===true||d==='pile'||(d===undefined&&firstDeal); firstDeal=false;
    const frag=document.createDocumentFragment();
    DECK.slice(0,3).reverse().forEach(t=>{const n=node(t);if(n)frag.appendChild(n)});
    el.innerHTML=''; el.appendChild(frag);
    const top=el.lastElementChild; if(top)drag(top,DECK[0]);
    preload(DECK); setBg(DECK[0]); sync();
    if(dl){try{dealAnim()}catch(e){}}
    else{
      const cs=el.children;
      if(hasWA&&cs.length===3)cs[0].animate([{opacity:0}],{duration:380,easing:'ease-out',fill:'backwards'});
      if(auto&&view==='discover')ensurePlaying(DECK[0]);
    }
    if(window.__hydrateWave){try{window.__hydrateWave()}catch(e){}}
  };
  try{const _ed=ensureDeck;ensureDeck=function(){const r=_ed.apply(this,arguments);preload(DECK);return r}}catch(e){}
  preload(DECK);
})();

/* ---- settings: replay the onboarding, and strip developer scaffolding in-app ---- */
(function(){
  const b=Q('#obBtn');
  if(b)b.onclick=()=>{
    try{picked.clear()}catch(e){}
    try{ob={e:.5,v:.5,a:.5,era:null}}catch(e){}
    try{obBase=JSON.stringify(S.genre)}catch(e){}
    try{startOb(0)}catch(e){toast('Could not open onboarding','err')}
  };
  if(!IS_INSTALLED)return;
  const ship=window.__shipSpotifyId||'';
  try{const fx=Q('.fixes');if(fx)fx.remove()}catch(e){}
  try{
    const sps=Q('.sps');
    if(sps){
      const items=[...sps.children];
      /* with a shipped Client ID there is nothing to set up; otherwise keep only
         the paste-and-connect + permissions steps */
      items.forEach((li,i)=>{if(ship||i<4)li.remove()});
    }
  }catch(e){}
  try{const ci=Q('#spClient');if(ci&&ship)ci.remove()}catch(e){}
  try{const cs=Q('#spSave');if(cs&&ship)cs.remove()}catch(e){}
  try{document.querySelectorAll('#spPanel a.btn[target="_blank"]').forEach(a=>a.remove())}catch(e){}
})();
})();;
/* ================= v10: confidence that reacts to a listening phase shift ================= */
(function(){
'use strict';
const Q=s=>document.querySelector(s);

/* mean feature vector of the last k swipes */
function recentFeat(k){
  const h=(S.history||[]).slice(0,k); if(h.length<6) return null;
  const acc={energy:0,valence:0,acousticness:0,danceability:0}; let n=0;
  h.forEach(x=>{
    const tr=x&&x.track; if(!tr) return;
    let f=tr.f; if(!f){ try{ f=inferFeatures(tr) }catch(e){ return } }
    for(const key in acc) acc[key]+=(typeof f[key]==='number'?f[key]:.5);
    n++;
  });
  if(!n) return null;
  for(const key in acc) acc[key]/=n;
  return acc;
}
/* how far the recent swipes have drifted from the established taste vector (0..1) */
function phaseDivergence(){
  const r=recentFeat(12); if(!r) return 0;
  const F=S.feat||{}; let d=0;
  for(const key in r) d+=Math.abs(r[key]-(typeof F[key]==='number'?F[key]:.5));
  return d/4;
}
/* a shift only counts once there is enough recent signal */
function shiftOn(){ return nSw()>=14 && phaseDivergence()>0.13; }
/* confidence: grows with swipes, but is pulled back down while a shift is in progress */
function confidence(){
  const base=clamp(nSw()/40);
  const pen=clamp((phaseDivergence()-0.08)/0.22)*0.62;
  return clamp(base*(1-pen));
}
function renderMeter(){
  const bar=Q('#mbar'); if(bar) bar.style.width=Math.round(confidence()*100)+'%';
  const on=shiftOn();
  const m=Q('#meter'); if(m) m.classList.toggle('shift',on);
  const lab=Q('#mlabel'); if(lab) lab.textContent=on?'Phase shift':stage();
  const tail=Q('#mtail'); if(tail) tail.textContent=on?'reassessing taste':'Taste confidence';
  /* announce the transition once, and stay quiet until it settles */
  if(on&&!S._shift){ S._shift=true; try{save()}catch(e){} try{toast('Your listening has shifted — reassessing your taste.','ok')}catch(e){} }
  else if(!on&&S._shift){ S._shift=false; try{save()}catch(e){} }
}
window.__renderMeter=renderMeter;
window.__phase={div:phaseDivergence,conf:confidence,on:shiftOn};

after('hud',()=>renderMeter());
document.addEventListener('visibilitychange',()=>{ if(!document.hidden) renderMeter(); });
renderMeter();
})();;
/* ================= v12: continuity for the swiped-up card ================= */
(function(){
'use strict';
try{
  if(S.up && S.up.id){
    const t=Object.assign({},S.up);
    if(!t.f){ try{t.f=inferFeatures(t)}catch(e){} }
    if(t.p){
      reg(t);
      DECK=DECK.filter(function(x){return String(x.id)!==String(t.id)});
      DECK.unshift(t);
      if(typeof renderDeck==='function')renderDeck();
    }
  }
}catch(e){}
})();;
/* ================= v13: mini player (continuity across tabs) ================= */
(function(){
'use strict';
const Q=s=>document.querySelector(s);
const art=Q('#miniArt'), play=Q('#miniPlay');

/* play a track only if it isn't already the current one — never restart the music */
function ensurePlaying(t){ if(!t||!t.p)return; if(nowId!=null&&String(nowId)===String(t.id))return; playTrack(t); }
window.ensurePlaying=ensurePlaying;

function renderMini(){
  if(!art||!play)return;
  const ob=Q('#onboard');
  const show = view!=='discover' && nowId!=null && !(ob&&ob.classList.contains('open'));
  if(show) document.body.dataset.mini='1'; else delete document.body.dataset.mini;
  if(!show)return;
  const t=T.get(String(nowId));
  const u=(t&&t.art)?artOf(t):'';
  art.style.backgroundImage = u?('url("'+u+'")'):'none';
  art.innerHTML = u?'':IC.note;
  const on = !audio.paused;
  play.innerHTML = on?IC.pause:IC.play;
  play.classList.toggle('on',on);
  play.setAttribute('aria-label',on?'Pause':'Play');
  play.setAttribute('aria-pressed',on?'true':'false');
}
window.__renderMini=renderMini;

function togglePlay(){ if(nowId==null)return; try{ audio.paused?audio.play().catch(()=>{}):audio.pause(); }catch(e){} sync(); }
if(art)art.onclick=()=>go('discover');
if(play)play.onclick=togglePlay;

/* keep it live: on playback changes, on tab changes, on onboarding */
after('sync',()=>renderMini());
after('go',()=>renderMini());
after('startOb',()=>renderMini());
after('finishOb',()=>renderMini());
addEventListener('resize',renderMini);
renderMini();
})();;
/* ===== MOOD ENGINE — no AI. Lexicon + grammar rules + fuzzy matching. =====
   Output: a 4-d target (energy, valence, acoustic, groove), genre weights,
   search seeds, display labels. Grammar handled: negation, intensifiers,
   diminishers, "but" (later clause wins), phrases, typos, emoji, Hinglish. */
const MZ_LEX = [
/* words | [e,v,a,d] | weight | label | keyword queries | anchor artists | genres */
['sad down blue unhappy gloomy depressed hurting crying cry tears miserable sorrow grief grieving udaas dukhi rona',[.28,.18,.72,.28],1.4,'sad',['sad songs','tears'],['Billie Eilish','Phoebe Bridgers','Bon Iver','Adele'],['Alternative','Singer/Songwriter','Folk']],
['heartbroken heartbreak breakup broke up dumped ex missing someone miss you miss judaai bewafa',[.36,.2,.6,.34],1.4,'heartbroken',['heartbreak','breakup','miss you'],['Olivia Rodrigo','Sam Smith','Lewis Capaldi','Taylor Swift'],['Pop','Singer/Songwriter']],
['lonely alone isolated solitude solitary tanha tanhai akela',[.25,.25,.75,.25],1.3,'lonely',['alone','lonely'],['Radiohead','Lana Del Rey','Daughter','Bon Iver'],['Alternative','Indie','Folk']],
['numb blank void hollow empty foggy dissociated detached',[.2,.3,.6,.25],1.3,'numb',['numb','hollow'],['Radiohead','Mazzy Star','Cigarettes After Sex','Lord Huron'],['Alternative','Indie']],
['melancholy melancholic wistful bittersweet pensive reflective contemplative thoughtful introspective deep thoughts',[.3,.35,.68,.3],1.2,'wistful',['melancholy','bittersweet'],['Beach House','Cigarettes After Sex','The National','Lana Del Rey'],['Indie','Alternative']],
['nostalgic nostalgia memories remember childhood throwback old days old times retro back then reminisce missing the old days yaadein',[.5,.6,.38,.5],1.2,'nostalgic',['throwback','memories'],['Fleetwood Mac','Coldplay','The Killers','Backstreet Boys'],['Pop','Rock','Alternative']],
['happy joy joyful cheerful amazing wonderful fantastic glad upbeat bright sunny smiling smile delighted elated khush khushi',[.7,.9,.2,.75],1.3,'bright',['happy','good vibes','sunshine'],['Harry Styles','Dua Lipa','Pharrell Williams','Bruno Mars'],['Pop','Dance','Latin']],
['good great fine nice lovely pretty good',[.55,.75,.35,.6],.8,'easy',['feel good','good day'],['Jack Johnson','Vampire Weekend','Bruno Mars','Harry Styles'],['Pop','Indie']],
['light lighthearted carefree weightless free breezy',[.5,.8,.45,.55],1,'light',['carefree','light'],['Jack Johnson','Surfaces','Harry Styles','Vampire Weekend'],['Pop','Indie','Folk']],
['excited hyped pumped thrilled stoked buzzing energetic electric wired amped fired up energized cant wait mast bindaas',[.9,.8,.1,.85],1.3,'hyped',['hype','pump up','energy'],['Dua Lipa','The Weeknd','Calvin Harris','Travis Scott'],['Dance','Pop','Hip-Hop/Rap','Electronic']],
['calm peaceful serene relaxed relax tranquil at peace gentle soft quiet unwind mellow settled zen sukoon shaant',[.2,.55,.75,.25],1.2,'calm',['calm','peaceful','serene'],['Norah Jones','Bon Iver','Novo Amor','Ludovico Einaudi'],['Folk','Jazz','Classical','Indie']],
['chill chilled lowkey low key laid back vibe vibes vibing easygoing lazy lounge slow',[.38,.62,.55,.55],.9,'laid-back',['chill','laid back'],['Tom Misch','Rex Orange County','Khruangbin','Jungle'],['R&B/Soul','Indie','Jazz']],
['tired exhausted drained sleepy burnt burnout burned out fatigued worn spent weary drowsy thaka thakaan',[.2,.4,.7,.22],1.2,'worn out',['sleepy','tired'],['Cigarettes After Sex','Bon Iver','Sleeping At Last','Novo Amor'],['Folk','Classical','Indie']],
['anxious anxiety nervous worried worry stressed stress overwhelmed panic tense uneasy restless overthinking overthink spiral spiraling on edge',[.4,.35,.6,.3],1.2,'on edge',['anxiety','breathe'],['Billie Eilish','Radiohead','Sleeping At Last','Hozier'],['Alternative','Singer/Songwriter']],
['angry mad furious rage pissed irritated annoyed frustrated fed up livid bitter resentful aggressive gussa',[.92,.25,.1,.5],1.4,'fired up',['rage','angry'],['Linkin Park','Eminem','Rage Against The Machine','Kendrick Lamar'],['Rock','Hip-Hop/Rap','Metal','Punk']],
['in love love loved crush romantic romance butterflies infatuated smitten falling for kiss cuddle cuddly intimate affection flirty flirt ishq pyaar pyar mohabbat',[.45,.78,.45,.55],1.3,'in love',['love songs','romance','crush'],['Ed Sheeran','Taylor Swift','Daniel Caesar','SZA'],['Pop','R&B/Soul','Singer/Songwriter']],
['sexy seductive sensual steamy slow jam',[.5,.6,.3,.7],1.2,'sensual',['slow jam','sensual'],['The Weeknd','SZA','Frank Ocean','Jhene Aiko'],['R&B/Soul']],
['hopeful hope optimistic new beginnings fresh start healing recovering better brighter growth moving on proud',[.55,.72,.5,.5],1.1,'hopeful',['hope','new day','fresh start'],['Coldplay','Florence + The Machine','Lizzo','OneRepublic'],['Pop','Alternative']],
['grateful thankful blessed appreciate warm warmth cozy cosy comfy comfort homey snug hug wholesome tender',[.3,.7,.7,.35],1.1,'warm',['cozy','warm','comfort'],['Jack Johnson','Norah Jones','Ben Howard','Hozier'],['Folk','Singer/Songwriter','Jazz']],
['confident powerful boss unstoppable main character strong fearless bold badass savage swagger flex slay iconic hot girl',[.82,.72,.1,.82],1.2,'bold',['confidence','boss','power'],['Beyonce','Lizzo','Kendrick Lamar','Doja Cat'],['Hip-Hop/Rap','Pop','R&B/Soul']],
['bored boredom meh whatever idle dull blah unmotivated nothing to do bekaar',[.4,.4,.4,.45],.8,'meh',['bored','meh'],['Arctic Monkeys','Tame Impala','Mac DeMarco','Vampire Weekend'],['Indie','Alternative']],
['dreamy dream dreaming floaty floating hazy haze ethereal surreal spacey drift drifting cloudy airy cosmic trippy psychedelic sapna sapne',[.35,.55,.5,.4],1.1,'dreamy',['dream pop','ethereal'],['Tame Impala','Beach House','Cocteau Twins','Bon Iver'],['Indie','Alternative','Electronic']],
['fun playful silly goofy quirky giddy whimsical mischievous cheeky',[.65,.82,.3,.72],1,'playful',['fun','playful'],['Vampire Weekend','Harry Styles','MGMT','Dua Lipa'],['Pop','Indie','Dance']],
['focus focused concentrate concentration studying study homework exam exams deadline working coding programming deep work productive productivity grind writing reading library assignment',[.35,.5,.6,.38],1.2,'focused',['focus','study','instrumental'],['Ludovico Einaudi','Nujabes','Tycho','Hans Zimmer'],['Classical','Electronic','Soundtrack','Jazz']],
['workout gym lifting training running cardio sprint exercise pushups beast athletic hiit',[.92,.62,.06,.82],1.3,'driven',['workout','gym','pump up'],['Eminem','Kanye West','David Guetta','Imagine Dragons'],['Hip-Hop/Rap','Dance','Rock','Electronic']],
['party partying club clubbing dance dancing rave afterparty pregame pre game drunk drinks celebrate celebration birthday festival banger bangers lit turn up getting ready',[.88,.85,.05,.9],1.3,'party-ready',['party','club','dance'],['Calvin Harris','Dua Lipa','Bad Bunny','Lady Gaga'],['Dance','Pop','Latin','Electronic']],
['road trip roadtrip drive driving highway windows down car cruising cruise journey travel travelling adventure explore safar',[.65,.7,.3,.58],1,'on the road',['road trip','highway'],['Fleetwood Mac','The Killers','Tom Petty','Bruce Springsteen'],['Rock','Pop','Country','Alternative']],
['night drive midnight drive late night drive',[.55,.5,.2,.6],1.4,'neon',['night drive','midnight','neon'],['The Weeknd','Kavinsky','Tame Impala','Drake'],['Electronic','R&B/Soul','Alternative']],
['rain rainy raining drizzle storm thunder wet puddles downpour monsoon barish baarish',[.28,.35,.68,.3],1.2,'rainy',['rain','rainy day'],['Bon Iver','Radiohead','Billie Eilish','Lord Huron'],['Alternative','Folk','Indie']],
['window windowsill balcony terrace',[.3,.5,.65,.3],.6,'quiet',['window','balcony'],['Phoebe Bridgers','Bon Iver','Norah Jones','Novo Amor'],['Folk','Indie']],
['night midnight 3am 2am 4am 1am nighttime insomnia awake moonlight moon stars starry dark after dark late night raat',[.35,.42,.45,.45],1,'late-night',['midnight','late night','after dark'],['The Weeknd','Frank Ocean','Cigarettes After Sex','Bon Iver'],['R&B/Soul','Alternative','Electronic']],
['cant sleep sleepless tossing and turning',[.22,.35,.6,.25],1.3,'restless',['cant sleep','insomnia'],['Cigarettes After Sex','Daughter','Bon Iver','Sleeping At Last'],['Indie','Alternative','Folk']],
['morning sunrise dawn wake up woke up breakfast sunday morning fresh brunch',[.45,.72,.6,.45],1,'fresh',['good morning','sunrise'],['Jack Johnson','Vampire Weekend','Sufjan Stevens','Norah Jones'],['Folk','Indie','Pop','Jazz']],
['coffee cafe coffee shop latte espresso chai tapri',[.38,.65,.62,.42],.9,'coffee-warm',['coffee','cafe jazz'],['Norah Jones','Chet Baker','Diana Krall','Jack Johnson'],['Jazz','Folk','Singer/Songwriter']],
['sunset golden hour evening dusk twilight magic hour sundown',[.42,.65,.55,.45],1.1,'golden',['golden hour','sunset'],['Harry Styles','Lord Huron','Fleetwood Mac','Khruangbin'],['Indie','Pop','Rock']],
['beach ocean sea waves surf island tropical shore coast seaside summer holiday vacation vacay poolside pool',[.55,.85,.4,.65],1.1,'sun-soaked',['summer','beach','tropical'],['Jack Johnson','Kygo','Surfaces','Bob Marley'],['Reggae','Pop','Dance','Latin']],
['forest woods trees mountain mountains hike hiking nature camping campfire bonfire trek trail cabin lake river valley wilderness outdoors',[.32,.6,.85,.3],1.1,'earthy',['forest','mountain','campfire'],['Bon Iver','Fleet Foxes','Ben Howard','Lord Huron'],['Folk','Indie','Country']],
['snow winter cold frost snowing fireplace christmas blanket sweater hot chocolate',[.28,.62,.7,.3],1.1,'wintry',['winter','snow'],['Bon Iver','Sufjan Stevens','Ludovico Einaudi','Sleeping At Last'],['Folk','Classical','Indie']],
['city city lights skyline neon urban downtown streets street rooftop subway metro taxi traffic rush hour concrete skyscraper marine drive mumbai',[.6,.5,.2,.65],1,'urban',['city lights','downtown'],['Drake','The Weeknd','Frank Ocean','Travis Scott'],['Hip-Hop/Rap','R&B/Soul','Electronic']],
['train flight flying airport plane commute bus local train transit',[.4,.5,.45,.4],.8,'in transit',['train','flight','commute'],['Coldplay','Lord Huron','Passenger','Tycho'],['Indie','Alternative']],
['walk walking stroll wander wandering',[.45,.62,.55,.45],.8,'wandering',['walking','stroll'],['Vampire Weekend','Jack Johnson','Tame Impala','Phoebe Bridgers'],['Indie','Folk']],
['cooking kitchen cleaning chores laundry baking dishes tidying gardening plants sunday lazy sunday weekend home house homebody pajamas pyjamas couch sofa netflix movie rewatch ghar',[.42,.68,.5,.5],.9,'homey',['sunday morning','kitchen'],['Stevie Wonder','Norah Jones','Jack Johnson','Carole King'],['Pop','Jazz','R&B/Soul','Folk']],
['friends friend squad crew hangout gathering bbq picnic together roommates dosti',[.65,.8,.3,.65],1,'social',['friends','good times'],['Mac Miller','Vampire Weekend','Bruno Mars','The Killers'],['Pop','Hip-Hop/Rap','Indie']],
['sleep bed bedtime lullaby rest resting nap napping wind down winding down goodnight',[.15,.48,.8,.2],1.3,'drowsy',['sleep','lullaby','ambient'],['Max Richter','Sleeping At Last','Brian Eno','Ludovico Einaudi'],['Classical','Electronic','Folk']],
['gaming gamer',[.7,.6,.25,.6],1,'locked in',['video game music','gaming'],['Daft Punk','Porter Robinson','Hans Zimmer'],['Electronic','Soundtrack']],
['epic cinematic dramatic grand triumphant victory win won championship climax',[.72,.62,.35,.4],1.1,'cinematic',['epic','cinematic','triumph'],['Hans Zimmer','Two Steps From Hell','Imagine Dragons','Linkin Park'],['Soundtrack','Rock','Classical']],
['mysterious dark academia gothic moody brooding eerie haunting spooky shadows noir',[.4,.25,.55,.35],1.1,'brooding',['dark','moody','haunting'],['Billie Eilish','Hozier','The Neighbourhood','Lana Del Rey'],['Alternative','R&B/Soul','Electronic']],
['weird strange odd confused lost uncertain unsure mixed complicated conflicted torn',[.4,.4,.5,.4],.9,'unsettled',['confused','lost'],['Radiohead','Phoebe Bridgers','Mitski','Tame Impala'],['Alternative','Indie']],
['spiritual meditation meditate yoga prayer devotional mindful mindfulness breathe breathing',[.2,.6,.8,.2],1.2,'mindful',['meditation','yoga'],['Ludovico Einaudi','Deva Premal','Nils Frahm','Brian Eno'],['Classical','World','Electronic']],
['romantic dinner candlelit jazz wine dinner elegant classy sophisticated fancy',[.35,.62,.7,.45],1,'smooth',['jazz','dinner jazz'],['Frank Sinatra','Norah Jones','Miles Davis','Nina Simone'],['Jazz','Vocal','R&B/Soul']],
['rock metal punk headbang mosh guitar loud heavy rebellious rebel',[.9,.4,.2,.45],1.1,'loud',['rock','loud guitar'],['Foo Fighters','Arctic Monkeys','Green Day','Linkin Park'],['Rock','Metal','Punk']],
['hip hop rap trap bars cypher',[.7,.55,.1,.8],1.3,'rap-heavy',['hip hop','rap'],['Kendrick Lamar','J. Cole','Drake','Tyler, The Creator'],['Hip-Hop/Rap']],
['lofi lo fi beats',[.3,.5,.65,.45],1.3,'lo-fi',['lofi beats','chillhop'],['Nujabes','Joji','Jinsang','Tomppabeats'],['Hip-Hop/Rap','Electronic','Jazz']],
['acoustic unplugged',[.35,.55,.92,.3],1.2,'acoustic',['acoustic','unplugged'],['Ed Sheeran','Passenger','Jack Johnson','Ben Howard'],['Folk','Singer/Songwriter']],
['edm techno trance',[.88,.7,.04,.9],1.3,'electric',['edm','house music'],['Avicii','Swedish House Mafia','Martin Garrix','Kygo'],['Dance','Electronic']],
['piano classical orchestra orchestral strings instrumental',[.28,.5,.95,.2],1.2,'orchestral',['piano','orchestral'],['Ludovico Einaudi','Yiruma','Max Richter','Hans Zimmer'],['Classical','Soundtrack']],
['country cowboy truck',[.55,.65,.6,.5],1.1,'country',['country','heartland'],['Luke Combs','Zach Bryan','Chris Stapleton','Kacey Musgraves'],['Country']],
['reggaeton latin salsa bachata spanish',[.8,.82,.2,.85],1.2,'latin',['reggaeton','latin hits'],['Bad Bunny','Karol G','J Balvin','Shakira'],['Latin']],
['bollywood hindi desi punjabi filmy',[.6,.65,.4,.6],1,'desi',['bollywood','hindi songs'],['Arijit Singh','Pritam','A.R. Rahman','Diljit Dosanjh'],['World']]
];

/* Hinglish / India-context words nudge the search toward desi artists */
const MZ_IN = {dil:1.2,yaar:1,ishq:1.2,pyaar:1.2,pyar:1.2,barish:1.2,baarish:1.2,raat:1,mausam:1.2,udaas:1.2,sukoon:1.2,tanha:1.2,tanhai:1.2,zindagi:1.2,safar:1,khushi:1.2,bindaas:1.2,bohot:1,bahut:1,thoda:1,sapna:1,sapne:1,bollywood:1.5,hindi:1.5,desi:1.5,punjabi:1.5,arijit:1.5,ghar:.9,chai:.6,tapri:1,monsoon:.5,mumbai:.7,'marine drive':1,'local train':.8,dosti:1,yaadein:1.2,mohabbat:1.2,judaai:1.2,gussa:1.2,thaka:1.2,akela:1.2,mast:1};
const MZ_IN_ARTISTS = {
  low: ['Anuv Jain','Prateek Kuhad','Arijit Singh','Jubin Nautiyal'],
  mid: ['Pritam','Amit Trivedi','Ritviz','A.R. Rahman'],
  love:['Arijit Singh','Atif Aslam','Shreya Ghoshal','Darshan Raval'],
  high:['Badshah','Diljit Dosanjh','AP Dhillon','Honey Singh']
};
const MZ_INTENS = new Set('so really very super extremely totally completely deeply incredibly insanely too absolutely fully utterly hella seriously more proper properly mad'.split(' '));
const MZ_DIMIN  = new Set('kinda sorta slightly little somewhat semi bit mildly almost barely less tiny'.split(' '));
const MZ_NEG    = new Set('not no dont doesnt isnt arent wasnt aint never hardly without nahi nahin na'.split(' '));
const MZ_BUT    = new Set('but though although however yet except still'.split(' '));
const MZ_VAGUE  = new Set('idk dunno whatever something anything random surprise anyone no idea'.split(' '));
const MZ_STOP   = new Set('i im ive id me my myself am is are was be been being feel feeling feels felt like just today right now it its it s a an the and or of to in on at for with this that these those there here as so what whats how really kind sort kinda sorta bit get getting got gonna want wanna need would could should maybe probably guess think thinking'.split(' '));
const MZ_EMOJI = {'😭':'sad','😢':'sad','🥺':'lonely','💔':'heartbroken','😞':'sad','😔':'sad','😊':'happy','😄':'happy','😁':'happy','🥰':'love','😍':'love','❤️':'love','💕':'love','☀️':'sunny','🌞':'sunny','😴':'tired','🥱':'tired','🔥':'hyped','🤩':'excited','😡':'angry','🤬':'angry','😤':'frustrated','🌧️':'rain','☔':'rain','🌙':'night','🌃':'city','🌊':'ocean','🏖️':'beach','🎉':'party','💃':'dancing','🕺':'dancing','☕':'coffee','📚':'study','💪':'workout','🏋️':'gym','🚗':'drive','😌':'calm','🧘':'meditation','😰':'anxious','😬':'nervous','🥹':'grateful','✨':'dreamy','🌅':'sunset','🌄':'sunrise','❄️':'snow','🌲':'forest','😎':'confident'};


const MZ_PH = ['in love','falling for','broke up','missing someone','miss you','missing the old days','old days','old times','back then','deep thoughts','cant wait','fired up','at peace','laid back','low key','lo fi','fed up','on edge','main character','hot girl','nothing to do','burned out','new beginnings','fresh start','moving on','deep work','turn up','getting ready','pre game','road trip','windows down','night drive','midnight drive','late night drive','late night','after dark','cant sleep','tossing and turning','wake up','woke up','sunday morning','coffee shop','golden hour','magic hour','hot chocolate','city lights','rush hour','marine drive','local train','lazy sunday','wind down','winding down','dark academia','hip hop','slow jam','nothing to do'].sort((a,b)=>b.length-a.length);
const MZ_MAP = new Map(), MZ_SINGLE = [];
MZ_LEX.forEach(r=>{
  let s = r[0]; MZ_PH.forEach(p=>{ s = s.split(p).join(p.replace(/ /g,'_')); });
  const e = {v:r[1],w:r[2],l:r[3],q:r[4],a:r[5],g:r[6]};
  s.split(' ').forEach(w=>{ if(!w) return; const k=w.replace(/_/g,' '); if(!MZ_MAP.has(k)) MZ_MAP.set(k,e); if(!k.includes(' ')&&k.length>=5) MZ_SINGLE.push(k); });
});
function mzLev(a,b,max){
  if(Math.abs(a.length-b.length)>max) return max+1;
  let prev=Array.from({length:b.length+1},(_,i)=>i),pp=null;
  for(let i=1;i<=a.length;i++){ const cur=[i]; let mn=i;
    for(let j=1;j<=b.length;j++){ let c=Math.min(prev[j]+1,cur[j-1]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1)); if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1]&&pp) c=Math.min(c,pp[j-2]+1); cur[j]=c; if(c<mn)mn=c; }
    if(mn>max) return max+1; pp=prev; prev=cur; }
  return prev[b.length];
}
function mzFind(t){
  if(MZ_MAP.has(t)) return MZ_MAP.get(t);
  const c=[];
  if(t.endsWith('ing')){const b=t.slice(0,-3); c.push(b,b+'e'); if(b.length>2&&b[b.length-1]===b[b.length-2])c.push(b.slice(0,-1));}
  if(t.endsWith('ed')){const b=t.slice(0,-2); c.push(b,b+'e',t.slice(0,-1)); if(b.length>2&&b[b.length-1]===b[b.length-2])c.push(b.slice(0,-1));}
  if(t.endsWith('es'))c.push(t.slice(0,-2)); if(t.endsWith('s'))c.push(t.slice(0,-1));
  if(t.endsWith('ly'))c.push(t.slice(0,-2)); if(t.endsWith('y'))c.push(t.slice(0,-1),t.slice(0,-1)+'e');
  c.push(t.replace(/(.)\1+/g,'$1'));
  for(const x of c) if(x.length>2&&MZ_MAP.has(x)) return MZ_MAP.get(x);
  if(t.length>=5){ const max=t.length>=9?2:1; let best=null,bd=9;
    for(const k of MZ_SINGLE){ const d=mzLev(t,k,max); if(d<bd){bd=d;best=k; if(d===0)break;} }
    if(best&&bd<=max) return MZ_MAP.get(best); }
  return null;
}
function mzTokens(text){
  let s=String(text||'').toLowerCase();
  for(const k in MZ_EMOJI) if(s.includes(k)) s=s.split(k).join(' '+MZ_EMOJI[k]+' ');
  s=s.replace(/[’']/g,'').replace(/(.)\1{2,}/g,'$1$1').replace(/[^a-z0-9\u0900-\u097f ]+/g,' ').replace(/\s+/g,' ').trim();
  return s?s.split(' '):[];
}
const mzC=(x)=>Math.max(0,Math.min(1,x));
function mzRead(text, base){
  base = base || [.5,.5,.45,.5];
  const toks=mzTokens(text), hits=[]; let neg=0,mult=1,mleft=0,clause=1,vague=0,unk=0,ind=0;
  for(let i=0;i<toks.length;){
    const t=toks[i]; let found=null,n=0,key=t;
    for(let k=Math.min(4,toks.length-i);k>=1;k--){ const kk=toks.slice(i,i+k).join(' '); const e=k>1?MZ_MAP.get(kk):mzFind(kk); if(e){found=e;n=k;key=kk;break;} }
    let setN=false,setM=false;
    if(MZ_IN[key]) ind+=MZ_IN[key]; else if(MZ_IN[t]) ind+=MZ_IN[t];
    if(found){
      hits.push({e:found,w:found.w*clause*(mult>1?mult:1),neg:neg>0,m:mult});
      neg=0;mult=1;mleft=0; i+=n; continue;
    }
    if(MZ_BUT.has(t)){clause=1.5;neg=0;}
    else if(MZ_NEG.has(t)){neg=3;setN=true;}
    else if(MZ_INTENS.has(t)){mult=1.5;mleft=2;setM=true;}
    else if(MZ_DIMIN.has(t)||((t==='kind'||t==='sort')&&toks[i+1]==='of')){mult=.6;mleft=2;setM=true;}
    else if(MZ_VAGUE.has(t)) vague++;
    else if(!MZ_STOP.has(t)&&t.length>2) unk++;
    if(neg>0&&!setN)neg--; if(mleft>0&&!setM){mleft--; if(!mleft)mult=1;}
    i++;
  }
  let sw=0; const acc=[0,0,0,0];
  hits.forEach(h=>{
    let g=h.e.v.slice();
    if(h.neg) g=g.map((x,j)=>j<2?.5-(x-.5)*.6:x);
    else if(h.m>1) g=g.map((x,j)=>j<2?mzC(.5+(x-.5)*(1+(h.m-1)*.5)):x);
    else if(h.m<1) g=g.map(x=>.5+(x-.5)*.7);
    const w=h.w*(h.neg?.6:1)*(h.m<1?h.m+.3:1); sw+=w; g.forEach((x,j)=>acc[j]+=x*w);
  });
  let vec=base.slice(), conf=0;
  if(sw>0){ conf=mzC(sw/2); if(vague) conf*=.65; const tv=acc.map(x=>x/sw); vec=base.map((b,j)=>b+(tv[j]-b)*conf); }
  const pos=hits.filter(h=>!h.neg).sort((a,b)=>b.w-a.w);
  const labels=[]; pos.forEach(h=>{ if(!labels.includes(h.e.l)) labels.push(h.e.l); });
  const genres={}; pos.forEach(h=>h.e.g.forEach(g=>genres[g]=(genres[g]||0)+h.w/h.e.g.length));
  return {vec,conf,labels:labels.slice(0,3),genres,hits:pos,ind,vague,unk,matched:hits.length,love:pos.some(h=>h.e.l==='in love')};
}
function mzPick(arr,n,rnd){ const a=arr.slice(),o=[]; while(a.length&&o.length<n){ o.push(a.splice(Math.floor(rnd()*a.length),1)[0]); } return o; }
function mzPlan(r,rnd){
  rnd=rnd||Math.random; const out=[]; const [e,v,a,d]=r.vec;
  const wpool=(f)=>{ const p=[]; r.hits.slice(0,5).forEach(h=>f(h).forEach(x=>{ for(let i=0;i<Math.max(1,Math.round(h.w*2));i++)p.push(x); })); return [...new Set(p)]; };
  const arts=wpool(h=>h.e.a), kws=wpool(h=>h.e.q);
  mzPick(arts,r.ind>=.9?2:3,rnd).forEach(q=>out.push({q,kind:'art'}));
  mzPick(kws,2,rnd).forEach(q=>out.push({q,kind:'kw'}));
  if(r.ind>=.9){ const br=r.love?'love':e<.4?'low':e>.75?'high':'mid'; mzPick(MZ_IN_ARTISTS[br],2,rnd).forEach(q=>out.push({q,kind:'art'})); }
  const st=[]; if(e<.32&&a>.6)st.push('acoustic chill','indie folk'); else if(e<.4&&v<.4)st.push('sad indie','melancholy'); else if(e>.75&&d>.75)st.push('dance hits','club'); else if(e>.75)st.push('rock anthems','workout'); else if(v>.75&&e>.55)st.push('feel good pop'); else if(a>.7)st.push('acoustic'); else st.push('indie pop');
  mzPick(st,1,rnd).forEach(q=>out.push({q,kind:'style'}));
  return out.slice(0,7);
}
function mzPhrase(l,vec){
  if(!l.length){ const [e,v]=vec; l=[e<.38?'slow':e>.68?'high-energy':'steady', v<.4?'shadowy':v>.65?'bright':'open']; }
  const c=s=>s[0].toUpperCase()+s.slice(1);
  if(l.length===1) return 'Feels '+l[0]+'.';
  if(l.length===2) return c(l[0])+' and '+l[1]+'.';
  return c(l[0])+', '+l[1]+' & '+l[2]+'.';
}

(function(){
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const V=$('#v-moods'),ta=$('#mzTa'),box=$('#mzBox'),goB=$('#mzGo'),ph=$('#mzPh'),grid=$('#mzGrid'),sc=$('#mzScroll'),bar=$('#mzBar'),cv=$('#mzWave'),cx=cv.getContext('2d');
const SPARK='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.1 6.4L20.5 10l-6.4 1.6L12 18l-2.1-6.4L3.5 10l6.4-1.6z"/><path d="M19 15l.9 2.6 2.6.9-2.6.9L19 22l-.9-2.6-2.6-.9 2.6-.9z" opacity=".7"/></svg>';
const ARROW='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
$('.mz-sp').innerHTML=SPARK;goB.innerHTML=ARROW;
const GEN=['How are you feeling today?','What\u2019s the mood like?','Life feels light today, right?','What\u2019s the weather inside you?','Where\u2019s your head at?','What does right now feel like?','Set the scene.','What\u2019s the vibe, really?','Heavy day or easy day?','Tell me how it feels out there.','So\u2026 how are we doing?','What\u2019s the colour of today?','Heart or head today?','How\u2019s the world looking from where you are?'];
const TOD={m:['How did you wake up feeling?','What kind of morning is this?'],a:['How\u2019s the day treating you?','Still on track, or drifting?'],e:['How did today land?','What\u2019s the evening feeling like?'],n:['Still up? What\u2019s on your mind?','What does the night feel like?']};
const PH0='Describe it: a feeling, a scene, a vibe\u2026',PH1='Tweak it: more energy, less sad\u2026';
const CHIPS=[['Rainy window','rainy window, chai, nowhere to be',0],['Night drive','3am drive, windows down, city lights',0],['Numb but hopeful','kinda numb but weirdly hopeful',0],['Cozy Sunday','sunday morning, cleaning the house, coffee',0],['Pre-game','pre-game, getting ready, so hyped',0],['Main character','main character energy, golden hour',0],['Heartbroken','missing someone I shouldn\u2019t, heartbroken',0],['Deep focus','lofi study session, deadlines tomorrow',0],['Can\u2019t sleep','can\u2019t sleep, overthinking again',0],['Beach day','beach, summer, sun on my skin, carefree',0],['Feeling light','life feels light today, carefree and happy',0],['Need to vent','so angry and frustrated, need to let it out',0],['Nostalgic','nostalgic, old memories, throwback',0],['Gym mode','workout, gym, beast mode',0],['Villain arc','villain arc, bold, dark, unstoppable',0],['Train window','train window, commute, watching the city go by',0],['Dark academia','dark academia, library, moody, rainy evening',0],['3am thoughts','3am, lonely, overthinking, deep thoughts',0],['Road trip','road trip, windows down, highway, adventure',0],['Cooking at home','cooking in the kitchen, warm and cozy',0],['Golden hour walk','golden hour walk, calm, hopeful',0],['Monsoon chai','monsoon, chai, barish, sukoon',0],['Slow morning','slow morning, sunrise, coffee, fresh start',0],['Cinematic','epic, cinematic, triumphant',0],['Soft and sleepy','tired, soft, quiet, want to wind down',0],['Dancing alone','dancing alone in my room, happy and wild',0],['Missing home','nostalgic, missing home, warm memories',0],['Winter blanket','winter, blanket, snow outside, cozy',0]];
let CUR=[];function chips(){const a=CHIPS.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}CUR=a.slice(0,5);const el=$('#mzChips');el.innerHTML=CUR.map((c,i)=>`<button class="mz-chip" style="--i:${i}" data-i="${i}">${esc(c[0])}</button>`).join('')}
const TH=['Reading the room\u2026','Catching the tone\u2026','Finding songs that sit right\u2026'];
const TWEAK=/^(more|less|add|also|but|and|make|with|without|a bit|bit|slightly|too|except)\b/i;
const M={s:'idle',list:[],text:'',run:0,timers:[],lastQ:-1,done:false,follow:true,phi:0,labels:[]};
const clr=()=>{M.timers.forEach(clearTimeout);M.timers=[]};
const later=(f,ms)=>M.timers.push(setTimeout(f,ms));

/* ---------- waves ---------- */
const COOL=[[47,107,255],[91,75,255],[138,92,246],[34,193,195]],MID=[[66,133,244],[155,114,203],[217,101,112],[246,163,74]],WARM=[[255,107,154],[255,154,86],[255,209,102],[197,108,240]];
let cur=MID.map(c=>c.slice()),tgt=MID.map(c=>c.slice()),amp=.6,tAmp=.6,spd=1,tSpd=1,lift=.34,tLift=.34,boost=1,tm=0,raf=0,last=0;
const lerp=(a,b,t)=>a.map((x,i)=>x+(b[i]-x)*t);
function setColors(v,e){const p=v<.5?MID.map((c,i)=>lerp(COOL[i],c,v/.5)):MID.map((c,i)=>lerp(c,WARM[i],(v-.5)/.5));tgt=p;tAmp=.55+e*.85;tSpd=(.55+e*1.3)*(reduce?.3:1)}
function size(){const w=(V.clientWidth||innerWidth)*1.16,hh=(V.clientHeight||innerHeight)*1.14,k=reduce?4:2.6;cv.width=Math.max(120,Math.round(w/k));cv.height=Math.max(180,Math.round(hh/k))}
function draw(){const W=cv.width,H=cv.height;cx.clearRect(0,0,W,H);cx.globalCompositeOperation='lighter';cx.lineJoin='round';
const br=1+.07*Math.sin(tm*.5);
for(let i=0;i<4;i++){const base=H*(1-lift*(1-i*.15)),A=H*.05*amp*br*(1+i*.32),S=36,pts=[];
for(let s=0;s<=S;s++){const f=s/S,u=f*Math.PI;pts.push([W*f,base+A*(Math.sin(u*(1.25+i*.4)+tm*(.5+i*.2)+i*1.9)+.5*Math.sin(u*(2.4+i*.55)-tm*(.72+i*.15)+i*2.4)+.22*Math.sin(u*(4.1+i*.3)+tm*(.4+i*.1)))])}
cx.beginPath();cx.moveTo(pts[0][0],pts[0][1]);for(let s=1;s<S;s++){const m=[(pts[s][0]+pts[s+1][0])/2,(pts[s][1]+pts[s+1][1])/2];cx.quadraticCurveTo(pts[s][0],pts[s][1],m[0],m[1])}cx.lineTo(pts[S][0],pts[S][1]);
const ph=(Math.sin(tm*.16+i*1.3)*.5+.5),g=cx.createLinearGradient(-W*.35*ph,0,W*(1+.35*(1-ph)),0),al=.44-i*.04;
for(let k=0;k<4;k++){const c=cur[(i+k)%4].map(Math.round);g.addColorStop(k/3,`rgba(${c[0]},${c[1]},${c[2]},${al})`)}
const c0=cur[(i+1)%4].map(x=>Math.round(x*.55+255*.45));cx.strokeStyle=`rgba(${c0[0]},${c0[1]},${c0[2]},.55)`;cx.lineWidth=Math.max(1.2,H*.006);cx.stroke();
cx.lineTo(W,H+4);cx.lineTo(0,H+4);cx.closePath();cx.fillStyle=g;cx.fill()}
cx.globalCompositeOperation='source-over'}
function frame(ts){if(view!=='moods'||document.hidden){raf=0;return}raf=requestAnimationFrame(frame);const dt=Math.min(.05,(ts-last)/1000||.016);last=ts;tm+=dt*spd;
cur.forEach((c,i)=>{for(let k=0;k<3;k++)c[k]+=(tgt[i][k]-c[k])*.04});amp+=(tAmp*boost-amp)*.05;spd+=(tSpd*(boost>1?1.4:1)-spd)*.05;lift+=(tLift-lift)*.04;draw()}
function loop(){if(!raf){last=0;raf=requestAnimationFrame(frame)}}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&view==='moods')loop()});
if(window.ResizeObserver){new ResizeObserver(size).observe(V);new ResizeObserver(()=>V.style.setProperty('--bh',bar.offsetHeight+'px')).observe(bar)}
setColors(.5,.45);

/* ---------- headline + placeholder ---------- */
function qPool(){const h=new Date().getHours();return GEN.concat(h>=5&&h<12?TOD.m:h<17&&h>=12?TOD.a:h>=17&&h<23?TOD.e:TOD.n)}
function showQ(first){const el=$('#mzQ'),p=qPool();let i;do{i=Math.floor(Math.random()*p.length)}while(i===M.lastQ&&p.length>1);M.lastQ=i;
const put=()=>{const w=p[i].split(' ');el.classList.remove('out');el.innerHTML=w.map((x,k)=>`<span class="w" style="--i:${k}">${esc(x)}${k<w.length-1?' ':''}</span>`).join('')};
if(first||reduce){put();return}el.classList.add('out');later(put,520)}
setInterval(()=>{if(view==='moods'&&M.s==='idle'&&!ta.value&&document.activeElement!==ta)showQ()},6500);
chips();
$('#mzChips').addEventListener('click',e=>{const b=e.target.closest('.mz-chip');if(b){ta.blur();runMood(CUR[b.dataset.i][1])}});
ph.textContent=PH0;

/* ---------- input ---------- */
let tyT=0;
function resize(){ta.style.height='40px';ta.style.height=Math.min(Math.max(40,ta.scrollHeight),110)+'px'}
ta.addEventListener('input',()=>{resize();const t=ta.value.trim();box.classList.toggle('has',!!ta.value);goB.disabled=!t;boost=1.6;clearTimeout(tyT);tyT=setTimeout(()=>{boost=1},1500);
if(t){const r=mzRead(t);if(r.matched)setColors(r.vec[1],r.vec[0])}else setColors(.5,.45)});
ta.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();submit()}});
ta.addEventListener('focusin',e=>e.stopPropagation());ta.addEventListener('focus',()=>{document.body.classList.add('mz-typing');if(M.s==='idle')tLift=.4});
ta.addEventListener('blur',()=>{document.body.classList.remove('mz-typing');if(M.s==='idle')tLift=.34});
goB.addEventListener('pointerdown',e=>e.preventDefault());goB.onclick=submit;
function submit(){let t=ta.value.trim();if(!t)return;ta.value='';resize();box.classList.remove('has');goB.disabled=true;ta.blur();if(M.s==='built'&&M.text&&TWEAK.test(t))t=M.text+'. '+t;runMood(t)}

/* ---------- the read -> fetch -> rank pipeline ---------- */
const to=(p,ms)=>Promise.race([p,new Promise((_,j)=>setTimeout(()=>j(new Error('t')),ms))]);
function tastePlan(){const a=Object.values(S.artist||{}).filter(x=>x.score>0).sort((x,y)=>y.score-x.score).slice(0,3).map(x=>({q:x.name,kind:'art'}));return a.length?a.concat([{q:'indie pop',kind:'style'}]):[{q:'indie pop',kind:'style'},{q:'chill hits',kind:'style'},{q:'pop hits',kind:'style'}]}
function rank(res,plan,r){const m=new Map();
res.forEach((x,i)=>{if(x.status!=='fulfilled')return;const p=plan[i],key=norm(p.q);x.value.forEach(t=>{const id=String(t.id);if(m.has(id))return;const hay=norm(t.t+' '+t.a);
const hit=p.kind==='art'?(hay.includes(key)?1:.25):p.kind==='kw'?(key.split(' ').some(w=>w.length>2&&hay.includes(w))?.9:.3):.45;m.set(id,{t,hit})})});
let offline=false;if(m.size<12){offline=!m.size;[...SEED.map(s=>({...s,f:inferFeatures(s)})),...POOL].forEach(t=>{const id=String(t.id);if(!m.has(id))m.set(id,{t,hit:.2})})}
const [e,v,a,d]=r.vec,gm=Math.max(.001,...Object.values(r.genres)),ts=strength();
const sc=[...m.values()].filter(x=>{const A=S.artist[norm(x.t.a).split(',')[0].trim()];return!(A&&A.score<-.8)}).map(x=>{const f=x.t.f||inferFeatures(x.t);
const mf=clamp(1-(Math.abs(f.energy-e)+Math.abs(f.valence-v)+Math.abs(f.acousticness-a)+Math.abs(f.danceability-d))/4*1.5),gf=r.matched?clamp((r.genres[x.t.g]||0)/gm*.8+.2):.5;
return{t:x.t,rel:.55*mf+.15*gf+.3*x.hit+Math.random()*.03,tas:matchOf(x.t)/100}}).sort((p,q)=>q.rel-p.rel);
let pick=[];const cnt={};for(const x of sc){const k=norm(x.t.a).split(',')[0].trim();if((cnt[k]||0)>=2)continue;cnt[k]=(cnt[k]||0)+1;pick.push(x);if(pick.length>=18)break}
const nz=(arr,k)=>{const lo=Math.min(...arr.map(x=>x[k])),hi=Math.max(...arr.map(x=>x[k]));return x=>hi>lo?(x[k]-lo)/(hi-lo):.5};
if(pick.length){const nr=nz(pick,'rel'),nt=nz(pick,'tas');pick.forEach(x=>x.fin=.7*nt(x)+.3*nr(x)+Math.random()*.02);pick.sort((p,q)=>q.fin-p.fin)}
const out=pick.map(x=>x.t);
return{list:out,offline}}
async function runMood(txt){const id=++M.run;clr();M.text=txt;M.done=false;V.dataset.done='0';M.follow=true;
setState('think');let k=0;$('#mzTh').textContent=TH[0];const ti=setInterval(()=>{$('#mzTh').textContent=TH[++k%TH.length]},900);M.timers.push(ti);
const base=strength()>0?[S.feat.energy,S.feat.valence,S.feat.acousticness,S.feat.danceability]:undefined;
const r=mzRead(txt,base);setColors(r.vec[1],r.vec[0]);
const plan=r.matched?mzPlan(r):tastePlan(),t0=Date.now();
const res=await Promise.allSettled(plan.map(p=>to(searchItunes(p.q,p.kind==='art'?25:20),7000)));
const out=rank(res,plan,r);const wait=1600-(Date.now()-t0);if(wait>0)await new Promise(ok=>setTimeout(ok,wait));
clearInterval(ti);if(id!==M.run)return;
if(!out.list.length){setState('idle');toast('Nothing came back. Check your connection and try again.','err');return}
build(out,r,txt,id)}
function setState(s){M.s=s;V.dataset.s=s;tLift=s==='think'?.66:s==='built'?.22:.34;boost=s==='think'?2.2:1;ph.textContent=s==='built'?PH1:PH0}
function build(out,r,txt,id){M.list=out.list.slice();M.labels=r.labels;grid.innerHTML='';
$('#mzRes').textContent=r.matched?mzPhrase(r.labels,r.vec):'Hard to pin down \u2014 so here\u2019s what fits you.';
$('#mzQuote').textContent='\u201c'+txt.replace(/\s+/g,' ')+'\u201d';
const [e,v,a,d]=r.vec;$('#mzFp').innerHTML=[['Energy',e],['Brightness',v],['Organic',a],['Groove',d]].map(([l,x])=>`<div>${l}<u><i data-w="${Math.round(x*100)}"></i></u></div>`).join('');
requestAnimationFrame(()=>requestAnimationFrame(()=>$$('#mzFp i').forEach(i=>i.style.width=i.dataset.w+'%')));
$('#mzEnd').textContent='';sc.scrollTop=0;setState('built');const n=out.list.length,step=reduce?60:360;count(0,n);
out.list.forEach((t,i)=>later(()=>{if(id!==M.run)return;const el=tile(t);grid.appendChild(el);count(i+1,n);follow(el)},900+i*step));
later(()=>{if(id!==M.run)return;M.done=true;V.dataset.done='1';count(M.list.length,n);$('#mzEnd').textContent=out.offline?'Couldn\u2019t reach the music catalog, so this is built from what\u2019s already on your device.':'Tap a song to preview it. \u00d7 drops it from the playlist.'},900+n*step+500)}
function count(i,n){const el=$('#mzCount');el.innerHTML=M.done&&i>=n?`<b>${M.list.length}</b> songs`:i<n?`Building \u00b7 <b>${i}</b> / ${n}`:`<b>${M.list.length}</b> songs`}
function tile(t){reg(t);const m=matchOf(t),el=document.createElement('div');el.style.setProperty('--sh',hueOf(m));el.className='mt';el.dataset.id=t.id;el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label','Play '+t.t+' by '+t.a);
el.style.background=`linear-gradient(160deg,hsl(${hue(t)} 55% 35%),#1a1326)`;
el.innerHTML=`${t.art?`<img src="${esc(artOf(t))}" alt="" loading="lazy">`:''}<div class="mt-s" aria-label="Taste match ${m} percent"><b>${m}<sup>%</sup></b><small>match</small></div><button class="mt-x" aria-label="Remove from playlist">${IC.x}</button><div class="mt-i"><b>${esc(t.t)}</b><span>${esc(t.a)}</span></div><button class="mt-p" data-play="${t.id}" aria-label="Play">${IC.play}</button>`;return el}
function follow(el){if(!M.follow)return;const lim=bar.getBoundingClientRect().top-70,b=el.getBoundingClientRect().bottom;if(b>lim)sc.scrollBy({top:b-lim+16,behavior:reduce?'auto':'smooth'})}
['wheel','touchstart'].forEach(ev=>sc.addEventListener(ev,()=>{M.follow=false},{passive:true}));
grid.addEventListener('click',e=>{const tl=e.target.closest('.mt');if(!tl)return;if(e.target.closest('.mt-x')){drop(tl);return}if(e.target.closest('[data-play]'))return;auto=true;playTrack(T.get(String(tl.dataset.id)))});
grid.addEventListener('keydown',e=>{const tl=e.target.closest('.mt');if(tl&&e.target===tl&&(e.key==='Enter'||e.key===' ')){e.preventDefault();auto=true;playTrack(T.get(String(tl.dataset.id)))}});
function drop(tl){const id=String(tl.dataset.id);M.list=M.list.filter(t=>String(t.id)!==id);if(String(nowId)===id)stopAudio();tl.classList.add('gone');setTimeout(()=>{tl.remove();count(M.list.length,M.list.length)},380)}
$('#mzAgain').onclick=()=>{if(M.text)runMood(M.text)};
$('#savePl').onclick=()=>{if(!M.list.length)return;const nm=M.labels.slice(0,2).map(s=>s[0].toUpperCase()+s.slice(1)).join(' & ')||'Mood mix';savePlaylist(nm,M.list)};
after('sync',()=>$$('.mt').forEach(t=>t.classList.toggle('playing',String(t.dataset.id)===String(nowId)&&!audio.paused)));

/* ---------- enter the tab ---------- */
RENDER.moods=function(){if(M.s==='idle')chips();size();loop();if(M.s==='idle'&&!$('#mzQ').firstChild)showQ(true);setTimeout(size,60);setTimeout(size,400);
if(matchMedia('(hover:hover) and (pointer:fine)').matches&&M.s!=='think')setTimeout(()=>{if(view==='moods')ta.focus({preventScroll:true})},500)};
})();