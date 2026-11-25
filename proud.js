/* Fab "proud page": the template for a child's finished piece of work, anywhere in the Learning Hub.
   A page a child can be proud of and print: a coloured band, a big title, the introduction as a lead, each part on its own card with its
   heading on a plaque, pictures kept in proportion beside the words they belong to, a "Did you know?" burst, a finished seal,
   and the charity's own marks: the #bemorefab rainbow and Fab Fox saying he is proud (Fab is the "you do" friend, so he belongs on a child's own work).
   It follows the Fab Fox World style rules: flat warm colour, thick ink outline, a little wonky, italic serif on plaques, no shadows.

   Use:  FabProud.page({
           theme:'rome' | 'egypt' | 'victorian' | 'space' | 'fab',
           kicker:'A report by Explorer AB12',            // small line over the title (Fab code only, never a name)
           title:'All about the Romans', lead:'This report is about…',
           cards:[ { h:'The temple', text:'…', pic:{ src, alt, cap } },   // words, with an optional picture beside them
                   { h:'My mosaic', pic:{ src, alt, cap } },              // a picture on its own card
                   { h:'In order', html:'<ol>…</ol>', wide:true } ],      // anything else (a timeline, a mind map); wide = full width
           fact:{ label:'Did you know?', text:'…' },
           made:'Made in Explorer Worlds', seal:'Finished!', cheer:'I’m proud of you!',   // what Fab says; fab:false leaves him off
           cls:'extra classes for the article' })
   Text is escaped here; html and pic.html are trusted markup from the app itself.   window.FabProud */
