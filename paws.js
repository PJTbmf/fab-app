/* Paw your favourite games (Patrick, 26 Nov): every tile on the Games page has a paw. Tap it and the game is kept in
   "My pawed games" at the top of the page, ready for next time. Tap the paw again to take it off.
   Saved on this device under the child's Fab code (localStorage 'fab-paws-<code>'), never a name.
   The landing page is left as it is until the navigation review; a pawed-games shortcut there is a suggestion for that review. */
(function(){
  'use strict';
  const INK = '#2B1A12';
  const clean = r => String(r || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 20);
  const who = () => { try{ return clean(typeof fabLearnerCode === 'function' ? fabLearnerCode() : localStorage.getItem('fab-me')) || 'local'; }catch(e){ return 'local'; } };
  const key = () => 'fab-paws-' + who();
  const load = () => { try{ const a = JSON.parse(localStorage.getItem(key()) || '[]'); return Array.isArray(a) ? a.filter(x => typeof x === 'string').slice(0, 40) : []; }catch(e){ return []; } };
  const store = a => { try{ localStorage.setItem(key(), JSON.stringify(a)); }catch(e){} };
  const idOf = t => t.dataset.go || (t.hasAttribute('data-code-open') ? 'fox-blocks' : t.hasAttribute('data-sanct-open') ? 'sanctuary' : ((t.querySelector('h2') || {}).textContent || '').trim());
  const nameOf = t => ((t.querySelector('h2') || {}).textContent || 'this game').trim();
  const paw = on => `<svg viewBox="0 0 48 48" aria-hidden="true"><g stroke="${INK}" stroke-width="3" fill="${on ? '#FE4D02' : '#FFF6E6'}"><ellipse cx="24" cy="31" rx="10" ry="8.5"/><ellipse cx="11.5" cy="20" rx="4.6" ry="5.8" transform="rotate(-20 11.5 20)"/><ellipse cx="19.5" cy="12.5" rx="4.6" ry="6"/><ellipse cx="28.5" cy="12.5" rx="4.6" ry="6"/><ellipse cx="36.5" cy="20" rx="4.6" ry="5.8" transform="rotate(20 36.5 20)"/></g></svg>`;
  const css = `
.paw-wrap{ position:relative; display:flex; }
.paw-wrap > .tile{ flex:1; width:100%; }
.paw-btn{ position:absolute; top:8px; right:8px; width:46px; height:46px; border-radius:50%; background:#FFF6E6; border:3px solid ${INK}; display:grid; place-items:center; padding:0; cursor:pointer; z-index:2; box-shadow:none; }
.paw-btn svg{ width:28px; height:28px; }
.paw-btn[aria-pressed="true"]{ background:#FFD483; }
.paw-btn:hover{ transform:rotate(-8deg); }
.paw-btn:focus-visible, .paw-chip:focus-visible{ outline:3px solid #FE4D02; outline-offset:2px; }
.paw-wrap.pawed > .tile{ border-color:#FE4D02; }
.paw-shelf{ margin:6px 0 16px; background:#FFF6E6; color:${INK}; border:3px solid ${INK}; border-radius:18px 22px 19px 23px / 22px 18px 23px 19px; padding:10px 16px 14px; }
.paw-head{ margin:0 0 8px; font:italic 700 1.25rem Aleo,Georgia,serif; display:flex; align-items:center; gap:.4em; color:${INK}; }
.paw-head svg{ width:1.5em; height:1.5em; }
.paw-row{ display:flex; flex-wrap:wrap; gap:10px; }
.paw-chip{ display:inline-flex; align-items:center; gap:.5em; min-height:50px; padding:6px 16px 8px 10px; background:#fff; border:3px solid ${INK}; border-radius:14px 16px 13px 17px; font:italic 700 1.05rem Aleo,Georgia,serif; color:${INK}; cursor:pointer; box-shadow:none; }
.paw-chip:nth-child(odd){ transform:rotate(-1deg); } .paw-chip:nth-child(even){ transform:rotate(1deg); }
.paw-chip:hover{ border-color:#FE4D02; }
.paw-chip svg{ width:1.7em; height:1.7em; }
.paw-hint{ margin:0; font-size:1rem; line-height:1.4; color:${INK}; }
`;
  let grid = null, shelf = null, tiles = [];
  function setup(){
    const scr = document.getElementById('screen-games'); if(!scr) return;
    grid = scr.querySelector('.hub-grid'); if(!grid || grid.dataset.paws) return; grid.dataset.paws = '1';
    if(!document.getElementById('fabPawCss')){ const st = document.createElement('style'); st.id = 'fabPawCss'; st.textContent = css; document.head.appendChild(st); }
    tiles = [...grid.children].filter(t => t.classList.contains('tile'));
    tiles.forEach(t => {
      const w = document.createElement('div'); w.className = 'paw-wrap'; t.parentNode.insertBefore(w, t); w.appendChild(t);
      const b = document.createElement('button'); b.type = 'button'; b.className = 'paw-btn'; b.dataset.paw = idOf(t);
      b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); toggle(b.dataset.paw); });
      w.appendChild(b);
    });
    shelf = document.createElement('section'); shelf.className = 'paw-shelf'; shelf.id = 'pawShelf'; shelf.setAttribute('aria-label', 'My pawed games');
    grid.parentNode.insertBefore(shelf, grid);
    paint();
    new MutationObserver(() => { if(scr.classList.contains('active')) paint(); }).observe(scr, { attributes:true, attributeFilter:['class'] });
  }
  function toggle(id){
    const a = load(), i = a.indexOf(id), on = i < 0; if(on) a.push(id); else a.splice(i, 1); store(a); paint();
    try{ if(typeof Sound !== 'undefined' && Sound.enabled && typeof Sound.flip === 'function') Sound.flip(); }catch(e){}
    const t = tiles.find(x => idOf(x) === id), b = grid && grid.querySelector(`.paw-btn[data-paw="${CSS.escape(id)}"]`); if(b) b.focus();
    const lv = document.getElementById('pawLive'); if(lv && t) lv.textContent = on ? nameOf(t) + ' is in My pawed games.' : nameOf(t) + ' is no longer pawed.';
  }
  function paint(){
    if(!grid) return; const a = load();
    grid.querySelectorAll('.paw-btn').forEach(b => {
      const t = b.parentNode.querySelector('.tile'), on = a.includes(b.dataset.paw), n = nameOf(t);
      b.innerHTML = paw(on); b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-label', on ? n + ' is pawed. Tap to take the paw off' : 'Paw ' + n + ' to keep it at the top');
      b.title = on ? 'Pawed: tap to take the paw off' : 'Paw it: keep it at the top';
      b.parentNode.classList.toggle('pawed', on);
    });
    const list = a.map(id => tiles.find(t => idOf(t) === id)).filter(Boolean);
    shelf.innerHTML = `<h2 class="paw-head">${paw(true)} My pawed games</h2>` + (list.length ? '<div class="paw-row"></div>' : '<p class="paw-hint">Tap the paw on any game to keep it here, ready for next time.</p>') + '<p class="paw-live" id="pawLive" role="status" aria-live="polite" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);margin:0"></p>';
    const row = shelf.querySelector('.paw-row');
    list.forEach(t => {
      const c = document.createElement('button'); c.type = 'button'; c.className = 'paw-chip';
      if(t.dataset.go) c.dataset.go = t.dataset.go;
      ['data-code-open', 'data-sanct-open'].forEach(k => { if(t.hasAttribute(k)) c.setAttribute(k, t.getAttribute(k)); });
      const em = t.querySelector('.emoji'); c.innerHTML = (em ? em.innerHTML : '') + '<span>' + nameOf(t).replace(/[<>&]/g, '') + '</span>';
      row.appendChild(c);
    });
  }
  window.addEventListener('storage', e => { if(e.key === 'fab-me' || (e.key && e.key.startsWith('fab-paws-'))) paint(); });
  window.fabPaws = { paint, toggle, load };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup); else setup();
})();
