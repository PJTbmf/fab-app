/* Light or dark for the Fab App's menu pages: the Hub, Games, Wellbeing and Early Years.
   The Learning Hub stays light, always (Patrick, 26 Nov).
   It is the same setting as the Light/Dark button in Fab Fox World and Fox Blocks (localStorage 'fab-theme'), so a child chooses once.
   Lessons, games and activities stay light: they were designed and checked on the light page.
   Dark keeps the cards light (paper cream with ink outlines) on a deep brown page, so nothing blends in. */
(function(){
  'use strict';
  const KEY = 'fab-theme', MENUS = ['screen-hub', 'screen-games', 'screen-wellbeing', 'screen-eyfs'];
  const now = () => { try{ return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light'; }catch(e){ return 'light'; } };
  const css = `
.theme-btn{ position:absolute; top:6px; right:80px; width:56px; height:56px; border-radius:50%; display:grid; place-items:center; padding:0; cursor:pointer;
  background:#FFF6E6; border:3px solid #2B1A12; box-shadow:none; }
.theme-btn > svg{ width:30px; height:30px; }
.theme-btn[hidden]{ display:none; }
body.in-world .theme-btn, body.in-code .theme-btn{ display:none; }
body.fab-dark{ background-color:#3B2B20 !important; background-blend-mode:multiply !important; }
body.fab-dark .wb2-group{ background:#FFD483; }
body.fab-dark .bunting{ filter:brightness(.92); }
body.fab-dark .page-title, body.fab-dark .brand, body.fab-dark .screen.active .screen-title{ color:#FF9416 !important; text-shadow:none !important; -webkit-text-fill-color:#FF9416; }
body.fab-dark .screen.active > p.hint{ color:#FFF6E6; }
body.fab-dark .brand small, body.fab-dark .screen.active > p, body.fab-dark .screen.active > .sub, body.fab-dark .screen.active > .hint,
body.fab-dark .screen.active > h2, body.fab-dark .screen.active > h3, body.fab-dark .screen.active .section-title, body.fab-dark .screen.active .hub-sub,
body.fab-dark .screen.active > .page-sub, body.fab-dark .screen.active .lead{ color:#FFF6E6; }
body.fab-dark .sound-btn, body.fab-dark .theme-btn{ background:#FFF6E6; border-color:#FFF6E6; }
`;
  function addStyle(){ if(document.getElementById('fabThemeCss')) return; const st = document.createElement('style'); st.id = 'fabThemeCss'; st.textContent = css; document.head.appendChild(st); }
  let btn = null;
  function addButton(){
    if(btn) return; const head = document.querySelector('header'); if(!head) return;
    btn = document.createElement('button'); btn.type = 'button'; btn.className = 'theme-btn'; btn.id = 'themeToggle';
    btn.addEventListener('click', () => { try{ localStorage.setItem(KEY, now() === 'dark' ? 'light' : 'dark'); }catch(e){} paint(); });
    head.appendChild(btn);
  }
  const activeId = () => { const s = document.querySelector('.screen.active'); return s ? s.id : ''; };
  function paint(){
    addStyle(); addButton(); if(!btn) return;
    const menu = MENUS.includes(activeId()), dark = now() === 'dark';
    document.body.classList.toggle('fab-dark', menu && dark);
    btn.hidden = !menu;
    const ico = window.FabIcon ? FabIcon.svg(dark ? 'sun' : 'moon') : (dark ? 'Light' : 'Dark');
    btn.innerHTML = ico;
    btn.title = dark ? 'Dark pages: tap for light' : 'Light pages: tap for dark';
    btn.setAttribute('aria-label', dark ? 'Pages are dark. Switch to light' : 'Pages are light. Switch to dark');
    btn.setAttribute('aria-pressed', String(dark));
  }
  window.fabThemePaint = paint;
  window.addEventListener('storage', e => { if(e.key === KEY) paint(); });
  function watch(){
    paint();
    const main = document.querySelector('main') || document.body;
    new MutationObserver(muts => { if(muts.some(m => m.attributeName === 'class' && m.target.classList && m.target.classList.contains('screen'))) paint(); })
      .observe(main, { subtree:true, attributes:true, attributeFilter:['class'] });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch); else watch();
})();
