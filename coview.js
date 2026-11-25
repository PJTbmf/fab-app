/* ============ 🎬 Show a link (co-viewer) ============
   A grown-up pastes a link or an embed code. Videos and pages that allow it open INSIDE the app, full screen or beside
   the lesson or board. In a live Pencil Spaces session (custom app, ?pencil=1) the teacher's choice opens on every child's
   screen, and YouTube / Vimeo play, pause and jumps follow the teacher.
   Some sites refuse to open inside other pages (BBC pages, Oak, many game sites). The BBC asks that only content with its own
   "Embed" button is shown inside other sites, so BBC pages open in their own tab, while a pasted BBC embed code shows inside.
   Nothing is sent anywhere by this file except, in live mode, the shared state that Pencil Spaces already keeps. */
(function(){
  'use strict';
  const RECENT_KEY = 'fab-coview-recent';
  const OUTSIDE = [ // sites that refuse to open inside the app, or ask not to be framed
    [/(^|\.)bbc\.co\.uk$|(^|\.)bbc\.com$/, 'BBC page'], [/(^|\.)thenational\.academy$/, 'Oak page'],
    [/(^|\.)topmarks\.co\.uk$/, 'Topmarks'], [/(^|\.)coolmath4kids\.com$|(^|\.)coolmathgames\.com$/, 'Coolmath'],
    [/(^|\.)facebook\.com$|(^|\.)instagram\.com$|(^|\.)tiktok\.com$|(^|\.)x\.com$|(^|\.)twitter\.com$/, 'social media page'],
    [/(^|\.)wordwall\.net$/, 'Wordwall page'], [/(^|\.)canva\.com$/, 'Canva page'],
    [/^(www\.)?google\.[a-z.]+$/, 'Google search']
  ];
  const S = { view:null, rev:0, appliedPlay:0, localClosed:false, side:false, el:null, chip:null, launch:null,
              frameKind:null, frameSrc:null, yt:{ state:-1, t:0, lastT:0, lastAt:0 }, vimeo:{ playing:false, t:0 }, pushTimer:null, sent:[] };

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const live = () => { try{ return typeof Live !== 'undefined' && Live.on ? Live : null; }catch(e){ return null; } };
  const isHost = () => { const L = live(); return !L || L.isHost(); };
  /* A child's own link (?learner=…) or a non-host in a live Space can watch what is shared, but not paste links. */
  /* Children (a child's own link, or not the teacher in a live Space) watch behind a shield: nothing inside a video player can be clicked. */
  function guarded(){
    const L = live(); if(L) return !L.isHost();
    try{ return !!new URLSearchParams(location.search).get('learner'); }catch(e){ return false; }
  }
  function canShare(){
    const L = live(); if(L) return L.isHost();
    try{ if(new URLSearchParams(location.search).get('learner')) return false; }catch(e){}
    return true;
  }

  /* ---------- turn a pasted link or embed code into something we can show ---------- */
  function parse(input){
    let raw = String(input || '').trim();
    if(!raw) return { ok:false, why:'Paste a link first.' };
    let embedded = false, title = '';
    if(/<iframe/i.test(raw)){
      const m = raw.match(/src\s*=\s*["']([^"']+)["']/i); if(!m) return { ok:false, why:'That embed code has no link in it.' };
      const t = raw.match(/title\s*=\s*["']([^"']+)["']/i); if(t) title = t[1];
      raw = m[1].replace(/&amp;/g, '&'); embedded = true;
      if(raw.startsWith('//')) raw = 'https:' + raw;
    }
    let u; try{ u = new URL(raw); }catch(e){ return { ok:false, why:'That doesn\'t look like a link. It should start with https://' }; }
    if(u.protocol !== 'https:') return { ok:false, why:'Only secure links (https://) can be shown.' };
    const host = u.hostname.toLowerCase().replace(/^m\./, ''), url = u.href;
    // YouTube (shown in privacy-enhanced mode, no unrelated videos)
    let yt = null;
    if(/(^|\.)youtube(-nocookie)?\.com$/.test(host)){
      if(u.pathname === '/watch') yt = u.searchParams.get('v');
      else { const m = u.pathname.match(/^\/(embed|shorts|live|v)\/([\w-]{6,})/); if(m) yt = m[2]; }
    } else if(host === 'youtu.be') yt = u.pathname.slice(1).split('/')[0];
    if(yt && /^[\w-]{6,20}$/.test(yt)){
      const st = parseInt(u.searchParams.get('t') || u.searchParams.get('start') || '0', 10) || 0;
      const src = `https://www.youtube-nocookie.com/embed/${yt}?enablejsapi=1&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&fs=0&cc_load_policy=0${st ? '&start=' + st : ''}&origin=${encodeURIComponent(location.origin)}`;
      return { ok:true, kind:'youtube', url, src, title:title || 'YouTube video', vid:yt };
    }
    if(/(^|\.)vimeo\.com$/.test(host)){
      const m = u.pathname.match(/(?:video\/)?(\d{5,})/);
      if(m) return { ok:true, kind:'vimeo', url, src:`https://player.vimeo.com/video/${m[1]}?api=1&dnt=1&title=0&byline=0&portrait=0`, title:title || 'Vimeo video' };
    }
    if(embedded) return { ok:true, kind:'page', url, src:url, title:title || friendly(host) + ' (embedded)', embed:true };
    if(host === 'docs.google.com'){
      let m = u.pathname.match(/^\/presentation\/d\/([\w-]+)/); if(m) return { ok:true, kind:'page', url, src:`https://docs.google.com/presentation/d/${m[1]}/embed?start=false&loop=false`, title:title || 'Google Slides' };
      m = u.pathname.match(/^\/(document|spreadsheets)\/d\/([\w-]+)/); if(m) return { ok:true, kind:'page', url, src:`https://docs.google.com/${m[1]}/d/${m[2]}/preview`, title:title || (m[1] === 'document' ? 'Google Doc' : 'Google Sheet') };
      m = u.pathname.match(/^\/forms\/d\/e?\/?([\w-]+)/); if(m) return { ok:true, kind:'page', url, src:url.includes('embedded=true') ? url : url + (u.search ? '&' : '?') + 'embedded=true', title:title || 'Google Form' };
    }
    if(host === 'drive.google.com'){ const m = u.pathname.match(/\/file\/d\/([\w-]+)/); if(m) return { ok:true, kind:'page', url, src:`https://drive.google.com/file/d/${m[1]}/preview`, title:title || 'Google Drive file' }; }
    if(/(^|\.)canva\.com$/.test(host) && /\/design\/[\w-]+\/[\w-]+\/(view|watch)/.test(u.pathname)){
      return { ok:true, kind:'page', url, src:u.origin + u.pathname + '?embed', title:title || 'Canva design' };
    }
    for(const [re, name] of OUTSIDE){ if(re.test(host)) return { ok:true, kind:'outside', url, src:'', title:title || friendly(host), site:name }; }
    return { ok:true, kind:'page', url, src:url, title:title || friendly(host), maybe:true };
  }
  function friendly(host){
    if(/bbc\.co\.uk|bbc\.com/.test(host)) return 'BBC page';
    if(/thenational\.academy/.test(host)) return 'Oak National Academy';
    return host.replace(/^www\./, '');
  }

  /* ---------- recent links (this device) ---------- */
  function recent(){ try{ return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') || []; }catch(e){ return []; } }
  function remember(v){
    const list = recent().filter(r => r.u !== v.url); list.unshift({ u:v.url, t:v.title });
    try{ localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 8))); }catch(e){}
  }

  /* ---------- the viewer ---------- */
  function build(){
    if(S.el) return;
    const el = document.createElement('section');
    el.id = 'coview'; el.className = 'coview'; el.hidden = true;
    el.setAttribute('role', 'region'); el.setAttribute('aria-label', 'Shared video or page');
    el.innerHTML = `<div class="cv-bar">
        <button type="button" class="cv-btn" id="cvBack">← Back</button>
        <div class="cv-title"><span id="cvWho">🎬</span> <b id="cvTitle"></b></div>
        <div class="cv-tools">
          <button type="button" class="cv-btn leaf" id="cvPlay" hidden>▶ <span>Play</span></button>
          <button type="button" class="cv-btn soft" id="cvSide" aria-pressed="false">◧ <span>Side by side</span></button>
          <a class="cv-btn soft" id="cvNewTab" target="_blank" rel="noopener">↗ <span>New tab</span></a>
          <button type="button" class="cv-btn flame" id="cvStop">⏹ <span>Stop showing</span></button>
        </div>
      </div>
      <div class="cv-body" id="cvBody"></div>
      <p class="cv-foot" id="cvFoot" hidden>Blank? Some websites don't let other pages show them. <button type="button" class="cv-link" id="cvFootOpen">Open it in a new tab</button></p>`;
    document.body.appendChild(el); S.el = el;
    const chip = document.createElement('button');
    chip.type = 'button'; chip.id = 'cvChip'; chip.className = 'cv-chip'; chip.hidden = true;
    chip.innerHTML = '🎬 <span>Your teacher is showing something.</span> <b>Watch</b>';
    chip.addEventListener('click', () => { S.localClosed = false; render(); });
    document.body.appendChild(chip); S.chip = chip;
    el.querySelector('#cvBack').addEventListener('click', () => closeLocal());
    el.querySelector('#cvSide').addEventListener('click', () => setSide(!S.side));
    el.querySelector('#cvStop').addEventListener('click', () => stop());
    el.querySelector('#cvFootOpen').addEventListener('click', () => { if(S.view) window.open(S.view.url, '_blank', 'noopener'); });
    el.querySelector('#cvPlay').addEventListener('click', () => { const playing = S.yt.state === 1 || S.vimeo.playing; if(S.frameKind === 'youtube') send('youtube', playing ? 'pauseVideo' : 'playVideo'); else if(S.frameKind === 'vimeo') send('vimeo', playing ? 'pause' : 'play'); });
    el.addEventListener('click', e => {
      const a = e.target.closest('[data-cvads]'); if(a){ adsChoice(a.dataset.cvads); return; }
      const c = e.target.closest('[data-cvcover]'); if(!c) return;
      if(c.dataset.cvcover === 'play'){ if(S.frameKind === 'youtube') send('youtube', 'playVideo'); else send('vimeo', 'play'); }
      if(c.dataset.cvcover === 'again'){ if(S.frameKind === 'youtube'){ send('youtube', 'seekTo', 0); send('youtube', 'playVideo'); } else { send('vimeo', 'setCurrentTime', 0); send('vimeo', 'play'); } }
      if(c.dataset.cvcover === 'close') closeLocal();
    });
    document.addEventListener('keydown', e => { if(e.key === 'Escape' && !el.hidden && !document.querySelector('.cvl-wrap:not([hidden])')) closeLocal(); });
    window.addEventListener('message', onPlayerMessage);
  }
  function setSide(on){
    S.side = !!on;
    document.body.classList.toggle('cv-side', S.side && !!S.view && S.view.open && !S.localClosed);
    const b = S.el && S.el.querySelector('#cvSide'); if(b){ b.setAttribute('aria-pressed', S.side ? 'true' : 'false'); b.querySelector('span').textContent = S.side ? 'Full screen' : 'Side by side'; b.firstChild.textContent = S.side ? '⛶ ' : '◧ '; }
    try{ localStorage.setItem('fab-coview-side', S.side ? '1' : '0'); }catch(e){}
  }
  function render(){
    build();
    const v = S.view, el = S.el, showing = !!(v && v.open && !S.localClosed);
    el.hidden = !showing;
    document.body.classList.toggle('cv-open', showing);
    document.body.classList.toggle('cv-side', showing && S.side);
    S.chip.hidden = !(v && v.open && S.localClosed);
    if(!showing){ if(!(v && v.open)) unloadFrame(); return; }
    el.querySelector('#cvTitle').textContent = v.title || 'Shared link';
    const fromTeacher = live() && !isHost();
    el.querySelector('#cvWho').textContent = fromTeacher ? '🧑‍🏫' : '🎬';
    el.querySelector('#cvStop').hidden = !isHost() && !!live();
    el.querySelector('#cvStop').querySelector('span').textContent = live() ? 'Stop for everyone' : 'Close';
    el.querySelector('#cvBack').textContent = fromTeacher ? '← Back to my learning' : '← Back';
    const nt = el.querySelector('#cvNewTab'); nt.href = v.url;
    const body = el.querySelector('#cvBody'), foot = el.querySelector('#cvFoot');
    if(v.kind === 'outside'){
      unloadFrame();
      foot.hidden = true;
      const bbc = /BBC/.test(v.site || v.title || '');
      body.innerHTML = `<div class="cv-outside">
        <div class="cv-big">${bbc ? '📺' : '🌐'}</div>
        <h2>${esc(v.title)}</h2>
        <p>${fromTeacher ? 'Your teacher wants to show you this. It opens in its own window.' : `This ${esc(v.site || 'website')} opens in its own tab. ${bbc ? 'The BBC asks other sites not to show its pages inside them.' : 'This website doesn\'t let other pages show it inside them.'}`}</p>
        <div class="cv-row"><a class="cv-btn leaf" href="${esc(v.url)}" target="_blank" rel="noopener">↗ Open it</a>
        ${fromTeacher ? '' : `<button type="button" class="cv-btn soft" data-cvcopy="${esc(v.url)}">📋 Copy the link</button>`}</div>
        ${fromTeacher ? '' : `<ul class="cv-tips">
          <li><b>In Pencil Spaces:</b> paste the link into a Web Viewer on the board so everyone sees it.</li>
          ${bbc ? '<li><b>BBC clips:</b> if the clip has a Share or Embed button, copy the embed code and paste it here. It will show inside the app.</li><li>BBC Teach puts many clips on YouTube. A YouTube link shows inside, with safety guards, but YouTube may show an advert.</li>' : '<li>Or share your screen while it plays.</li>'}
        </ul>`}
      </div>`;
      return;
    }
    if(S.frameSrc !== v.src){
      unloadFrame();
      body.innerHTML = '';
      const f = document.createElement('iframe');
      f.id = 'cvFrame'; f.title = v.title || 'Shared page';
      f.src = v.src;
      f.setAttribute('allow', 'autoplay; encrypted-media; fullscreen; picture-in-picture');
      f.setAttribute('allowfullscreen', '');
      f.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      const video = v.kind === 'youtube' || v.kind === 'vimeo';
      f.setAttribute('sandbox', video ? 'allow-scripts allow-same-origin allow-presentation' : 'allow-scripts allow-same-origin allow-presentation allow-forms' + (guarded() ? '' : ' allow-popups'));
      if(video){ f.className = 'cv-video'; f.removeAttribute('allowfullscreen'); f.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture'); }
      f.addEventListener('load', () => onFrameLoad(v.kind));
      body.appendChild(f);
      if(video){
        const cover = document.createElement('div'); cover.id = 'cvCover'; cover.className = 'cv-cover'; cover.hidden = true; body.appendChild(cover);
        if(guarded()){ const sh = document.createElement('div'); sh.id = 'cvShield'; sh.className = 'cv-shield'; sh.setAttribute('aria-hidden', 'true'); body.appendChild(sh); }
      }
      S.frameSrc = v.src; S.frameKind = v.kind;
      S.yt = { state:-1, t:0, lastT:0, lastAt:0 }; S.vimeo = { playing:false, t:0 };
    }
    foot.hidden = !(v.kind === 'page' && v.maybe);
    el.querySelector('#cvPlay').hidden = !(guarded() && !live() && (v.kind === 'youtube' || v.kind === 'vimeo'));
    applyPlay(); paintCover();
  }
  /* When a video is paused or finishes, our own card covers the player, so YouTube's "more videos" never shows. */
  function paintCover(){
    const c = document.getElementById('cvCover'); if(!c) return;
    const st = S.frameKind === 'youtube' ? S.yt.state : (S.vimeo.ended ? 0 : S.vimeo.started && !S.vimeo.playing ? 2 : -1);
    const kid = guarded(), teacherLive = !!live() && !isHost();
    let html = '';
    if(st === 2) html = `<div class="cv-cover-in"><p class="cv-big">⏸</p><h2>${teacherLive ? 'Your teacher has paused the video' : 'Paused'}</h2>${teacherLive ? '' : '<div class="cv-row"><button type="button" class="cv-btn leaf" data-cvcover="play">▶ Carry on</button><button type="button" class="cv-btn soft" data-cvcover="close">✕ Close</button></div>'}</div>`;
    else if(st === 0) html = `<div class="cv-cover-in"><p class="cv-big">🎬</p><h2>That’s the end</h2>${teacherLive ? '' : '<div class="cv-row"><button type="button" class="cv-btn leaf" data-cvcover="again">↺ Watch again</button><button type="button" class="cv-btn soft" data-cvcover="close">✕ Close</button></div>'}</div>`;
    c.hidden = !html; c.innerHTML = html;
    const pb = S.el && S.el.querySelector('#cvPlay'); if(pb && !pb.hidden){ const playing = st === 1; pb.innerHTML = playing ? '⏸ <span>Pause</span>' : '▶ <span>Play</span>'; }
    void kid;
  }
  /* YouTube can show adverts that no website can switch off. Before a YouTube video is shown, the teacher chooses. */
  function adsCard(p, opts){
    build();
    S.pending = { p, opts };
    const el = S.el; el.hidden = false; document.body.classList.add('cv-open');
    el.querySelector('#cvTitle').textContent = p.title || 'YouTube video';
    ['#cvSide', '#cvNewTab', '#cvPlay'].forEach(q => { el.querySelector(q).hidden = true; });
    el.querySelector('#cvStop').hidden = true; el.querySelector('#cvFoot').hidden = true;
    el.querySelector('#cvBack').textContent = '← Back';
    unloadFrame();
    el.querySelector('#cvBody').innerHTML = `<div class="cv-outside cv-ads">
      <div class="cv-big">⚠️</div>
      <h2>YouTube may show an advert</h2>
      <p>YouTube can play adverts before or during any video, and no website can switch them off.</p>
      <ul class="cv-tips">
        <li>✅ <b>Safety guards are on:</b> children can’t click anything in the video (adverts, links or “more videos”), nothing can open a new tab, and our own card covers the screen when the video is paused or ends.</li>
        <li>💡 <b>No adverts:</b> Vimeo, a BBC embed code (in the UK), or a video you’ve put in Google Drive or OneDrive.</li>
      </ul>
      <div class="cv-row"><button type="button" class="cv-btn leaf" data-cvads="yes">▶ Show it with the guards on</button><button type="button" class="cv-btn soft" data-cvads="no">Choose an ad-free video</button></div>
    </div>`;
    return { ok:true, kind:'youtube', pending:true };
  }
  function adsChoice(c){
    const pd = S.pending; S.pending = null;
    if(c === 'yes' && pd){ ['#cvSide', '#cvNewTab'].forEach(q => { S.el.querySelector(q).hidden = false; }); open(pd.p.url, Object.assign({}, pd.opts, { adsOk:true })); return; }
    S.el.hidden = true; document.body.classList.remove('cv-open');
    if(c === 'no') launcher({ msg:'Ad-free choices: Vimeo, a BBC embed code (Share → Embed), or your own video in Google Drive or OneDrive.' });
  }
  function unloadFrame(){ const f = document.getElementById('cvFrame'); if(f) f.remove(); S.frameSrc = null; S.frameKind = null; }

  /* ---------- open / close ---------- */
  function open(input, opts){
    opts = opts || {};
    const p = parse(input);
    if(!p.ok) return p;
    const L = live();
    if(L && !L.isHost()) return { ok:false, why:'Only the teacher can share a link in a live session.' };
    if(p.kind === 'youtube' && !opts.adsOk) return adsCard(p, opts);
    ['#cvSide', '#cvNewTab'].forEach(q => { if(S.el) S.el.querySelector(q).hidden = false; });
    S.rev = Math.max(S.rev, (S.view && S.view.rev) || 0) + 1;
    S.view = { rev:S.rev, open:true, url:p.url, src:p.src, kind:p.kind, title:(opts.title || p.title || '').slice(0, 90), site:p.site || '', maybe:!!p.maybe, by:L ? L.me : null, play:{ s:'pause', t:0, r:0 } };
    S.appliedPlay = 0; S.localClosed = false;
    if(opts.side != null) S.side = !!opts.side;
    remember(S.view);
    render(); push();
    try{ document.getElementById('cvBack').focus(); }catch(e){}
    return { ok:true, kind:p.kind };
  }
  function closeLocal(){
    if(S.pending && (!S.view || !S.view.open)){ adsChoice('back'); return; }
    if(!S.view) return;
    if(live() && !isHost()){ S.localClosed = true; render(); return; }
    stop();
  }
  function stop(){
    if(!S.view) return;
    if(live() && !isHost()){ S.localClosed = true; render(); return; }
    S.rev = Math.max(S.rev, S.view.rev || 0) + 1;
    S.view = Object.assign({}, S.view, { rev:S.rev, open:false });
    unloadFrame(); render(); push();
  }
  function push(){ const L = live(); if(L && L.isHost()) try{ L.push(); }catch(e){} }

  /* ---------- live: what goes into, and comes out of, the shared state ---------- */
  function shared(){ return S.view ? JSON.parse(JSON.stringify(S.view)) : null; }
  function fromShared(v){
    if(!v || typeof v !== 'object' || !v.rev) return;
    const mine = (S.view && S.view.rev) || 0;
    if(v.rev < mine){ if(isHost()) push(); return; }      // an older copy came back: the teacher re-sends the latest
    const myR = (S.view && S.view.play && S.view.play.r) || 0, theirR = (v.play && v.play.r) || 0;
    if(v.rev === mine && theirR < myR){ if(isHost()) push(); return; }
    if(v.rev === mine && theirR === myR) return;
    const opened = v.open && (!S.view || !S.view.open || S.view.url !== v.url);
    S.view = JSON.parse(JSON.stringify(v)); S.rev = Math.max(S.rev, v.rev);
    if(opened) S.localClosed = false;
    if(!isHost()) render();
  }

  /* ---------- video players: listen to the teacher's player, steer the children's ---------- */
  function frameWin(){ const f = document.getElementById('cvFrame'); return f && f.contentWindow; }
  function send(kind, cmd, arg){
    S.sent.push({ kind, cmd, arg });
    if(S.sent.length > 50) S.sent.shift();
    const w = frameWin(); if(!w) return;
    try{
      if(kind === 'youtube'){
        const args = cmd === 'seekTo' ? [arg, true] : [];
        w.postMessage(JSON.stringify({ event:'command', func:cmd, args }), 'https://www.youtube-nocookie.com');
      } else if(kind === 'vimeo'){
        w.postMessage(cmd === 'setCurrentTime' ? { method:cmd, value:arg } : { method:cmd }, 'https://player.vimeo.com');
      }
    }catch(e){}
  }
  function onFrameLoad(kind){
    const w = frameWin(); if(!w) return;
    try{
      if(kind === 'youtube'){
        w.postMessage(JSON.stringify({ event:'listening', id:'fabcv', channel:'widget' }), 'https://www.youtube-nocookie.com');
        w.postMessage(JSON.stringify({ event:'command', func:'addEventListener', args:['onStateChange'], id:'fabcv', channel:'widget' }), 'https://www.youtube-nocookie.com');
      } else if(kind === 'vimeo'){
        ['play', 'pause', 'seeked', 'timeupdate', 'ended', 'finish'].forEach(e => w.postMessage({ method:'addEventListener', value:e }, 'https://player.vimeo.com'));
      }
    }catch(e){}
    setTimeout(() => { S.appliedPlay = 0; applyPlay(); }, 900);
  }
  function hostPlayer(state, t){                      // the teacher's player changed: tell everyone
    if(!S.view || !isHost() || !live()) return;
    const p = S.view.play || { s:'pause', t:0, r:0 };
    const s = state === 'play' ? 'play' : 'pause';
    const expected = p.s === 'play' ? p.t + (Date.now() - (S.lastPushAt || Date.now())) / 1000 : p.t;
    if(p.s === s && Math.abs(expected - t) < 2.5) return;   // nothing a child would notice
    S.view.play = { s, t:Math.max(0, Math.round(t * 10) / 10), r:(p.r || 0) + 1 };
    S.lastPushAt = Date.now();
    clearTimeout(S.pushTimer); S.pushTimer = setTimeout(push, 150);
  }
  function applyPlay(){                               // a child follows the teacher
    const v = S.view; if(!v || !v.play || isHost() || !live() || S.localClosed) return;
    if(v.kind !== 'youtube' && v.kind !== 'vimeo') return;
    if(v.play.r === S.appliedPlay) return;
    S.appliedPlay = v.play.r;
    const t = v.play.s === 'play' ? v.play.t + 0.6 : v.play.t;
    if(v.kind === 'youtube'){ send('youtube', 'seekTo', t); send('youtube', v.play.s === 'play' ? 'playVideo' : 'pauseVideo'); }
    else { send('vimeo', 'setCurrentTime', t); send('vimeo', v.play.s === 'play' ? 'play' : 'pause'); }
  }
  function onPlayerMessage(e){
    const w = frameWin(); if(!w || e.source !== w) return;
    if(S.frameKind === 'youtube' && e.origin === 'https://www.youtube-nocookie.com'){
      let d; try{ d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; }catch(err){ return; }
      if(!d) return;
      const info = d.info || {};
      if(typeof info.currentTime === 'number'){ S.yt.lastT = S.yt.t; S.yt.t = info.currentTime; }
      let st = null;
      if(d.event === 'onStateChange') st = d.info;
      else if(typeof info.playerState === 'number') st = info.playerState;
      if(st != null && st !== S.yt.state){ S.yt.state = st; if(st === 1) hostPlayer('play', S.yt.t); else if(st === 2) hostPlayer('pause', S.yt.t); paintCover(); }
      else if(S.yt.state === 1 && typeof info.currentTime === 'number' && Math.abs(info.currentTime - S.yt.lastT) > 3) hostPlayer('play', info.currentTime);
    } else if(S.frameKind === 'vimeo' && e.origin === 'https://player.vimeo.com'){
      let d; try{ d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; }catch(err){ return; }
      if(!d || !d.event) return;
      const sec = d.data && typeof d.data.seconds === 'number' ? d.data.seconds : S.vimeo.t;
      if(d.event === 'play'){ S.vimeo.playing = true; S.vimeo.started = true; S.vimeo.ended = false; S.vimeo.t = sec; hostPlayer('play', sec); paintCover(); }
      else if(d.event === 'pause'){ S.vimeo.playing = false; S.vimeo.t = sec; hostPlayer('pause', sec); paintCover(); }
      else if(d.event === 'ended' || d.event === 'finish'){ S.vimeo.playing = false; S.vimeo.ended = true; paintCover(); }
      else if(d.event === 'seeked'){ S.vimeo.t = sec; hostPlayer(S.vimeo.playing ? 'play' : 'pause', sec); }
      else if(d.event === 'timeupdate'){ if(Math.abs(sec - S.vimeo.t) > 3) hostPlayer(S.vimeo.playing ? 'play' : 'pause', sec); S.vimeo.t = sec; }
    }
  }

  /* ---------- the "Show a link" panel ---------- */
  function launcher(opts){
    opts = opts || {};
    build();
    if(!S.launch){
      const w = document.createElement('div');
      w.className = 'cvl-wrap'; w.hidden = true;
      w.innerHTML = `<div class="cvl" role="dialog" aria-modal="true" aria-labelledby="cvlTitle">
        <button type="button" class="cvl-x" aria-label="Close">✕</button>
        <h2 id="cvlTitle">🎬 Cinema: show a video or a page</h2>
        <p class="cvl-sub">Paste a link or an embed code. Vimeo, Google Slides, Drive and OneDrive videos, BBC embed codes and many learning sites open inside the app. YouTube does too, with safety guards, but it may show adverts.</p>
        <div class="cvl-row"><input id="cvlUrl" type="text" inputmode="url" autocomplete="off" spellcheck="false" placeholder="https://… or <iframe …>" aria-label="Link or embed code to show">
          <button type="button" class="cv-btn leaf" id="cvlGo">Show it</button></div>
        <label class="cvl-check"><input type="checkbox" id="cvlSide"> Show it beside the lesson or board</label>
        <p class="cvl-msg" id="cvlMsg" aria-live="polite"></p>
        <div id="cvlStep"></div>
        <div id="cvlRecent"></div>
        <p class="cvl-note">Check a page yourself before showing it to a child. Links are kept on this device only.</p>
      </div>`;
      document.body.appendChild(w); S.launch = w;
      const go = () => {
        const r = open(w.querySelector('#cvlUrl').value, { side:w.querySelector('#cvlSide').checked });
        const m = w.querySelector('#cvlMsg');
        if(!r.ok){ m.textContent = r.why; m.className = 'cvl-msg bad'; return; }
        m.textContent = ''; w.querySelector('#cvlUrl').value = ''; w.hidden = true;
      };
      w.querySelector('#cvlGo').addEventListener('click', go);
      w.querySelector('#cvlUrl').addEventListener('keydown', e => { if(e.key === 'Enter') go(); });
      w.querySelector('.cvl-x').addEventListener('click', () => { w.hidden = true; });
      w.addEventListener('click', e => {
        if(e.target === w){ w.hidden = true; return; }
        const r = e.target.closest('[data-cvrecent]'); if(r){ w.querySelector('#cvlUrl').value = r.dataset.cvrecent; go(); return; }
        const x = e.target.closest('[data-cvforget]');
        if(x){ const list = recent().filter(i => i.u !== x.dataset.cvforget); try{ localStorage.setItem(RECENT_KEY, JSON.stringify(list)); }catch(err){} paintRecent(); }
      });
      w.addEventListener('keydown', e => { if(e.key === 'Escape') w.hidden = true; });
    }
    const w = S.launch;
    w.querySelector('#cvlSide').checked = opts.side != null ? !!opts.side : S.side;
    const step = w.querySelector('#cvlStep');
    const links = (opts.links || []).filter(l => l && /^https:\/\//.test(l.u));
    step.innerHTML = links.length ? `<h3>For this step</h3><div class="cvl-list">${links.map(l => `<button type="button" class="cvl-item" data-cvrecent="${esc(l.u)}">▶ ${esc(l.t || l.u)}</button>`).join('')}</div>` : '';
    paintRecent();
    w.querySelector('#cvlMsg').textContent = opts.msg || ''; w.querySelector('#cvlMsg').className = 'cvl-msg';
    if(!canShare()){ w.querySelector('#cvlMsg').textContent = 'Only a grown-up can share links.'; }
    w.hidden = false;
    setTimeout(() => { try{ w.querySelector('#cvlUrl').focus(); }catch(e){} }, 30);
  }
  function paintRecent(){
    const box = S.launch && S.launch.querySelector('#cvlRecent'); if(!box) return;
    const r = recent();
    box.innerHTML = r.length ? `<h3>Shown recently</h3><div class="cvl-list">${r.map(i => `<span class="cvl-rec"><button type="button" class="cvl-item" data-cvrecent="${esc(i.u)}">▶ ${esc(i.t || i.u)}</button><button type="button" class="cvl-forget" data-cvforget="${esc(i.u)}" aria-label="Forget ${esc(i.t || 'this link')}">✕</button></span>`).join('')}</div>` : '';
  }

  document.addEventListener('click', e => {
    const c = e.target.closest('[data-cvcopy]');
    if(c){ const u = c.dataset.cvcopy; try{ navigator.clipboard.writeText(u); c.textContent = '✅ Copied'; }catch(err){ window.prompt('Copy this link:', u); } return; }
    const s = e.target.closest('[data-cvshow]');
    if(s){ e.preventDefault(); const r = open(s.dataset.cvshow, { title:s.dataset.cvtitle || '' }); if(!r.ok) alertSoft(r.why); return; }
    if(e.target.closest('[data-cvlaunch]')){ e.preventDefault(); launcher(); }
  });
  function alertSoft(t){ build(); S.chip.hidden = false; S.chip.innerHTML = '⚠️ ' + esc(t); setTimeout(() => { S.chip.hidden = true; S.chip.innerHTML = '🎬 <span>Your teacher is showing something.</span> <b>Watch</b>'; }, 3500); }

  try{ S.side = localStorage.getItem('fab-coview-side') === '1'; }catch(e){}
  window.CoView = { parse, open, stop, closeLocal, launcher, canShare, shared, fromShared, setSide,
    state:() => S.view, _hostPlayer:hostPlayer, _sent:() => S.sent.slice(), _ytState:st => { S.yt.state = st; paintCover(); }, guarded };
})();
