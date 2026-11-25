/* Fab icons for the app's own pages: hand-drawn pictures in place of emoji on buttons, tabs and cards.
   Style rule: a warm ink outline, flat fills from the palette, a little wonky; every icon keeps its word beside it.
   - FabIcon.svg('map') gives the picture.
   - FabIcon.swap(root) looks at buttons, tiles, titles and the flightpath's own lines under root and, where the words start or end with an emoji
     we have drawn, puts the drawing there instead. Emoji we have not drawn (treasures, feelings) are left as they are.
   The landing page, the hubs and the Learning Hub list are swapped once; lessons are swapped every time they redraw.   window.FabIcon */
(function(){
  'use strict';
  const INK = '#2B1A12', CREAM = '#FFF6E6', GOLD = '#F0B913', ORANGE = '#FE4D02', MID = '#EF8247', GRASS = '#BFD88E', GLASS = '#CFE7F2', WOOD = '#C98A5C', SAND = '#F6D08F';
  const p = (d, f, w) => `<path d="${d}" fill="${f || 'none'}"${w ? ` stroke-width="${w}"` : ''}/>`;
  const c = (x, y, r, f, w) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f || 'none'}"${w ? ` stroke-width="${w}"` : ''}/>`;
  const r = (x, y, w, h, rx, f, t) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${f || 'none'}"${t ? ` transform="${t}"` : ''}/>`;
  const dot = (x, y, s) => `<circle cx="${x}" cy="${y}" r="${s || 2.2}" fill="${INK}" stroke="none"/>`;
  const I = {
    sunflower:[0, 45, 90, 135, 180, 225, 270, 315].map(a => `<ellipse cx="24" cy="9.5" rx="5" ry="7" fill="${GOLD}" transform="rotate(${a} 24 24)"/>`).join('') + c(24, 24, 8.5, WOOD),
    dice:r(9, 9, 30, 30, 7, CREAM, 'rotate(-8 24 24)') + `<g transform="rotate(-8 24 24)">${dot(16.5, 16.5, 2.6)}${dot(31.5, 16.5, 2.6)}${dot(24, 24, 2.6)}${dot(16.5, 31.5, 2.6)}${dot(31.5, 31.5, 2.6)}</g>`,
    rainbow:p('M5 37a19 19 0 0 1 38 0h-7a12 12 0 0 0-24 0z', ORANGE) + p('M12 37a12 12 0 0 1 24 0h-6a6 6 0 0 0-12 0z', GOLD) + p('M18 37a6 6 0 0 1 12 0z', GRASS),
    books:r(7, 27, 34, 11, 2.5, ORANGE) + p('M12 32.5h20', '', 2.4) + r(11, 16, 29, 11, 2.5, GLASS) + p('M16 21.5h16', '', 2.4) + r(9, 6, 27, 10, 2.5, GOLD, 'rotate(-5 22 11)'),
    canvas:r(9, 6, 26, 36, 4, CREAM) + p('M15 16h14M15 23h14M15 30h8', '', 2.6) + p('M30 37l8.5-13 4.5 3-8.5 13-5.5 2z', GOLD),
    cinema:r(6, 19, 36, 22, 4, CREAM) + p('M6 19l33-8.5 1.7 6.6L7.7 25.6z', INK) + p('M14 21.4l3-5.4M23 19l3-5.4M32 16.7l3-5.4', '', 2.6).replace('<path', `<path stroke="${CREAM}"`) + p('M20 26.5l8 4.5-8 4.5z', ORANGE),
    piano:r(5, 11, 38, 27, 4, CREAM) + p('M14.5 11v27M24 11v27M33.5 11v27', '', 2.4) + `<rect x="11.5" y="11" width="6" height="15" rx="1.5" fill="${INK}" stroke="none"/><rect x="21" y="11" width="6" height="15" rx="1.5" fill="${INK}" stroke="none"/><rect x="30.5" y="11" width="6" height="15" rx="1.5" fill="${INK}" stroke="none"/>`,
    compass:c(24, 24, 18, CREAM) + p('M30.5 13.5l-3.6 13.4-9.4 7.6 3.6-13.4z', ORANGE) + dot(24, 24, 2.4),
    map:p('M5 12.5l12.5-5 13 5 12.5-5v28l-12.5 5-13-5-12.5 5z', CREAM) + p('M17.5 7.5v28M30.5 12.5v28', '', 2.4) + p('M10 30c5-6 8 2 12-3s5-8 10-7', '', 2.6).replace('<path', `<path stroke="${ORANGE}" stroke-dasharray="1 5"`) + c(34, 18.5, 3.4, ORANGE, 2.4),
    help:p('M15 43V25.5l-4.6-7.3a2.9 2.9 0 0 1 4.9-3.1l3.2 4.6V8.6a2.8 2.8 0 0 1 5.6 0V6.9a2.8 2.8 0 0 1 5.6 0v2.4a2.8 2.8 0 0 1 5.6 0v4.4a2.7 2.7 0 0 1 5.4 0V29c0 6-3 10-6 14z', SAND) + p('M24.1 8.6v11M29.7 9.3v10.4M35.3 13.7v7', '', 2.4),
    rest:p('M34.5 29.5A15 15 0 0 1 18.5 9 15.5 15.5 0 1 0 39 29a15 15 0 0 1-4.5.5z', GOLD) + p('M28 8h8l-8 8.5h8', '', 2.6),
    down:c(24, 24, 18, CREAM) + p('M24 13v19M15.5 24.5L24 33l8.5-8.5', '', 3.4),
    keys:r(4, 13, 40, 23, 5, CREAM) + dot(11, 20) + dot(17.5, 20) + dot(24, 20) + dot(30.5, 20) + dot(37, 20) + dot(11, 26.5) + dot(37, 26.5) + p('M16.5 29.5h15', '', 3),
    pencil:p('M8 40l3-11L32.5 7.5a3.6 3.6 0 0 1 5 0l3 3a3.6 3.6 0 0 1 0 5L19 37z', GOLD) + p('M8 40l3-11 8 8z', CREAM) + p('M29 11l8 8', '', 2.6),
    page:p('M11 5h18l9 9v29H11z', CREAM) + p('M29 5v9h9', GLASS) + p('M17 22h14M17 29h14M17 36h9', '', 2.6),
    skip:p('M7 11l15 13L7 37z', CREAM) + p('M22 11l15 13-15 13z', CREAM) + p('M41 11v26', '', 3.6),
    target:c(24, 24, 19, CREAM) + c(24, 24, 12.5, ORANGE) + c(24, 24, 6, CREAM),
    star:p('M24 4.5l5.8 12 13.2 1.7-9.7 9.2 2.5 13.1L24 34.2 12.2 40.5l2.5-13.1L5 18.2l13.2-1.7z', GOLD),
    arrow:p('M5 18.5h20v-9L43 24 25 38.5v-9H5z', CREAM),
    back:p('M43 18.5H23v-9L5 24l18 14.5v-9h20z', CREAM),
    tick:p('M8 25l10 10L40 12', '', 4.4),
    wave:p('M15 43V25.5l-4.6-7.3a2.9 2.9 0 0 1 4.9-3.1l3.2 4.6V8.6a2.8 2.8 0 0 1 5.6 0V6.9a2.8 2.8 0 0 1 5.6 0v2.4a2.8 2.8 0 0 1 5.6 0v4.4a2.7 2.7 0 0 1 5.4 0V29c0 6-3 10-6 14z', SAND) + p('M4 9c2-3 4-4 7-4M3 15c1-1 2-2 4-2', '', 2.4),
    highlighter:p('M9 39l4-10L31 11l6 6-18 18z', ORANGE) + p('M31 11l4-4 6 6-4 4', GOLD) + p('M9 39l4-10 6 6z', CREAM),
    rubber:`<g transform="rotate(-35 24 24)">${r(7, 16, 34, 16, 4, MID)}${r(7, 16, 13, 16, 4, CREAM)}</g>`,
    text:r(6, 8, 36, 32, 6, CREAM) + p('M15 33l9-19 9 19M18.5 26.5h11', '', 3.2),
    picture:r(6, 9, 36, 30, 4, CREAM) + c(17, 19, 3.6, GOLD, 2.4) + p('M8 36l10-10 7 6 6-8 9 12z', GRASS),
    bin:p('M12 14h24l-2 26H14z', CREAM) + p('M8 14h32M19 14V8h10v6M20 21v13M28 21v13', '', 2.8),
    slides:r(6, 8, 36, 24, 3, CREAM) + p('M20 14.5l9 5.5-9 5.5z', ORANGE) + p('M24 32v6M16 42l8-4 8 4', '', 2.8),
    toolbox:r(6, 18, 36, 22, 4, ORANGE) + p('M17 18v-4a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v4', '', 3) + p('M6 27h36', '', 2.6) + r(21, 24, 6, 6, 1.5, GOLD),
    sound:p('M7 19h7l10-8v26l-10-8H7z', CREAM) + p('M30 18c3 3 3 9 0 12M35 13c6 6 6 16 0 22', '', 2.8),
    fox:p('M8 7l8.5 8.5h15L40 7v15.5L24 42 8 22.5z', MID) + p('M17 25.5l7 9.5 7-9.5', CREAM, 2.4) + dot(18, 20.5) + dot(30, 20.5)
  };
  /* which emoji each drawing stands in for (the selector sign that sometimes follows an emoji is ignored) */
  const MAP = { '🌻':'sunflower', '🎲':'dice', '🌈':'rainbow', '📚':'books', '📋':'canvas', '🎬':'cinema', '🎹':'piano', '🧭':'compass', '🗺':'map', '🙋':'help', '✋':'help', '👋':'wave', '😴':'rest',
    '⬇':'down', '⌨':'keys', '✏':'pencil', '📄':'page', '📃':'page', '⏭':'skip', '🎯':'target', '⭐':'star', '➡':'arrow', '🦊':'fox',
    '🖍':'highlighter', '🧽':'rubber', '🔤':'text', '🖼':'picture', '🗑':'bin', '📽':'slides', '🧰':'toolbox', '🔊':'sound' };
  const svg = (k, cls) => I[k] ? `<svg class="fi${cls ? ' ' + cls : ''}" viewBox="0 0 48 48" aria-hidden="true"><g fill="none" stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">${I[k]}</g></svg>` : '';
  const EMO = '(\\p{Extended_Pictographic})\\uFE0F?', HEAD = new RegExp('^(\\s*)' + EMO + '(\\s*)', 'u'), TAIL = new RegExp('(\\s*)' + EMO + '(\\s*)$', 'u');
  const WHERE = 'button, button i, .emoji, .screen-title, .lt-card i, .bd-tool i, summary, .pw-mission, .pw-streak span, .pw-sparkles, .pw-phase-tag';
  /* the drawing goes in on its own (no wrapper), so it takes its size from the words it sits with */
  function node(k){ const t = document.createElement('template'); t.innerHTML = svg(k); return t.content.firstChild; }
  function swapText(t){
    let v = t.nodeValue, m = HEAD.exec(v);
    if(m && MAP[m[2]]){ const rest = v.slice(m[0].length); t.parentNode.insertBefore(node(MAP[m[2]]), t); t.nodeValue = (rest && m[3] !== '' ? ' ' : '') + rest; v = t.nodeValue; }
    m = TAIL.exec(v);
    if(m && MAP[m[2]] && v.trim() !== ''){ const keep = v.slice(0, m.index); t.nodeValue = keep + (keep ? ' ' : ''); t.parentNode.insertBefore(node(MAP[m[2]]), t.nextSibling); }
  }
  function swap(root){
    root = root || document; let list;
    try{ list = root.querySelectorAll(WHERE); }catch(e){ return; }
    list.forEach(el => { if(el.closest('.game-frame, [data-noicon]')) return; [...el.childNodes].forEach(n => { if(n.nodeType === 3 && /\p{Extended_Pictographic}/u.test(n.nodeValue)) swapText(n); }); });
  }
  const css = document.createElement('style'); css.textContent = `
.fi{width:1.3em;height:1.3em;display:inline-block;vertical-align:-.3em;overflow:visible;flex:none}
.emoji > .fi,.lt-card i > .fi,.bd-tool i > .fi{width:1.2em;height:1.2em;vertical-align:middle}
.pw-mission > .fi{margin-right:.3em}
.pw-streak span .fi{width:1.5em;height:1.5em}.pw-streak span:not(.on) .fi{opacity:.28}
.screen-title .fi{width:1.15em;height:1.15em;vertical-align:-.22em}`;
  document.head.appendChild(css);
  /* the pages that are written once */
  const once = () => ['screen-hub', 'screen-games', 'screen-wellbeing', 'screen-eyfs', 'screen-learn'].forEach(id => { const el = document.getElementById(id); if(el) swap(el); });
  /* the pages that redraw themselves: swap again after each redraw */
  function watch(id){ const el = document.getElementById(id); if(!el || !window.MutationObserver) return; let due = 0; new MutationObserver(() => { if(due) return; due = requestAnimationFrame(() => { due = 0; swap(el); }); }).observe(el, { childList:true, subtree:true }); }
  const start = () => { once(); ['screen-lesson', 'screen-learn', 'screen-board'].forEach(id => { const el = document.getElementById(id); if(el) swap(el); watch(id); }); };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  window.FabIcon = { svg, swap, names:Object.keys(I) };
})();
