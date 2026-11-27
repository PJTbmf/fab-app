/* The landing page: Fab Fox World is the place children arrive. A big, living window into the world sits at the top of
   the home screen, with the child's stars, cub and missions, and one big button to step in. */
(function(){
  'use strict';
  const css = `
  .fw-hero{position:relative;display:grid;grid-template-columns:minmax(0,1.55fr) minmax(250px,1fr);max-width:1000px;margin:8px auto 18px;border:3px solid var(--ink,#2B1A12);border-radius:30px;overflow:hidden;box-shadow:0 8px 0 rgba(43,26,18,.18),0 14px 30px rgba(43,26,18,.18);background:#FFF6E6;cursor:pointer;text-align:left}
  .fw-hero:focus-visible{outline:5px solid #2B1A12;outline-offset:4px}
  .fw-scene{position:relative;min-height:270px;overflow:hidden;background:#9fd47c}
  .fw-map{position:absolute;inset:0;width:100%;height:100%}
  .fw-pl{position:absolute;transform:translate(-50%,-50%);display:grid;place-items:center;width:38px;height:38px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#fff,#fff6e6);border:3px solid #fff;box-shadow:0 3px 7px rgba(43,26,18,.28);font-size:1.15rem;animation:fwbob 3.2s ease-in-out infinite}
  .fw-tree{position:absolute;transform:translate(-50%,-50%);font-size:1.5rem;filter:drop-shadow(0 3px 0 rgba(43,26,18,.15))}
  .fw-fr.fab-char{position:absolute;width:34px;margin:0;transform:translate(-50%,-70%);animation:fwbob 2.6s ease-in-out infinite}
  @keyframes fwbob{0%,100%{translate:0 0}50%{translate:0 -5px}}
  .fw-fab.fab-char{position:absolute;width:46px;margin:0;transform:translate(-50%,-80%);left:14.3%;top:43%;animation:fwwalk 18s ease-in-out infinite alternate}
  @keyframes fwwalk{0%{left:14.3%;top:43%}18%{left:11.8%;top:58.5%}40%{left:30.5%;top:49%}55%{left:30.5%;top:66%}80%{left:42.8%;top:43%}100%{left:50.5%;top:32%}}
  .fw-cub{position:absolute;font-size:1.3rem;transform:translate(-50%,-50%);animation:fwbob 1.6s ease-in-out infinite}
  .fw-zl{position:absolute;bottom:8px;background:rgba(255,255,255,.85);border-radius:999px;padding:2px 10px;font-weight:800;font-size:.85rem;color:#2B1A12}
  @media (max-width:560px){.fw-scene{min-height:250px}.fw-pl{width:28px;height:28px;font-size:.85rem;border-width:2px}.fw-fr.fab-char{width:24px}.fw-fab.fab-char{width:34px}.fw-tree{font-size:1.05rem}.fw-zl{font-size:.68rem;padding:1px 6px;bottom:5px}.fw-cub{font-size:1rem}}
  .fw-panel{padding:20px 22px;display:flex;flex-direction:column;gap:10px;justify-content:center;background:linear-gradient(#FFF6E6,#FFE9C2)}
  .fw-panel h2{margin:0;font-family:var(--headline);font-weight:400;color:#FE4D02;font-size:var(--t-title,2rem);line-height:1.1;text-shadow:2px 2px 0 #fff}
  .fw-panel p{margin:0;font-size:var(--t-body,1.05rem);line-height:1.4;color:#4A2A18}
  .fw-stats{display:flex;flex-wrap:wrap;gap:8px}
  .fw-stats span{background:#fff;border:2px solid #f1dfb8;border-radius:999px;padding:4px 12px;font-weight:800;font-size:var(--t-small,.95rem);color:#2B1A12}
  .fw-go{align-self:flex-start;border:3px solid #2B1A12;border-radius:999px;background:linear-gradient(#ff8a3d,#FE4D02);color:#fff;font:inherit;font-weight:800;font-size:var(--t-btn-big,1.2rem);padding:12px 24px;min-height:52px;box-shadow:0 4px 0 #b83700;cursor:pointer}
  .fw-go:active{transform:translateY(3px);box-shadow:0 1px 0 #b83700}
  #screen-hub .fab-hello{display:none}
  .category-tile{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:8px;padding-top:40px!important}
  .category-tile .badge{position:absolute;top:12px;left:50%;transform:translateX(-50%);white-space:nowrap;margin:0}
  @media (max-width:760px){.fw-hero{grid-template-columns:1fr}.fw-scene{min-height:200px}}
  @media (prefers-reduced-motion:reduce){.fw-pl,.fw-fab,.fw-cub,.fw-fr{animation:none}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const PL = [['🏡',9.5,20],['🛠️',15.7,43],['🛋️',7.1,58],['🏕️',30.5,66],['🎵',22.4,53],['🤸',38.6,54],['🥕',50.5,23],['🪚',65.7,32],['🎨',50.5,74],['🪧',61.9,80],['🛝',81,23],['📚',93.3,43],['⛵',81.9,77],['🪵',94.3,72],['🧭',14.8,80.3]];
  const FR = [['doc',20.5,36],['nurse',11.5,51],['mum',55,15],['dad',70,25],['yellow',85.5,15],['green',88,36]];
  const TREES = [['🌳',3,30],['🌳',26,30],['🌳',33,84],['🌳',5,82],['🌳',41,36],['🍂',56,44],['🍂',73,60],['🍂',47,90],['🌲',77,48],['🌲',97,20],['🌲',89,90],['🌲',75,88]];
  function stats(){
    let S = null;
    try{ const raw = (typeof fabLearnerCode === 'function' && fabLearnerCode()) || ''; const k = 'fabworld-v2-' + (raw ? raw.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 20) : 'local'); S = JSON.parse(localStorage.getItem(k) || 'null');
      const code = raw ? raw.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 20) : 'local';
      /* berries waiting to arrive (lesson stars, thank-you berries) and berries moved into Fab's Sanctuary, both settled next time Fab Fox World opens */
      const pend = (parseInt(localStorage.getItem('fabworld-pending-' + (raw || 'local')), 10) || 0) - (parseInt(localStorage.getItem('fabworld-spend-' + code), 10) || 0); if(S) S._pend = pend; else S = { _pend:pend }; }catch(e){}
    return S || {};
  }
  function render(){
    const hub = document.getElementById('screen-hub'); if(!hub) return;
    let el = document.getElementById('fwHero');
    if(!el){
      el = document.createElement('div'); el.id = 'fwHero'; el.className = 'fw-hero'; el.setAttribute('role', 'button'); el.tabIndex = 0; el.setAttribute('aria-label', 'Play in Fab Fox World');
      const anchor = hub.querySelector('.ritual-bar') || hub.querySelector('.hub-grid'); anchor.parentNode.insertBefore(el, anchor);
      const go = () => { try{ Sound.tick(); }catch(e){} showScreen('screen-world'); };
      el.addEventListener('click', go); el.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); go(); } });
    }
    const S = stats(), stars = Math.max(0, (S.spk || 0) + (S._pend || 0)), cub = S.cub && S.cub.name, done = S.mis ? Object.keys(S.mis).length : 0;
    el.innerHTML = `<div class="fw-scene" aria-hidden="true">
      <svg class="fw-map" viewBox="0 0 600 260" preserveAspectRatio="none">
        <defs><linearGradient id="fwz" x1="0" x2="1"><stop offset="0" stop-color="#a6db82"/><stop offset=".40" stop-color="#9fd47c"/><stop offset=".45" stop-color="#f2cf80"/><stop offset=".68" stop-color="#efca78"/><stop offset=".74" stop-color="#8eacdf"/><stop offset="1" stop-color="#7f9fd6"/></linearGradient></defs>
        <rect width="600" height="260" fill="url(#fwz)"/>
        <ellipse cx="177" cy="66" rx="34" ry="16" fill="#8fd0f5" stroke="#fff" stroke-width="3"/>
        <polyline points="86,86 86,112 71,152 183,128 183,172 257,112 303,84 337,128 394,112 371,172 371,208 429,112 486,84 529,128 560,140 491,172 491,200 566,188" fill="none" stroke="#e8cf98" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
        <polyline points="86,86 86,112 71,152 183,128 183,172 257,112 303,84 337,128 394,112 371,172 371,208 429,112 486,84 529,128 560,140 491,172 491,200 566,188" fill="none" stroke="#f6e3b6" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M232 128 a26 26 0 0 1 52 0" fill="none" stroke="#e84432" stroke-width="5"/><path d="M237 128 a21 21 0 0 1 42 0" fill="none" stroke="#f3bb17" stroke-width="5"/><path d="M242 128 a16 16 0 0 1 32 0" fill="none" stroke="#5cb85c" stroke-width="5"/><path d="M247 128 a11 11 0 0 1 22 0" fill="none" stroke="#4a8fd6" stroke-width="5"/>
      </svg>
      ${TREES.map(([e, x, y]) => `<span class="fw-tree" style="left:${x}%;top:${y}%">${e}</span>`).join('')}
      ${PL.map(([e, x, y], i) => `<span class="fw-pl" style="left:${x}%;top:${y}%;animation-delay:${-i * .4}s">${e}</span>`).join('')}
      ${FR.map(([c, x, y], i) => `<span class="fab-char ${c} fw-fr" style="left:${x}%;top:${y}%;animation-delay:${-i * .7}s"></span>`).join('')}
      <span class="fw-cub" style="left:12.5%;top:22%">🦊</span><span class="fab-char fab fw-fab"></span>
      <span class="fw-zl" style="left:2%">Fab Meadow</span><span class="fw-zl" style="left:45%">Rainbow Hill</span><span class="fw-zl" style="left:74%">Starlight Woods</span></div>
      <div class="fw-panel"><h2>Fab Fox World</h2><p><b>Hello, friend!</b> ${cub ? `Explore, play and look after ${esc(cub)}.` : 'Explore, play games and find a cub to look after.'} Every game and lesson earns stars here.</p>
      <div class="fw-stats"><span>⭐ ${stars} star${stars === 1 ? '' : 's'}</span><span>📜 ${done} of 17 missions</span>${cub ? `<span>🦊 ${esc(cub)}</span>` : ''}</div>
      <button type="button" class="fw-go" tabindex="-1">▶ Play in Fab Fox World</button></div>`;
  }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
  const show0 = window.showScreen;
  if(typeof show0 === 'function') window.showScreen = function(id){ const r = show0.apply(this, arguments); if(id === 'screen-hub') render(); return r; };
  render();
  window.FabHome = { render };
})();