(function(){
  'use strict';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  /* a: title colour · b, c, d: plaque colours · band: the four colours of the tile band */
  const THEMES = {
    fab:{ a:'#D9400A', b:'#F0B913', c:'#BFD88E', d:'#CFE7F2', band:['#FE4D02', '#F0B913', '#BFD88E', '#CFE7F2'] },
    rome:{ a:'#B4432F', b:'#E8B64C', c:'#A9C3DC', d:'#E7B4A6', band:['#B4432F', '#E8B64C', '#4F7CA8', '#FFF6E6'] },
    egypt:{ a:'#A0612D', b:'#F0B913', c:'#9AD1C7', d:'#F6D08F', band:['#2A9D8F', '#F0B913', '#A0612D', '#FFF6E6'] },
    victorian:{ a:'#8C2F39', b:'#E8B64C', c:'#BFD88E', d:'#E3C9A0', band:['#8C2F39', '#E8B64C', '#4F7A2E', '#FFF6E6'] },
    space:{ a:'#22335B', b:'#F0B913', c:'#CFE7F2', d:'#F4B58F', band:['#22335B', '#F0B913', '#EF8247', '#CFE7F2'] }
  };
  const css = document.createElement('style'); css.textContent = `
.proud.proud{--ink:#2B1A12;--pad:clamp(16px,3.4vw,40px);position:relative;max-width:1000px;margin:0 auto;background:#FFF6E6;border:4px solid var(--ink);border-radius:22px 30px 24px 32px / 30px 22px 32px 24px;padding:0 var(--pad) 0;color:var(--ink);overflow:hidden;box-shadow:none;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.proud-band{height:22px;margin:0 calc(var(--pad) * -1);border-bottom:4px solid var(--ink);background:repeating-linear-gradient(90deg,var(--b1) 0 24px,var(--b2) 24px 48px,var(--b3) 48px 72px,var(--b4) 72px 96px)}
.proud-band.foot{border-bottom:0;border-top:4px solid var(--ink);margin-top:18px}
.proud-head{text-align:center;padding:18px 0 2px}
.proud-kicker{display:inline-block;background:#fff;border:3px solid var(--ink);border-radius:999px;padding:3px 18px;font:italic 700 clamp(.95rem,1.5vw,1.2rem) Aleo,Georgia,serif;transform:rotate(-1.5deg)}
.proud .proud-title{font-family:var(--disp,'BMF Display',Aleo,Georgia,serif);font-size:clamp(2.1rem,5vw,3.4rem);line-height:1.12;margin:12px 0 6px;color:var(--pa);text-align:center;text-decoration:none}
.proud-title span{box-shadow:inset 0 -.26em 0 var(--pb)}
.proud .proud-lead{font-size:clamp(1.2rem,2vw,1.45rem);line-height:1.5;margin:10px auto 0;max-width:44em;text-align:center}
.proud-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:30px 24px;margin:34px 0 8px}
.proud-sec{position:relative;background:#FFFDF7;border:3px solid var(--ink);border-radius:18px 24px 20px 26px / 24px 18px 26px 20px;padding:28px 18px 16px;min-width:0}
.proud-sec:nth-child(odd){transform:rotate(-.5deg)}.proud-sec:nth-child(even){transform:rotate(.6deg)}
.proud-sec.wide{grid-column:1 / -1;transform:none}
.proud .proud-sec h3{position:absolute;left:14px;top:-19px;margin:0;max-width:calc(100% - 28px);background:var(--pb);border:3px solid var(--ink);border-radius:12px;padding:2px 14px 3px;font:italic 700 clamp(1.05rem,1.7vw,1.3rem)/1.25 Aleo,Georgia,serif;text-decoration:none;transform:rotate(-1.5deg)}
.proud .proud-sec:nth-child(3n+2) h3{background:var(--pc)}.proud .proud-sec:nth-child(3n) h3{background:var(--pd)}
.proud .proud-sec p{font-size:clamp(1.08rem,1.6vw,1.25rem);line-height:1.55;margin:0}
.proud-sec.haspic{display:grid;grid-template-columns:minmax(0,1fr) minmax(110px,36%);gap:16px;align-items:center}
.proud .proud-pic{margin:0;background:#fff;border:3px solid var(--ink);border-radius:10px;padding:8px 8px 5px;transform:rotate(2deg);text-align:center}
.proud .proud-pic img,.proud .proud-pic svg{display:block;width:100%;max-width:none;height:auto;border-radius:4px}
.proud .proud-pic figcaption{font:italic 700 clamp(.9rem,1.3vw,1.05rem) Aleo,Georgia,serif;margin-top:5px}
.proud-sec.piconly{display:grid;place-items:center}.proud-sec.piconly .proud-pic{width:min(100%,280px)}
.proud-sec.wide.piconly .proud-pic{width:min(100%,240px)}
.proud-body{min-width:0}.proud-body svg{max-width:100%;height:auto;display:block;margin:0 auto}
.proud .proud-body ol.mk-strip{grid-template-columns:repeat(auto-fit,minmax(170px,1fr));margin:0}
.proud .proud-fact{display:flex;gap:16px;align-items:center;background:var(--pb);border:4px solid var(--ink);border-radius:26px 18px 28px 20px / 18px 26px 20px 28px;padding:14px 22px;margin:30px auto 4px;max-width:44em;transform:rotate(-.6deg);font-size:clamp(1.1rem,1.7vw,1.3rem);line-height:1.45}
.proud-fact svg{flex:none;width:56px;height:56px}.proud-fact b{display:block;font:italic 700 1.1em Aleo,Georgia,serif}
.proud-foot{display:flex;justify-content:space-between;align-items:flex-end;gap:14px;margin-top:20px}
.proud-brand{display:flex;align-items:center;gap:12px;min-width:0;padding-bottom:6px;text-align:left}.proud-brand img{width:clamp(54px,7vw,84px);height:auto;flex:none}
.proud-brand b{display:block;font-family:var(--disp,'BMF Display',Aleo,Georgia,serif);font-size:clamp(1.15rem,2vw,1.5rem);color:#FE4D02;line-height:1.1}
.proud .proud-made{font-size:.95rem;margin:2px 0 0;opacity:.85;text-align:left}
.proud-cheer{display:flex;align-items:flex-end;gap:10px;flex:none}
.proud-seal{display:flex;flex-direction:column;align-items:center;gap:2px;font:italic 700 clamp(.95rem,1.4vw,1.15rem) Aleo,Georgia,serif;transform:rotate(-4deg);padding-bottom:8px}.proud-seal svg{width:64px;height:64px}
.proud-say{position:relative;align-self:center;background:#fff;border:3px solid var(--ink);border-radius:18px 22px 18px 20px;padding:6px 16px 7px;font:italic 700 clamp(1rem,1.6vw,1.25rem) Aleo,Georgia,serif;transform:rotate(-1.5deg);margin-bottom:34px}
.proud-say::after{content:'';position:absolute;right:-13px;bottom:10px;width:16px;height:16px;background:#fff;border-right:3px solid var(--ink);border-bottom:3px solid var(--ink);transform:rotate(-45deg)}
.proud .proud-fab{width:clamp(74px,9vw,112px);margin:0 0 -4px;filter:none}
@media (max-width:560px){.proud-foot{flex-direction:column;align-items:center}.proud-brand{align-self:flex-start}}
@media (max-width:700px){.proud-grid{grid-template-columns:1fr}.proud-sec.haspic{grid-template-columns:1fr}.proud-sec.haspic .proud-pic{width:min(100%,260px);margin:0 auto}}
@media print{.proud.proud{max-width:none;border-width:3px}body.mk-printing .proud.mk-paper{border:3px solid #2B1A12}.proud-sec,.proud-fact,.proud-pic,.proud-foot{break-inside:avoid}.proud-grid{gap:26px 18px}}`;
  document.head.appendChild(css);

  const STAR = '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 5l7.6 16 17.4 2.2-12.8 12.2 3.3 17.4L32 44.4 16.5 52.8l3.3-17.4L7 23.2 24.4 21z" fill="#FFF6E6" stroke="#2B1A12" stroke-width="3.2" stroke-linejoin="round"/></svg>';
  const SEAL = '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 3l5.2 6.4 7.9-2.5 1.9 8.1 8.1 1.9-2.5 7.9L59 32l-6.4 5.2 2.5 7.9-8.1 1.9-1.9 8.1-7.9-2.5L32 61l-5.2-6.4-7.9 2.5-1.9-8.1-8.1-1.9 2.5-7.9L5 32l6.4-5.2-2.5-7.9 8.1-1.9 1.9-8.1 7.9 2.5z" fill="var(--pa)" stroke="#2B1A12" stroke-width="2.6" stroke-linejoin="round"/><path d="M32 17l4 8.3 9.1 1.2-6.7 6.3 1.7 9-8.1-4.4-8.1 4.4 1.7-9-6.7-6.3 9.1-1.2z" fill="var(--pb)" stroke="#2B1A12" stroke-width="2.2" stroke-linejoin="round"/></svg>';
  /* the charity's rainbow, borrowed from the app's own heading so the page carries the brand without another copy of the picture */
  const rainbow = () => { try{ const im = document.querySelector('img.rainbow-accent'); return im && im.src ? `<img src="${im.src}" alt="">` : ''; }catch(e){ return ''; } };
  const picHTML = p => `<figure class="proud-pic mk-fig">${p.html || `<img src="${p.src}" alt="${esc(p.alt || '')}">`}${p.cap ? `<figcaption>${esc(p.cap)}</figcaption>` : ''}</figure>`;
  function card(c){
    const head = c.h ? `<h3>${esc(c.h)}</h3>` : '';
    if(c.html) return `<section class="proud-sec${c.wide ? ' wide' : ''}">${head}<div class="proud-body">${c.html}</div></section>`;
    if(c.pic && !c.text) return `<section class="proud-sec piconly${c.wide ? ' wide' : ''}">${head}${picHTML(c.pic)}</section>`;
    return `<section class="proud-sec${c.pic ? ' haspic' : ''}${c.wide ? ' wide' : ''}">${head}<p>${esc(c.text || '')}</p>${c.pic ? picHTML(c.pic) : ''}</section>`;
  }
  function page(o){
    o = o || {}; const T = THEMES[o.theme] || THEMES.fab, cards = (o.cards || []).filter(Boolean).map(c => Object.assign({}, c));
    /* an odd number of half-width cards would leave a hole: the last one takes the full width instead */
    const half = cards.filter(c => !c.wide); if(half.length % 2) half[half.length - 1].wide = true;
    const vars = `--pa:${T.a};--pb:${T.b};--pc:${T.c};--pd:${T.d};--b1:${T.band[0]};--b2:${T.band[1]};--b3:${T.band[2]};--b4:${T.band[3]}`;
    return `<article class="proud ${esc(o.cls || '')}" style="${vars}"><div class="proud-band" aria-hidden="true"></div>
      <header class="proud-head">${o.kicker ? `<span class="proud-kicker">${esc(o.kicker)}</span>` : ''}<h2 class="proud-title"><span>${esc(o.title || '')}</span></h2>${o.lead ? `<p class="proud-lead mk-intro">${esc(o.lead)}</p>` : ''}</header>
      ${cards.length ? `<div class="proud-grid">${cards.map(card).join('')}</div>` : ''}
      ${o.fact && o.fact.text ? `<aside class="proud-fact mk-dyk">${STAR}<div><b>${esc(o.fact.label || 'Did you know?')}</b>${esc(o.fact.text)}</div></aside>` : ''}
      <footer class="proud-foot"><div class="proud-brand">${rainbow()}<div><b>#bemorefab</b><p class="proud-made mk-by">${esc(o.made || '')}</p></div></div>
        <div class="proud-cheer"><div class="proud-seal">${SEAL}<span>${esc(o.seal || 'Finished!')}</span></div>${o.fab === false ? '' : `<span class="proud-say">${esc(o.cheer || 'I’m proud of you!')}</span><span class="fab-char fab proud-fab" role="img" aria-label="Fab Fox"></span>`}</div></footer>
      <div class="proud-band foot" aria-hidden="true"></div></article>`;
  }
  window.FabProud = { page, themes:THEMES };
})();
