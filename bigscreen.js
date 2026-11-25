/* Fab big screens: "a lot of screen but the content quite compact" is wrong anywhere.
   The app's pages were drawn for a laptop (about 1366 x 768). On anything bigger (a monitor, a classroom board) the menu and list pages grow
   as one piece, so every word, button and picture keeps its proportion: the page is laid out at laptop size and shown bigger.
   - Which pages: the landing page, the Games list, the Wellbeing Hub, the EYFS Hub, Hello, Goodbye, the Learning Hub list and "Me".
   - Not Fab Fox World, Fox Blocks, the studio or the Learning Board: they already size themselves from the window.
   - Lessons grow a different way (their text and panels get bigger and the page gets wider), because the Learning Board measures itself.
   A laptop, a tablet and a phone are left exactly as they were.   window.FabBig = { zoom(), pages } */
(function(){
  'use strict';
  const PAGES = ['screen-hub', 'screen-games', 'screen-wellbeing', 'screen-eyfs', 'screen-hello', 'screen-goodbye', 'screen-learn', 'screen-me'];
  const root = document.documentElement;
  let now = 1;
  function set(){
    /* how much bigger than a laptop is this window? Only grow when it is clearly bigger, and never past two and a half times. */
    const k = Math.min(window.innerWidth / 1366, window.innerHeight / 768), z = k >= 1.12 ? Math.min(2.5, k) : 1;
    now = z; root.style.setProperty('--az', z.toFixed(3)); root.classList.toggle('az-on', z > 1);
  }
  const css = document.createElement('style'); css.textContent = `
main:has(> .screen.active.zoomok){max-width:calc(980px * var(--az,1));padding-left:calc(16px * var(--az,1));padding-right:calc(16px * var(--az,1))}
.screen.zoomok{zoom:var(--az,1)}
body:has(main > .screen.active.zoomok) > header{zoom:var(--az,1)}
/* lessons on a big screen: wider panels and bigger words (the Learning Board fits itself to the room it is given) */
html.az-on:has(#screen-lesson.active){font-size:calc(16px * (1 + (var(--az,1) - 1) * .78))}
html.az-on .lp-stage,html.az-on .lp-nav,html.az-on .lp-tips{max-width:min(96vw,calc(820px * var(--az,1)))}
html.az-on body.lp-wide main{max-width:min(98vw,calc(1240px * var(--az,1)))}
html.az-on body.lp-wide .lp-stage,html.az-on body.lp-wide .lp-nav,html.az-on body.lp-wide .lp-tips{max-width:min(96vw,calc(1120px * var(--az,1)))}
html.az-on body.lp-path main{max-width:min(98vw,calc(1560px * var(--az,1)))}
html.az-on body.lp-path .lp-stage,html.az-on body.lp-path .lp-nav,html.az-on body.lp-path .lp-tips{max-width:min(96vw,calc(1500px * var(--az,1)))}
/* the board's row of tools shares its width between eleven buttons, so their labels keep the size they were drawn at */
html.az-on:has(#screen-lesson.active) .bd-tools .bd-tool{font-size:13px!important;line-height:1.15}
html.az-on:has(#screen-lesson.active) .bd-tools .bd-tool i{font-size:26px!important}`;
  document.head.appendChild(css);
  PAGES.forEach(id => { const el = document.getElementById(id); if(el) el.classList.add('zoomok'); });
  set(); window.addEventListener('resize', set);
  window.FabBig = { zoom:() => now, pages:PAGES };
})();
