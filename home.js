/* The landing page: Fab Fox World is the place children arrive. A big, living window into the world sits at the top of
   the home screen, with the child's stars, cub and missions, and one big button to step in. */
(function(){
  'use strict';
  const css = `
  .fw-hero{position:relative;display:grid;grid-template-columns:minmax(0,1.55fr) minmax(250px,1fr);max-width:1000px;margin:8px auto 18px;border:3px solid var(--ink,#2B1A12);border-radius:30px;overflow:hidden;box-shadow:0 8px 0 rgba(43,26,18,.18),0 14px 30px rgba(43,26,18,.18);background:#FFF6E6;cursor:pointer;text-align:left}
  .fw-hero:focus-visible{outline:5px solid #2B1A12;outline-offset:4px}
  .fw-scene{position:relative;min-height:250px;background:linear-gradient(#8fd3ff,#d8f0ff 62%);overflow:hidden}
  .fw-scene svg{position:absolute;left:0;bottom:0;width:100%;height:72%}
  .fw-sun{position:absolute;right:9%;top:10%;width:52px;height:52px;border-radius:50%;background:#ffd65a;box-shadow:0 0 0 10px rgba(255,214,90,.25)}
  .fw-cloud{position:absolute;top:14%;width:90px;height:28px;border-radius:30px;background:#fff;opacity:.9;animation:fwdrift 38s linear infinite}
  .fw-cloud::before{content:"";position:absolute;left:18px;top:-14px;width:40px;height:34px;border-radius:50%;background:#fff}
  .fw-cloud.c2{top:28%;width:70px;animation-duration:52s;animation-delay:-20s}
  @keyframes fwdrift{from{left:-120px}to{left:110%}}
  .fw-pl{position:absolute;display:grid;place-items:center;width:46px;height:46px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#fff,#fff6e6);border:3px solid #fff;box-shadow:0 4px 8px rgba(43,26,18,.25);font-size:1.5rem;animation:fwbob 3.2s ease-in-out infinite}
  @keyframes fwbob{50%{transform:translateY(-6px)}}
  .fw-fab{position:absolute;left:40%;bottom:6%;width:92px;animation:fwwalk 9s ease-in-out infinite}
  .fw-fab.fab-char{margin:0}
  @keyframes fwwalk{0%,100%{transform:translateX(-30px) scaleX(1)}45%{transform:translateX(60px) scaleX(1)}50%{transform:translateX(60px) scaleX(-1)}95%{transform:translateX(-30px) scaleX(-1)}}
  .fw-cub{position:absolute;left:31%;bottom:7%;font-size:2rem;animation:fwbob 1.6s ease-in-out infinite}
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
  @media (prefers-reduced-motion:reduce){.fw-cloud,.fw-pl,.fw-fab,.fw-cub{animation:none}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const PL = [['🏡',8,52],['🎵',22,30],['🤸',36,48],['🌈',55,22],['🪚',66,46],['📚',82,30],['⛵',90,58]];
  function stats(){
    let S = null;
    try{ const raw = (typeof fabLearnerCode === 'function' && fabLearnerCode()) || ''; const k = 'fabworld-v2-' + (raw ? raw.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 20) : 'local'); S = JSON.parse(localStorage.getItem(k) || 'null');
      const pend = parseInt(localStorage.getItem('fabworld-pending-' + (raw || 'local')), 10) || 0; if(S) S._pend = pend; else S = { _pend:pend }; }catch(e){}
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
    const S = stats(), stars = (S.spk || 0) + (S._pend || 0), cub = S.cub && S.cub.name, done = S.mis ? Object.keys(S.mis).length : 0;
    el.innerHTML = `<div class="fw-scene" aria-hidden="true"><span class="fw-sun"></span><span class="fw-cloud" style="left:10%"></span><span class="fw-cloud c2"></span>
      <svg viewBox="0 0 600 180" preserveAspectRatio="none"><path d="M0 70 Q120 20 240 60 T480 50 T600 60 V180 H0Z" fill="#a8d48e"/><path d="M0 110 Q150 70 300 100 T600 95 V180 H0Z" fill="#9fd47c"/><path d="M330 110 Q450 80 600 100 V180 H330Z" fill="#efca78" opacity=".85"/><path d="M500 120 Q560 100 600 108 V180 H500Z" fill="#7f9fd6" opacity=".9"/><path d="M40 180 C160 120 300 150 420 120 S560 110 600 118" stroke="#ecd49c" stroke-width="16" fill="none" stroke-linecap="round"/></svg>
      ${PL.map(([e, x, y], i) => `<span class="fw-pl" style="left:${x}%;top:${y}%;animation-delay:${-i * .4}s">${e}</span>`).join('')}
      ${cub ? '<span class="fw-cub">🦊</span>' : ''}<span class="fab-char fab fw-fab"></span></div>
      <div class="fw-panel"><h2>Fab Fox World</h2><p><b>Hello, friend!</b> ${cub ? `Explore, play and look after ${esc(cub)}.` : 'Explore, play games and find a cub to look after.'} Every game and lesson earns stars here.</p>
      <div class="fw-stats"><span>⭐ ${stars} star${stars === 1 ? '' : 's'}</span><span>📜 ${done} of 13 missions</span>${cub ? `<span>🦊 ${esc(cub)}</span>` : ''}</div>
      <button type="button" class="fw-go" tabindex="-1">▶ Play in Fab Fox World</button></div>`;
  }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
  const show0 = window.showScreen;
  if(typeof show0 === 'function') window.showScreen = function(id){ const r = show0.apply(this, arguments); if(id === 'screen-hub') render(); return r; };
  render();
  window.FabHome = { render };
})();
