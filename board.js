/* ============ 📋 Learning Board ============
   An exercise book on screen: pages (plain, lined, squared, dotted), pen, highlighter, rubber, text, stickers, pictures
   (drop, paste or choose a JPG/PNG) and PDF booklets (each page becomes a page you can write on). Opened from the Learning
   Hub (My workbook) or from a lesson (one board per lesson, a page per step, with "Write or draw it" prompts and booklet pages).
   Everything is kept on this device, by pupil code, in the browser's own storage. Nothing is sent anywhere. */
(function(){
  'use strict';
  const PAGE_W = 1600, PAGE_H = 1000, MAX_IMG = 1600, BOOK_W = 1240, MAX_PDF_PAGES = 40;
  const COLS = ['#2b2f3a', '#FE4D02', '#2f6fed', '#4F7A2E', '#f3bb17', '#9b6bd1', '#ef915e', '#ffffff'];
  const COLN = ['Black', 'Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'White'];
  const STICKERS = ['⭐', '✅', '👍', '❤️', '🌈', '🦊', '🎉', '💡', '❓', '🏅'];
  const PAPERS = [{ k:'plain', n:'Plain' }, { k:'lines', n:'Lines' }, { k:'squares', n:'Squares' }, { k:'dots', n:'Dots' }];
  const TEXT_FONT = "'Comic Neue','Comic Sans MS','Chalkboard SE','Aleo',Georgia,serif";
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  /* ---------- storage: IndexedDB, with a memory fallback ---------- */
  const mem = { boards:{}, imgs:{} };
  let dbp = null;
  function db(){
    if(dbp) return dbp;
    dbp = new Promise(res => {
      try{
        const r = indexedDB.open('fab-board', 1);
        r.onupgradeneeded = () => { r.result.createObjectStore('boards'); r.result.createObjectStore('imgs'); };
        r.onsuccess = () => res(r.result); r.onerror = () => res(null); r.onblocked = () => res(null);
      }catch(e){ res(null); }
    });
    return dbp;
  }
  async function dget(store, key){
    const d = await db(); if(!d) return mem[store][key];
    return new Promise(res => { try{ const q = d.transaction(store).objectStore(store).get(key); q.onsuccess = () => res(q.result); q.onerror = () => res(mem[store][key]); }catch(e){ res(mem[store][key]); } });
  }
  async function dput(store, key, val){
    mem[store][key] = val;
    const d = await db(); if(!d) return;
    return new Promise(res => { try{ const t = d.transaction(store, 'readwrite'); t.objectStore(store).put(val, key); t.oncomplete = () => res(); t.onerror = () => res(); }catch(e){ res(); } });
  }

  /* ---------- state ---------- */
  const B = { fit:'width', doc:null, key:'', page:0, tool:'pen', col:COLS[0], size:1, sticker:'⭐', undo:[], redo:[], sel:null, drag:null, scale:1,
              imgs:new Map(), saveTimer:null, el:null, cv:null, g:null, stroke:null, editing:null, ready:false, ctx:{}, status:'', visHTML:'', home:null, src:new Map(), live:{ sharing:false, rev:0, got:0, pending:null, lastPageId:null } };
  const who = () => { try{ return (typeof fabLearnerCode === 'function' && fabLearnerCode()) || 'device'; }catch(e){ return 'device'; } };
  const page = () => B.doc && B.doc.pages[B.page];
  function newPage(o){ return Object.assign({ id:uid(), w:PAGE_W, h:PAGE_H, bg:'lines', items:[] }, o || {}); }

  /* ---------- open a board ---------- */
  async function openBoard(opts){
    opts = opts || {};
    build();
    const id = opts.id || 'workbook';
    const key = who() + '::' + id;
    if(B.doc && B.key){ commitText(); saveNow(); }
    let doc = B.doc && B.key === key ? B.doc : await dget('boards', key);
    B.key = key;
    if(!doc || !Array.isArray(doc.pages) || !doc.pages.length) doc = { id, title:opts.title || 'My workbook', pages:[newPage()], cur:0 };
    if(opts.title) doc.title = opts.title;
    B.doc = doc; B.undo = []; B.redo = []; B.sel = null;
    B.page = Math.min(doc.cur || 0, doc.pages.length - 1);
    B.ctx = { back:opts.back || null, dock:!!opts.dock && !opts.inlay, inlay:!!opts.inlay, slides:typeof opts.slides === 'function' ? opts.slides : null,
              views:typeof opts.views === 'function' ? opts.views : null };
    if(opts.step){                                       // a page for this step, with its prompt
      let i = doc.pages.findIndex(p => p.step === opts.step.key);
      if(i < 0){ doc.pages.push(newPage({ step:opts.step.key, title:opts.step.title, prompt:opts.step.prompt, bg:opts.step.bg || 'lines' })); i = doc.pages.length - 1; }
      B.page = i;
    }
    if(opts.visPage){                                    // the step's picture, as the first page, ready to draw on
      let v = doc.pages.findIndex(p => p.bg === 'vis');
      if(v < 0){ doc.pages.unshift(newPage({ bg:'vis', key:'vis', title:'', prompt:'' })); v = 0; if(opts.step) B.page += 1; }
      if(opts.freshVis) doc.pages[v].items = [];         // a new step: last step's notes on the picture are cleared
      if(opts.go === 'vis') B.page = v;
    }
    if(opts.booklet){ const at = await addBooklet(opts.booklet); if(at >= 0) B.page = at; }
    showBoard();
    if(B.live.pending){ const sh = B.live.pending; B.live.pending = null; B.live.got = 0; fromShared(sh); }
    else if(!liveHost() && B.live.last){ B.live.got = 0; fromShared(B.live.last); }
    paintAll(); scheduleSave();
  }
  function showBoard(){
    const back = B.el.querySelector('#bdBack'), sl = B.el.querySelector('#bdSlides');
    if(sl) sl.hidden = !B.ctx.slides || B.ctx.inlay;
    B.el.classList.toggle('inlay', B.ctx.inlay);
    placeViews();
    if(B.ctx.inlay){
      // In the middle of the lesson: teaching on the left, the board in the centre, steps on the right.
      undock(); B.el.classList.remove('active');
      back.innerHTML = '⛶ <span class="bd-lbl-b">Big board</span>'; back.setAttribute('aria-label', 'Make the board fill the screen');
    } else if(B.ctx.dock){
      // Beside the lesson: the teaching stays on one side, the board on the other.
      document.body.classList.add('bd-dock'); B.el.classList.add('docked');
      back.innerHTML = '✕ <span class="bd-lbl-b">Close board</span>'; back.setAttribute('aria-label', 'Close the board');
    } else {
      undock(); unmount();
      back.innerHTML = '← <span class="bd-lbl-b">Back</span>'; back.removeAttribute('aria-label');
      if(typeof showScreen === 'function') showScreen('screen-board');
    }
    requestAnimationFrame(() => { layout(); setTimeout(layout, 250); });
  }
  /* In the lesson, the view tabs join the top row, so the controls take two slim rows across the top. */
  function placeViews(){
    if(!B.el) return;
    const v = B.el.querySelector('#bdViews'), top = B.el.querySelector('.bd-top'), main = B.el.querySelector('.bd-main');
    const compact = B.ctx.inlay && !B.el.classList.contains('big');
    if(compact && v.parentNode !== top) top.insertBefore(v, top.querySelector('.bd-pages'));
    if(!compact && v.parentNode === top) B.el.insertBefore(v, main);
    B.el.classList.toggle('compact', compact);
    if(!compact) setPal(false);
  }
  function setPal(on){ if(!B.el) return; B.el.classList.toggle('pal-open', !!on); const b = B.el.querySelector('#bdPal'); if(b) b.setAttribute('aria-expanded', on ? 'true' : 'false'); }
  function undock(){
    document.body.classList.remove('bd-dock'); if(B.el) B.el.classList.remove('docked');
  }
  /* The board can live inside the lesson (its centre column). mount() puts it there; unmount() sends it home. */
  function mount(host){
    build(); if(!B.el || !host) return;
    if(B.el.parentNode !== host) host.appendChild(B.el);
    B.el.classList.add('inlay'); B.el.classList.remove('active');
    fitHost(host);
    requestAnimationFrame(() => { fitHost(host); layout(); });
  }
  /* The centre column reaches from where it starts to the bottom of the screen, so the whole board is in view
     without scrolling. On short screens it keeps a sensible size and stays in view as the page scrolls. */
  function fitHost(host){
    host = host || (B.el && B.el.parentNode); if(!host || !host.classList || !host.classList.contains('pw-centre')) return;
    const top = host.getBoundingClientRect().top + (window.scrollY || 0), vh = window.innerHeight || 800;
    const room = vh - top - 12, min = Math.min(520, vh - 16);
    host.style.height = Math.round(room >= min ? Math.min(room, 980) : Math.min(vh - 16, 980)) + 'px';
  }
  function unmount(){
    if(!B.el) return;
    setBig(false);
    B.el.classList.remove('inlay');
    const h = B.home; if(h && h.parent && B.el.parentNode !== h.parent){ if(h.next && h.next.parentNode === h.parent) h.parent.insertBefore(B.el, h.next); else h.parent.appendChild(B.el); }
  }
  const inlaid = () => !!(B.el && B.el.classList.contains('inlay') && B.el.isConnected);
  function setBig(on){
    if(!B.el) return;
    B.el.classList.toggle('big', !!on); document.body.classList.toggle('bd-big', !!on); placeViews();
    const back = B.el.querySelector('#bdBack');
    if(back && B.ctx.inlay) back.innerHTML = on ? '↙ <span class="bd-lbl-b">Back to the lesson</span>' : '⛶ <span class="bd-lbl-b">Big board</span>';
    requestAnimationFrame(() => { layout(); setTimeout(layout, 200); });
  }
  /* The step's picture (drawn by vis.js) sits under the page, so the teacher can draw on it. */
  function setVis(html){
    B.visHTML = html || '';
    const v = B.el && B.el.querySelector('#bdVis'); if(!v) return;
    if(!v.dataset.live) v.innerHTML = B.visHTML ? `<div class="pw-vis">${B.visHTML}</div>` : '';
    layout();
  }
  /* Ready-made pages that belong together (a step's slides): any old copy is replaced, and the first one opens. */
  function setDeck(tag, list){
    if(!B.doc || !Array.isArray(list) || !list.length) return;
    commitText();
    const old = B.doc.pages.findIndex(p => p.deck === tag);
    B.doc.pages = B.doc.pages.filter(p => p.deck !== tag);
    let at = old >= 0 ? old : Math.min(B.page + 1, B.doc.pages.length);
    at = Math.max(0, Math.min(at, B.doc.pages.length));
    B.doc.pages.splice(at, 0, ...list.map((pg, i) => newPage(Object.assign({}, pg, { deck:tag, slide:i + 1, slides:list.length }))));
    goPage(at); scheduleSave();
  }
  function goWhere(test){ if(!B.doc) return false; const i = B.doc.pages.findIndex(test); if(i < 0) return false; goPage(i); return true; }
  /* Put ready-made items (a model, a template) on a new page after this one. */
  function addModelPage(pg){ if(!B.doc || !pg) return; commitText(); B.doc.pages.splice(B.page + 1, 0, newPage(pg)); goPage(B.page + 1); scheduleSave(); }
  /* Add ready-made pages (slides) after this one. A slide with a key that is already in the board is opened, not added again. */
  function addPages(list){
    if(!B.doc || !Array.isArray(list) || !list.length) return;
    commitText();
    let first = -1, at = B.page;
    list.forEach(pg => {
      const have = pg.key ? B.doc.pages.findIndex(x => x.key === pg.key) : -1;
      if(have >= 0){ if(first < 0) first = have; return; }
      at += 1; B.doc.pages.splice(at, 0, newPage(pg)); if(first < 0) first = at;
    });
    if(first >= 0) goPage(first);
    scheduleSave();
  }

  /* ---------- the screen ---------- */
  function build(){
    if(B.el) return;
    const el = document.getElementById('screen-board'); if(!el) return;
    B.el = el; B.home = { parent:el.parentNode, next:el.nextSibling };
    const tool = (k, ic, n) => `<button type="button" class="bd-tool" data-tool="${k}" aria-pressed="false"><i aria-hidden="true">${ic}</i><span>${n}</span></button>`;
    el.innerHTML = `<div class="bd-top">
        <button type="button" class="bd-btn" id="bdBack">← <span class="bd-lbl-b">Back</span></button>
        <h1 class="bd-title" id="bdTitle">My workbook</h1>
        <div class="bd-pages" role="group" aria-label="Pages">
          <button type="button" class="bd-btn soft" id="bdPrev" aria-label="Previous page">◀</button>
          <span id="bdPageN" aria-live="polite">Page 1 of 1</span>
          <button type="button" class="bd-btn soft" id="bdNext" aria-label="Next page">▶</button>
          <button type="button" class="bd-btn soft" id="bdAdd" aria-label="New page">＋<span class="bd-lbl"> New page</span></button>
          <button type="button" class="bd-btn soft" id="bdFit" aria-pressed="false" aria-label="Whole page" hidden>🔍<span class="bd-lbl"> Whole page</span></button>
        </div>
        <div class="bd-extra">
          <button type="button" class="bd-btn soft" id="bdLive" aria-pressed="false" hidden>📡<span class="bd-lbl"> Show everyone</span></button>
          <button type="button" class="bd-btn soft" id="bdLink" data-cvlaunch aria-label="Show a link">🎬<span class="bd-lbl"> Show a link</span></button>
          <button type="button" class="bd-btn soft" id="bdSave" aria-label="Save picture">💾<span class="bd-lbl"> Save picture</span></button>
        </div>
      </div>
      <div class="bd-views" id="bdViews" role="group" aria-label="What the board shows" hidden></div>
      <div class="bd-main">
        <div class="bd-tools" role="toolbar" aria-label="Board tools">
          ${tool('move', '✋', 'Move')}${tool('pen', '✏️', 'Pen')}${tool('hl', '🖍️', 'Highlight')}${tool('rub', '🧽', 'Rubber')}
          ${tool('text', '🔤', 'Text')}${tool('stick', '⭐', 'Stickers')}
          <button type="button" class="bd-tool" id="bdPic"><i aria-hidden="true">🖼️</i><span>Picture</span></button>
          <button type="button" class="bd-tool" id="bdBook"><i aria-hidden="true">📄</i><span>Booklet</span></button>
          <button type="button" class="bd-tool" id="bdSlides" hidden><i aria-hidden="true">📽️</i><span>Slides</span></button>
          <button type="button" class="bd-tool" id="bdPaper"><i aria-hidden="true">📃</i><span>Paper</span></button>
          <button type="button" class="bd-tool" id="bdUndo"><i aria-hidden="true">↶</i><span>Undo</span></button>
          <button type="button" class="bd-tool" id="bdClear"><i aria-hidden="true">🗑️</i><span>Clear page</span></button>
          <button type="button" class="bd-tool bd-palbtn" id="bdPal" aria-expanded="false" aria-controls="bdOpts" hidden><i aria-hidden="true"><b class="bd-swatch"></b></i><span>Colour</span></button>
        </div>
        <div class="bd-desk" id="bdDesk">
          <div class="bd-opts" id="bdOpts" role="group" aria-label="Choices for this tool"></div>
          <div class="bd-stage" id="bdStage">
          <div class="bd-prompt" id="bdPrompt" hidden></div>
          <div class="bd-sheet" id="bdSheet">
            <div class="bd-vis" id="bdVis" hidden></div>
            <canvas id="bdCanvas" aria-label="Board page. Draw, write or add pictures." role="img"></canvas>
            <textarea class="bd-edit" id="bdEdit" hidden aria-label="Type your words"></textarea>
            <div class="bd-selbar" id="bdSelBar" hidden><button type="button" class="bd-btn soft" id="bdSelBig">＋ Bigger</button><button type="button" class="bd-btn soft" id="bdSelSmall">− Smaller</button><button type="button" class="bd-btn flame" id="bdSelDel">🗑️ Remove</button></div>
          </div>
          </div>
          <p class="bd-drop" id="bdDrop" hidden>Drop your picture or PDF here</p>
        </div>
      </div>
      <p class="bd-status" id="bdStatus" aria-live="polite"></p>
      <input type="file" id="bdFilePic" accept="image/png,image/jpeg,image/webp,image/gif" multiple hidden>
      <input type="file" id="bdFileBook" accept="application/pdf,image/png,image/jpeg" hidden>`;
    B.cv = el.querySelector('#bdCanvas'); B.g = B.cv.getContext('2d');
    const $b = s => el.querySelector(s);
    $b('#bdBack').addEventListener('click', () => { commitText(); saveNow(); if(B.ctx.inlay){ setBig(!B.el.classList.contains('big')); return; } if(B.ctx.dock){ undock(); try{ learnRender(); }catch(e){} return; } const back = B.ctx.back || 'screen-learn'; if(typeof showScreen === 'function') showScreen(back); if(back === 'screen-lesson'){ try{ learnRender(); }catch(e){} } else if(back === 'screen-learn'){ try{ learnRenderList(); }catch(e){} } });
    $b('#bdPrev').addEventListener('click', () => goPage(B.page - 1));
    $b('#bdNext').addEventListener('click', () => goPage(B.page + 1));
    $b('#bdAdd').addEventListener('click', () => { commitText(); B.doc.pages.splice(B.page + 1, 0, newPage({ bg:page() && page().bg !== 'img' ? page().bg : 'lines' })); goPage(B.page + 1); scheduleSave(); });
    $b('#bdSave').addEventListener('click', exportPNG);
    $b('#bdLive').addEventListener('click', () => setSharing(!B.live.sharing));
    $b('#bdPal').addEventListener('click', () => setPal(!B.el.classList.contains('pal-open')));
    document.addEventListener('pointerdown', e => { if(B.el && B.el.classList.contains('pal-open') && !e.target.closest('#bdOpts, #bdPal')) setPal(false); }, true);
    $b('#bdFit').addEventListener('click', () => { commitText(); B.fit = B.fit === 'page' ? 'width' : 'page'; layout(); });
    el.querySelectorAll('[data-tool]').forEach(b => b.addEventListener('click', () => setTool(b.dataset.tool)));
    $b('#bdPic').addEventListener('click', () => $b('#bdFilePic').click());
    $b('#bdBook').addEventListener('click', () => $b('#bdFileBook').click());
    $b('#bdFilePic').addEventListener('change', e => { [...e.target.files].forEach(f => addPicture(f)); e.target.value = ''; });
    $b('#bdFileBook').addEventListener('change', async e => { const f = e.target.files[0]; e.target.value = ''; if(!f) return; if(/pdf/.test(f.type) || /\.pdf$/i.test(f.name)){ const at = await addBooklet({ file:f, title:f.name.replace(/\.pdf$/i, '') }); if(at >= 0) goPage(at); } else addPicture(f, true); });
    $b('#bdPaper').addEventListener('click', () => setTool('paper'));
    $b('#bdSlides').addEventListener('click', () => setTool('slides'));
    $b('#bdUndo').addEventListener('click', undo);
    $b('#bdClear').addEventListener('click', () => { const p = page(); if(!p || !p.items.length) return; const keep = p.items.filter(i => i.lock), mine = p.items.length - keep.length;
      if(!window.confirm(mine && keep.length ? 'Clear the writing on this page? The template stays. You can press Undo to get it back.' : 'Clear everything on this page? You can press Undo to get it back.')) return;
      snap(); p.items = mine ? keep : []; B.sel = null; paint(); scheduleSave(); });
    $b('#bdSelDel').addEventListener('click', () => { if(!B.sel) return; snap(); page().items = page().items.filter(i => i !== B.sel); B.sel = null; paint(); scheduleSave(); });
    $b('#bdSelBig').addEventListener('click', () => resizeSel(1.2));
    $b('#bdSelSmall').addEventListener('click', () => resizeSel(1 / 1.2));
    const ed = $b('#bdEdit');
    ed.addEventListener('blur', () => commitText());
    ed.addEventListener('input', () => { if(B.editing){ B.editing.txt = ed.value; autoSizeEditor(); } });
    ed.addEventListener('keydown', e => { if(e.key === 'Escape'){ e.preventDefault(); ed.blur(); } });
    B.cv.addEventListener('pointerdown', down);
    B.cv.addEventListener('pointermove', move);
    B.cv.addEventListener('pointerup', up);
    B.cv.addEventListener('pointercancel', up);
    const desk = $b('#bdDesk');
    desk.addEventListener('dragover', e => { if(!isBoardOn()) return; e.preventDefault(); $b('#bdDrop').hidden = false; });
    desk.addEventListener('dragleave', e => { if(e.target === desk) $b('#bdDrop').hidden = true; });
    desk.addEventListener('drop', async e => {
      e.preventDefault(); $b('#bdDrop').hidden = true;
      for(const f of [...(e.dataTransfer.files || [])]){
        if(/pdf/.test(f.type) || /\.pdf$/i.test(f.name)){ const at = await addBooklet({ file:f, title:f.name.replace(/\.pdf$/i, '') }); if(at >= 0) goPage(at); }
        else if(/^image\//.test(f.type)) addPicture(f);
      }
    });
    document.addEventListener('paste', e => {
      if(!isBoardOn() || B.editing) return;
      const items = [...((e.clipboardData && e.clipboardData.items) || [])].filter(i => /^image\//.test(i.type));
      if(items.length){ e.preventDefault(); items.forEach(i => addPicture(i.getAsFile())); }
    });
    document.addEventListener('keydown', e => {
      if(!isBoardOn() || B.editing || /input|textarea/i.test((e.target.tagName || ''))) return;
      if((e.key === 'Delete' || e.key === 'Backspace') && B.sel){ e.preventDefault(); $b('#bdSelDel').click(); }
      if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z'){ e.preventDefault(); undo(); }
      if(e.key === 'Escape' && B.el.classList.contains('big')){ e.preventDefault(); setBig(false); }
    });
    window.addEventListener('resize', () => { if(isBoardOn()){ fitHost(); layout(); } });
    setTool('pen');
  }
  const isBoardOn = () => { const s = B.el; return !!(s && s.isConnected && s.getClientRects().length && (s.classList.contains('active') || s.classList.contains('docked') || s.classList.contains('inlay'))); };
  function status(t){ const s = B.el && B.el.querySelector('#bdStatus'); if(s) s.textContent = t || ''; }

  function setTool(t){
    commitText();
    B.tool = t; if(t !== 'move'){ B.sel = null; }
    B.el.querySelectorAll('[data-tool]').forEach(b => { const on = b.dataset.tool === t; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    B.el.querySelector('#bdPaper').classList.toggle('on', t === 'paper');
    B.el.querySelector('#bdSlides').classList.toggle('on', t === 'slides');
    B.cv.style.cursor = t === 'move' ? 'grab' : t === 'text' ? 'text' : 'crosshair';
    paintOpts(); layout();
  }
  function paintOpts(){
    const o = B.el.querySelector('#bdOpts'), t = B.tool;
    const og = (lbl, inner) => `<div class="bd-og" role="group" aria-label="${lbl}"><span class="bd-optlbl" aria-hidden="true">${lbl}</span>${inner}</div>`;
    let h = '', hint = '';
    if(t === 'pen' || t === 'hl' || t === 'text'){
      h += og('Colour', `<div class="bd-cols">${COLS.map((c, i) => `<button type="button" class="bd-col ${B.col === c ? 'on' : ''}" data-col="${c}" style="background:${c}" aria-label="${COLN[i]}" aria-pressed="${B.col === c}"></button>`).join('')}</div>`);
      h += og('Size', `<div class="bd-sizes">${[0, 1, 2].map(s => `<button type="button" class="bd-size ${B.size === s ? 'on' : ''}" data-size="${s}" aria-label="${['Small', 'Medium', 'Big'][s]}" aria-pressed="${B.size === s}"><b style="width:${[8, 14, 22][s]}px;height:${[8, 14, 22][s]}px"></b></button>`).join('')}</div>`);
    }
    if(t === 'stick') h += og('Sticker', `<div class="bd-sticks">${STICKERS.map(s => `<button type="button" class="bd-stick ${B.sticker === s ? 'on' : ''}" data-stick="${s}" aria-pressed="${B.sticker === s}">${s}</button>`).join('')}</div>`);
    if(t === 'paper'){ const p = page(); h += og('Paper', `<div class="bd-papers">${PAPERS.map(pp => `<button type="button" class="bd-paperbtn ${p && p.bg === pp.k ? 'on' : ''}" data-paper="${pp.k}" aria-pressed="${p && p.bg === pp.k}">${pp.n}</button>`).join('')}</div>`); if(p && p.bg === 'img') hint = 'This page is a booklet page.'; }
    if(t === 'slides' && B.ctx.slides){
      let list = []; try{ list = B.ctx.slides() || []; }catch(e){ list = []; }
      B.slideList = list;
      h += og('Slides for this step', `<div class="bd-slides">${list.map((sl, i) => `<button type="button" class="bd-slidebtn" data-slide="${i}">${sl.icon ? `<i aria-hidden="true">${sl.icon}</i>` : ''}<span>${esc(sl.name)}</span></button>`).join('')}</div>`);
      hint = list.length ? 'Each slide becomes a page to write on.' : 'Pick a step in the lesson to get its slides.';
    }
    if(t === 'move') hint = 'Tap a picture, words or a sticker to move it. Drag the corner to make it bigger.';
    if(t === 'rub') hint = 'Rub over a line or sticker to take it away.';
    if(t === 'text') hint = 'Tap the page where you want to write.';
    // On short screens the hint shows for a moment at the bottom instead of taking space from the page.
    const compact = B.el.classList.contains('compact');
    const short = compact || (!B.ctx.inlay && window.matchMedia && matchMedia('(max-height:560px)').matches);
    const pal = B.el.querySelector('#bdPal'); if(pal){ const has = t === 'pen' || t === 'hl' || t === 'text' || t === 'stick' || t === 'paper' || t === 'slides'; pal.hidden = !compact || !has;
      pal.querySelector('span').textContent = t === 'stick' ? 'Sticker' : t === 'paper' ? 'Paper type' : t === 'slides' ? 'Slides' : 'Colour';
      const sw = pal.querySelector('.bd-swatch'); sw.textContent = t === 'stick' ? B.sticker : ''; sw.style.background = t === 'stick' || t === 'paper' ? 'transparent' : B.col; sw.classList.toggle('em', t === 'stick' || t === 'paper'); if(t === 'paper') sw.textContent = '📃'; }   // in the lesson the choices strip keeps one height, so the page never jumps
    if(hint && !short) h += `<p class="bd-hint">${hint}</p>`;
    if(hint && short && B.lastHint !== t + hint){ status(hint); const mine = hint; clearTimeout(B.hintTimer); B.hintTimer = setTimeout(() => { const st = B.el.querySelector('#bdStatus'); if(st && st.textContent === mine) status(''); }, 4500); }
    B.lastHint = t + hint;
    o.innerHTML = h;
    o.querySelectorAll('[data-col]').forEach(b => b.onclick = () => { B.col = b.dataset.col; if(B.editing){ B.editing.c = B.col; styleEditor(); } paintOpts(); });
    o.querySelectorAll('[data-size]').forEach(b => b.onclick = () => { B.size = +b.dataset.size; paintOpts(); setPal(false); });
    o.querySelectorAll('[data-stick]').forEach(b => b.onclick = () => { B.sticker = b.dataset.stick; paintOpts(); setPal(false); });
    o.querySelectorAll('[data-slide]').forEach(b => b.onclick = () => { const sl = (B.slideList || [])[+b.dataset.slide]; if(!sl) return; let pg = null; try{ pg = sl.make(); }catch(e){} if(pg) addPages([pg]); setTool('pen'); });
    o.querySelectorAll('[data-paper]').forEach(b => b.onclick = () => { const p = page(); if(!p) return; snap(); p.bg = b.dataset.paper; delete p.bgImg; paint(); paintOpts(); scheduleSave(); });
  }

  /* ---------- what the board shows (lesson views: picture, slides, my page, tools, booklet) ---------- */
  function paintViews(){
    const bar = B.el && B.el.querySelector('#bdViews'); if(!bar) return;
    let list = []; if(B.ctx.views){ try{ list = B.ctx.views() || []; }catch(e){ list = []; } }
    bar.hidden = !list.length;
    const sig = list.map(v => v.k + (v.on ? '1' : '0')).join('|') + '#' + B.page;
    if(bar.dataset.sig === sig) return; bar.dataset.sig = sig;
    B.viewList = list;
    bar.innerHTML = list.map((v, i) => `<button type="button" class="bd-view ${v.on ? 'on' : ''}" data-view="${i}" aria-pressed="${v.on ? 'true' : 'false'}"><i aria-hidden="true">${v.icon}</i><span>${esc(v.name)}</span></button>`).join('');
    bar.querySelectorAll('[data-view]').forEach(b => b.onclick = () => { const v = (B.viewList || [])[+b.dataset.view]; if(v && v.go){ try{ v.go(); }catch(e){} } bar.dataset.sig = ''; paintViews(); });
  }
  /* Fab Fox World characters on a page (the dual-coding cast), drawn from the app's own character art. */
  const CHAR = {};
  function charImg(k){
    if(CHAR[k]) return CHAR[k];
    const im = new Image(); CHAR[k] = im;
    try{
      const t = document.createElement('span'); t.className = 'fab-char ' + k; t.style.position = 'absolute'; t.style.left = '-9999px'; document.body.appendChild(t);
      const m = /url\((['"]?)(.*?)\1\)/.exec(getComputedStyle(t).backgroundImage || ''); t.remove();
      if(m){ im.onload = () => paint(); im.src = m[2]; }
    }catch(e){}
    return im;
  }

  /* ---------- layout and painting ---------- */
  function layout(){
    const p = page(); if(!p || !B.el) return;
    const desk = B.el.querySelector('#bdDesk'), stage = B.el.querySelector('#bdStage'), prompt = B.el.querySelector('#bdPrompt'), opts = B.el.querySelector('#bdOpts');
    prompt.hidden = !(p.title || p.prompt);
    prompt.innerHTML = p.title || p.prompt ? `${p.title ? `<b>${esc(p.title)}</b>` : ''}${p.prompt ? ` ${esc(p.prompt)}` : ''}` : '';
    const tall = p.h > p.w * 1.05, fit = B.el.querySelector('#bdFit');
    fit.hidden = !tall; fit.setAttribute('aria-pressed', B.fit === 'page' ? 'true' : 'false'); { const fl = B.fit === 'page' ? 'Bigger' : 'Whole page'; fit.innerHTML = `🔍<span class="bd-lbl"> ${fl}</span>`; fit.setAttribute('aria-label', fl); }
    // The tool choices sit above the page or beside it: whichever leaves the page bigger.
    const scaleFor = side => {
      desk.classList.toggle('opts-side', side);
      const cs = getComputedStyle(stage), padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight), padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      const dw = stage.clientWidth - padX, dh = stage.clientHeight - (prompt.hidden ? 0 : prompt.offsetHeight + (parseFloat(getComputedStyle(prompt).marginBottom) || 0)) - padY;
      const fitW = dw / p.w, fitH = dh / p.h;
      return Math.max(0.2, tall && B.fit !== 'page' ? Math.min(fitW, 1.2) : Math.min(fitW, fitH));
    };
    const hasOpts = opts.childElementCount > 0 && !B.el.classList.contains('compact');
    let scale = scaleFor(false);
    if(hasOpts && !tall && !(B.ctx.inlay && !B.el.classList.contains('big'))){ const sideScale = scaleFor(true); if(sideScale > scale * 1.04) scale = sideScale; else scaleFor(false); }
    B.scale = scale;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    B.cv.style.width = Math.round(p.w * B.scale) + 'px'; B.cv.style.height = Math.round(p.h * B.scale) + 'px';
    B.cv.width = Math.round(p.w * B.scale * dpr); B.cv.height = Math.round(p.h * B.scale * dpr);
    B.dpr = dpr;
    const vis = B.el.querySelector('#bdVis');
    if(vis){ const on = p.bg === 'vis'; vis.hidden = !on; B.el.querySelector('#bdSheet').classList.toggle('on-vis', on);
      if(on){ vis.style.width = B.cv.style.width; vis.style.height = B.cv.style.height; if(p.key === 'live'){ vis.innerHTML = p.visHTML ? `<div class="pw-vis">${p.visHTML}</div>` : ''; vis.dataset.live = '1'; } else if(vis.dataset.live){ vis.dataset.live = ''; vis.innerHTML = B.visHTML ? `<div class="pw-vis">${B.visHTML}</div>` : ''; }
        if(!B.visHTML && p.key !== 'live') vis.innerHTML = '<p class="bd-novis">This step has no picture. Use ✏️ My page or 📽️ Slides.</p>';
        // the picture is laid out at a fixed size (half the page) and scaled, so it always fits and lines up with drawing on top
        const pv = vis.querySelector('.pw-vis'); if(pv){ pv.style.width = (p.w / 2) + 'px'; pv.style.height = (p.h / 2) + 'px'; pv.style.transform = `scale(${B.scale * 2})`; } } }
    paintViews();
    paint();
  }
  function paintAll(){
    const p = page(); if(!p) return;
    B.el.querySelector('#bdTitle').textContent = B.doc.title || 'My workbook';
    { const pg = page(); const c = B.el.classList.contains('compact'); B.el.querySelector('#bdPageN').textContent = pg && pg.slide ? (c ? `Slide ${pg.slide}/${pg.slides}` : `Slide ${pg.slide} of ${pg.slides} · page ${B.page + 1} of ${B.doc.pages.length}`) : (c ? `${B.page + 1} / ${B.doc.pages.length}` : `Page ${B.page + 1} of ${B.doc.pages.length}`);
      B.el.querySelector('#bdPageN').setAttribute('aria-label', `Page ${B.page + 1} of ${B.doc.pages.length}`); }
    B.el.querySelector('#bdPrev').disabled = B.page <= 0;
    B.el.querySelector('#bdNext').disabled = B.page >= B.doc.pages.length - 1;
    try{ B.el.querySelector('#bdLink').hidden = !(window.CoView && CoView.canShare()); }catch(e){}
    B.el.querySelector('#bdLive').hidden = !liveHost();
    paintOpts(); layout();
  }
  function goPage(i){
    commitText();
    if(!B.doc) return;
    B.page = Math.max(0, Math.min(B.doc.pages.length - 1, i)); B.doc.cur = B.page; B.sel = null; B.undo = []; B.redo = [];
    paintAll(); scheduleSave();
  }
  function paper(g, p){
    if(p.bg === 'vis'){ g.clearRect(0, 0, p.w, p.h); return; }
    g.fillStyle = '#fffdf6'; g.fillRect(0, 0, p.w, p.h);
    if(p.bg === 'img'){ const im = B.imgs.get(p.bgImg); if(im && im.complete) g.drawImage(im, 0, 0, p.w, p.h); else loadImg(p.bgImg); return; }
    g.save();
    if(p.bg === 'lines'){ g.strokeStyle = 'rgba(70,130,200,.28)'; g.lineWidth = 2; for(let y = 120; y < p.h; y += 64){ g.beginPath(); g.moveTo(0, y); g.lineTo(p.w, y); g.stroke(); } g.strokeStyle = 'rgba(254,77,2,.45)'; g.beginPath(); g.moveTo(110, 0); g.lineTo(110, p.h); g.stroke(); }
    else if(p.bg === 'squares'){ g.strokeStyle = 'rgba(70,130,200,.22)'; g.lineWidth = 1.5; for(let x = 0; x <= p.w; x += 50){ g.beginPath(); g.moveTo(x, 0); g.lineTo(x, p.h); g.stroke(); } for(let y = 0; y <= p.h; y += 50){ g.beginPath(); g.moveTo(0, y); g.lineTo(p.w, y); g.stroke(); } }
    else if(p.bg === 'dots'){ g.fillStyle = 'rgba(70,90,120,.35)'; for(let x = 50; x < p.w; x += 50) for(let y = 50; y < p.h; y += 50){ g.beginPath(); g.arc(x, y, 2.6, 0, 7); g.fill(); } }
    g.restore();
  }
  const WIDTHS = { pen:[4, 8, 16], hl:[22, 36, 56] }, TEXT_SIZES = [30, 44, 64], STICK_SIZES = [56, 84, 120];
  function drawItem(g, it){
    if(it.t === 's'){
      const p = it.p; if(p.length < 2) return;
      g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = it.c; g.lineWidth = it.w;
      if(it.m === 'hl'){ g.globalAlpha = .35; g.globalCompositeOperation = 'multiply'; }
      g.beginPath(); g.moveTo(p[0], p[1]);
      if(p.length === 2) g.lineTo(p[0] + .1, p[1] + .1);
      for(let i = 2; i < p.length - 2; i += 2){ const mx = (p[i] + p[i + 2]) / 2, my = (p[i + 1] + p[i + 3]) / 2; g.quadraticCurveTo(p[i], p[i + 1], mx, my); }
      if(p.length > 2) g.lineTo(p[p.length - 2], p[p.length - 1]);
      g.stroke(); g.restore();
    } else if(it.t === 'i'){
      const im = B.imgs.get(it.id);
      g.save(); g.shadowColor = 'rgba(43,26,18,.22)'; g.shadowBlur = 14; g.shadowOffsetY = 4;
      if(im && im.complete){ g.fillStyle = '#fff'; g.fillRect(it.x - 6, it.y - 6, it.w + 12, it.h + 12); g.shadowColor = 'transparent'; g.drawImage(im, it.x, it.y, it.w, it.h); }
      else { g.fillStyle = '#f3ead6'; g.fillRect(it.x, it.y, it.w, it.h); loadImg(it.id); }
      g.restore();
      g.save(); g.fillStyle = 'rgba(243,187,23,.55)'; g.translate(it.x + it.w / 2, it.y - 4); g.rotate(-.04); g.fillRect(-46, -12, 92, 26); g.restore();   // a strip of tape
    } else if(it.t === 'x'){
      g.save(); g.fillStyle = it.c; g.font = `${it.s}px ${TEXT_FONT}`; g.textBaseline = 'top';
      String(it.txt || '').split('\n').forEach((ln, i) => g.fillText(ln, it.x, it.y + i * it.s * 1.25));
      g.restore();
    } else if(it.t === 'c'){
      const im = charImg(it.k); if(im && im.complete && im.naturalWidth){ g.drawImage(im, it.x, it.y, it.w, it.w * im.naturalHeight / im.naturalWidth); }
    } else if(it.t === 'r'){
      g.save(); if(it.f){ g.fillStyle = it.f; g.fillRect(it.x, it.y, it.w, it.h); } g.strokeStyle = it.c || '#2b2f3a'; g.lineWidth = it.lw || 5; g.strokeRect(it.x, it.y, it.w, it.h); g.restore();
    } else if(it.t === 'k'){
      g.save(); g.font = `${it.s}px serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(it.e, it.x, it.y); g.restore();
    }
  }
  function bounds(it){
    if(it.t === 'i' || it.t === 'r') return { x:it.x, y:it.y, w:it.w, h:it.h };
    if(it.t === 'c'){ const im = charImg(it.k), r = im && im.naturalWidth ? im.naturalHeight / im.naturalWidth : 1.41; return { x:it.x, y:it.y, w:it.w, h:it.w * r }; }
    if(it.t === 'k') return { x:it.x - it.s / 2, y:it.y - it.s / 2, w:it.s, h:it.s };
    if(it.t === 'x'){ const g = B.g; g.save(); g.font = `${it.s}px ${TEXT_FONT}`; const lines = String(it.txt || ' ').split('\n'); const w = Math.max(40, ...lines.map(l => g.measureText(l).width)); g.restore(); return { x:it.x, y:it.y, w, h:lines.length * it.s * 1.25 }; }
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for(let i = 0; i < it.p.length; i += 2){ x0 = Math.min(x0, it.p[i]); x1 = Math.max(x1, it.p[i]); y0 = Math.min(y0, it.p[i + 1]); y1 = Math.max(y1, it.p[i + 1]); }
    return { x:x0, y:y0, w:x1 - x0, h:y1 - y0 };
  }
  function paint(){
    const p = page(); if(!p || !B.g) return;
    const g = B.g; g.setTransform(B.scale * B.dpr, 0, 0, B.scale * B.dpr, 0, 0);
    paper(g, p);
    p.items.forEach(it => { if(it !== B.editing) drawItem(g, it); });
    if(B.stroke) drawItem(g, B.stroke);
    const bar = B.el.querySelector('#bdSelBar');
    if(B.sel && B.tool === 'move'){
      const b = bounds(B.sel);
      g.save(); g.strokeStyle = '#2f6fed'; g.lineWidth = 3 / B.scale; g.setLineDash([10 / B.scale, 8 / B.scale]); g.strokeRect(b.x - 8, b.y - 8, b.w + 16, b.h + 16); g.setLineDash([]);
      g.fillStyle = '#2f6fed'; g.beginPath(); g.arc(b.x + b.w + 8, b.y + b.h + 8, 16 / B.scale, 0, 7); g.fill(); g.restore();
      bar.hidden = false;
      bar.style.left = Math.max(0, (b.x) * B.scale) + 'px'; bar.style.top = Math.max(0, (b.y - 8) * B.scale - 58) + 'px';
    } else bar.hidden = true;
  }
  function loadImg(id){
    if(!id || B.imgs.has(id)) return;
    const im = new Image(); B.imgs.set(id, im);
    dget('imgs', id).then(src => { if(src){ B.src.set(id, src); im.onload = () => paint(); im.src = src; } });
  }

  /* ---------- pointer ---------- */
  function pt(e){ const r = B.cv.getBoundingClientRect(); return { x:(e.clientX - r.left) / B.scale, y:(e.clientY - r.top) / B.scale }; }
  function hit(x, y){
    const items = page().items;
    for(let i = items.length - 1; i >= 0; i--){ const it = items[i]; if(it.t === 's' || it.lock) continue; const b = bounds(it); if(x >= b.x - 10 && x <= b.x + b.w + 10 && y >= b.y - 10 && y <= b.y + b.h + 10) return it; }
    return null;
  }
  function down(e){
    const p = page(); if(!p) return;
    if(p.key === 'live'){ status('This is your teacher’s board. Tap ✏️ My page to write on your own page.'); return; }
    const q = pt(e);
    if(B.editing){ commitText(); if(B.tool === 'text') return; }
    try{ B.cv.setPointerCapture(e.pointerId); }catch(err){}
    if(B.tool === 'pen' || B.tool === 'hl'){
      B.stroke = { t:'s', m:B.tool, c:B.tool === 'hl' && B.col === COLS[0] ? '#f3bb17' : B.col, w:WIDTHS[B.tool][B.size], p:[q.x, q.y] };
      paint();
    } else if(B.tool === 'rub'){ snap(); B.drag = { rub:true, removed:0 }; rubAt(q); }
    else if(B.tool === 'text'){
      e.preventDefault(); // keep focus on the words box we are about to open (and let iPads show the keyboard)
      const it = hit(q.x, q.y);
      if(it && it.t === 'x') editText(it); else { snap(); const n = { t:'x', x:q.x, y:q.y - 20, s:TEXT_SIZES[B.size], c:B.col, txt:'' }; p.items.push(n); editText(n, true); }
    } else if(B.tool === 'stick'){ snap(); p.items.push({ t:'k', e:B.sticker, x:q.x, y:q.y, s:STICK_SIZES[B.size] }); paint(); scheduleSave(); try{ Sound && Sound.ding && Sound.ding(); }catch(err){} }
    else if(B.tool === 'move'){
      if(B.sel){ const b = bounds(B.sel); if(Math.hypot(q.x - (b.x + b.w + 8), q.y - (b.y + b.h + 8)) < 30 / B.scale){ snap(); B.drag = { resize:true, b0:b, it0:JSON.parse(JSON.stringify(B.sel)), q0:q }; return; } }
      const it = hit(q.x, q.y); B.sel = it;
      if(it){ snap(); B.drag = { q0:q, it0:JSON.parse(JSON.stringify(it)), moved:false }; B.cv.style.cursor = 'grabbing'; }
      paint();
    }
  }
  function move(e){
    if(B.stroke){ const q = pt(e), pp = B.stroke.p; if(Math.hypot(q.x - pp[pp.length - 2], q.y - pp[pp.length - 1]) > 1.5){ pp.push(Math.round(q.x * 10) / 10, Math.round(q.y * 10) / 10); paint(); } return; }
    if(!B.drag) return;
    const q = pt(e);
    if(B.drag.rub){ rubAt(q); return; }
    const it = B.sel; if(!it) return;
    const d0 = B.drag.it0, dx = q.x - B.drag.q0.x, dy = q.y - B.drag.q0.y;
    if(B.drag.resize){
      const b0 = B.drag.b0, k = Math.max(.15, (b0.w + dx) / Math.max(1, b0.w));
      if(it.t === 'i' || it.t === 'r'){ it.w = Math.max(40, d0.w * k); it.h = it.w * d0.h / d0.w; }
      else if(it.t === 'c') it.w = Math.max(40, d0.w * k);
      else if(it.t === 'x') it.s = Math.max(16, Math.min(220, d0.s * k));
      else if(it.t === 'k') it.s = Math.max(24, Math.min(400, d0.s * k));
    } else { it.x = d0.x + dx; it.y = d0.y + dy; B.drag.moved = true; }
    paint();
  }
  function up(){
    if(B.stroke){ const p = page(); snap(); p.items.push(B.stroke); B.stroke = null; paint(); scheduleSave(); return; }
    if(B.drag){ if(B.drag.rub && !B.drag.removed) B.undo.pop(); B.drag = null; B.cv.style.cursor = B.tool === 'move' ? 'grab' : B.cv.style.cursor; scheduleSave(); paint(); }
  }
  function rubAt(q){
    const p = page(), r = 18 / Math.max(.4, B.scale) + 10;
    const before = p.items.length;
    p.items = p.items.filter(it => {
      if(it.lock) return true;                       // a ready-made template stays put; only the child's marks rub out
      if(it.t === 'k') return Math.hypot(it.x - q.x, it.y - q.y) > it.s / 2;
      if(it.t !== 's') return true;
      for(let i = 0; i < it.p.length; i += 2) if(Math.hypot(it.p[i] - q.x, it.p[i + 1] - q.y) < r + it.w / 2) return false;
      return true;
    });
    if(p.items.length !== before){ B.drag.removed += before - p.items.length; paint(); }
  }
  function resizeSel(k){
    const it = B.sel; if(!it) return; snap();
    if(it.t === 'i' || it.t === 'r'){ it.w *= k; it.h *= k; } else if(it.t === 'c') it.w *= k; else if(it.t === 'x') it.s = Math.max(16, Math.min(220, it.s * k)); else if(it.t === 'k') it.s = Math.max(24, Math.min(400, it.s * k));
    paint(); scheduleSave();
  }

  /* ---------- text ---------- */
  function editText(it, fresh){
    B.editing = it; B.editFresh = !!fresh;
    const ed = B.el.querySelector('#bdEdit');
    ed.value = it.txt || ''; ed.hidden = false; styleEditor(); paint();
    const place = () => { try{ ed.focus({ preventScroll:true }); ed.setSelectionRange(ed.value.length, ed.value.length); }catch(e){} };
    place(); setTimeout(() => { if(document.activeElement !== ed && B.editing === it) place(); }, 30);
  }
  function styleEditor(){
    const it = B.editing, ed = B.el.querySelector('#bdEdit'); if(!it) return;
    ed.style.left = (it.x * B.scale) + 'px'; ed.style.top = (it.y * B.scale) + 'px';
    ed.style.fontSize = (it.s * B.scale) + 'px'; ed.style.lineHeight = '1.25'; ed.style.color = it.c; ed.style.fontFamily = TEXT_FONT;
    autoSizeEditor();
  }
  function autoSizeEditor(){
    const ed = B.el.querySelector('#bdEdit'), it = B.editing; if(!it) return;
    const lines = ed.value.split('\n'), longest = Math.max(4, ...lines.map(l => l.length));
    const maxW = (page().w - it.x) * B.scale - 10;
    ed.style.width = Math.min(maxW, Math.max(180, longest * it.s * B.scale * .6 + 30)) + 'px';
    ed.style.height = Math.max(it.s * B.scale * 1.4, lines.length * it.s * B.scale * 1.25 + 14) + 'px';
  }
  function commitText(){
    const it = B.editing; if(!it) return;
    const ed = B.el.querySelector('#bdEdit');
    it.txt = ed.value.replace(/\s+$/, '');
    B.editing = null; ed.hidden = true;
    if(!it.txt){ page().items = page().items.filter(i => i !== it); if(B.editFresh) B.undo.pop(); }
    paint(); scheduleSave();
  }

  /* ---------- undo ---------- */
  function snap(){ const p = page(); if(!p) return; B.undo.push(JSON.stringify(p.items)); if(B.undo.length > 40) B.undo.shift(); }
  function undo(){
    commitText();
    const p = page(); if(!p || !B.undo.length){ status('Nothing to undo.'); return; }
    p.items = JSON.parse(B.undo.pop()); B.sel = null; paint(); scheduleSave(); status('');
  }

  /* ---------- pictures ---------- */
  function fileToImage(file){
    return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = r.result; }; r.onerror = rej; r.readAsDataURL(file); });
  }
  function shrink(im, max, type){
    const k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight));
    const c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k);
    const g = c.getContext('2d'); if(type !== 'image/png'){ g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); }
    g.drawImage(im, 0, 0, c.width, c.height);
    return { src:c.toDataURL(type === 'image/png' ? 'image/png' : 'image/jpeg', .86), w:c.width, h:c.height };
  }
  async function addPicture(file, asPage){
    if(!file || !/^image\//.test(file.type)){ status('That file isn\'t a picture. Try a JPG or PNG.'); return; }
    if(file.size > 25e6){ status('That picture is very big. Try a smaller one.'); return; }
    try{
      status('Adding your picture…');
      const im = await fileToImage(file), small = shrink(im, MAX_IMG, file.type === 'image/png' && file.size < 1.5e6 ? 'image/png' : 'image/jpeg');
      const id = 'img-' + uid(); await dput('imgs', id, small.src); B.src.set(id, small.src);
      const el = new Image(); el.onload = () => paint(); el.src = small.src; B.imgs.set(id, el);
      if(asPage){
        const w = BOOK_W, h = Math.round(BOOK_W * small.h / small.w);
        B.doc.pages.splice(B.page + 1, 0, newPage({ w, h, bg:'img', bgImg:id, title:file.name || 'Picture' })); goPage(B.page + 1);
      } else {
        const p = page(); snap();
        const w = Math.min(p.w * .55, small.w), h = w * small.h / small.w;
        const n = { t:'i', id, x:(p.w - w) / 2 + (Math.random() * 60 - 30), y:Math.max(30, (Math.min(p.h, 1000) - h) / 2), w, h };
        p.items.push(n); B.sel = n; setTool('move');
      }
      paint(); scheduleSave(); status('Picture added. Use ✋ Move to place it.');
    }catch(e){ status('Sorry, that picture could not be opened.'); }
  }

  /* ---------- PDF booklets: each page becomes a page to write on ---------- */
  let pdfjsP = null;
  function pdfjs(){
    if(pdfjsP) return pdfjsP;
    pdfjsP = new Promise((res, rej) => {
      if(window.pdfjsLib){ res(window.pdfjsLib); return; }
      const s = document.createElement('script'); s.src = 'lib/pdf.min.js';
      s.onload = () => { try{ window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'lib/pdf.worker.min.js'; res(window.pdfjsLib); }catch(e){ rej(e); } };
      s.onerror = () => { pdfjsP = null; rej(new Error('pdf.js did not load')); };
      document.head.appendChild(s);
    });
    return pdfjsP;
  }
  /* bk: { file:File } or { url:'booklets/x.pdf' }, optional pages:[1,3], title. Returns the index of the first new page. */
  async function addBooklet(bk){
    try{
      const tag = bk.url || (bk.file && (bk.file.name + ':' + bk.file.size)) || '';
      const want = Array.isArray(bk.pages) && bk.pages.length ? bk.pages : null;
      if(bk.url && want){                                // already on this board? go straight to it
        const at = B.doc.pages.findIndex(p => p.src === bk.url && p.srcPage === want[0]);
        if(at >= 0) return at;
      }
      status('Opening the booklet…');
      const lib = await pdfjs();
      const data = bk.file ? new Uint8Array(await bk.file.arrayBuffer()) : null;
      const pdf = await lib.getDocument(data ? { data } : { url:bk.url }).promise;
      const nums = (want || Array.from({ length:pdf.numPages }, (_, i) => i + 1)).filter(n => n >= 1 && n <= pdf.numPages).slice(0, MAX_PDF_PAGES);
      const first = B.page + 1, added = [];
      for(const n of nums){
        status(`Opening the booklet… page ${added.length + 1} of ${nums.length}`);
        const pg = await pdf.getPage(n), vp0 = pg.getViewport({ scale:1 }), vp = pg.getViewport({ scale:BOOK_W / vp0.width });
        const c = document.createElement('canvas'); c.width = Math.round(vp.width); c.height = Math.round(vp.height);
        const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
        await pg.render({ canvasContext:g, viewport:vp }).promise;
        const id = 'img-' + uid(), src = c.toDataURL('image/jpeg', .85);
        await dput('imgs', id, src); B.src.set(id, src);
        const im = new Image(); im.src = src; B.imgs.set(id, im);
        added.push(newPage({ w:c.width, h:c.height, bg:'img', bgImg:id, title:`${bk.title || 'Booklet'} · page ${n}`, src:bk.url || tag, srcPage:n }));
      }
      if(!added.length){ status('That booklet has no pages I can open.'); return -1; }
      B.doc.pages.splice(first, 0, ...added);
      scheduleSave(); status(`Added ${added.length} booklet page${added.length > 1 ? 's' : ''}. Write on them with the pen or text.`);
      return first;
    }catch(e){ status('Sorry, that booklet could not be opened. Is it a PDF?'); return -1; }
  }

  /* ---------- saving ---------- */
  function scheduleSave(){ clearTimeout(B.saveTimer); B.saveTimer = setTimeout(saveNow, 600); livePush(); }
  function saveNow(){ clearTimeout(B.saveTimer); if(!B.doc || !B.key) return;
    const doc = JSON.parse(JSON.stringify(B.doc)); const at = doc.pages.findIndex(p => p.key === 'live');
    if(at >= 0){ doc.pages.splice(at, 1); if(doc.cur > at) doc.cur -= 1; } doc.cur = Math.max(0, Math.min(doc.cur || 0, doc.pages.length - 1));
    if(doc.pages.length) dput('boards', B.key, doc); }

  /* ---------- 📡 Live board in a Pencil Space ----------
     The teacher taps "Show everyone": from then on the page they are on (and everything drawn on it) appears on every
     child's board as "Teacher's board", updating as they write. Children can look but not change it; their own pages stay
     theirs, on their own device. Pictures travel with the page, up to a size that the Space can carry. */
  const LIVE_IMG_CAP = 1.2e6;
  const liveObj = () => { try{ return typeof Live !== 'undefined' && Live.on ? Live : null; }catch(e){ return null; } };
  const liveHost = () => { const L = liveObj(); return !!(L && L.isHost()); };
  function livePush(){ if(!B.live.sharing) return; B.live.rev += 1; const L = liveObj(); if(L) L.push(250); }
  function liveShared(){
    if(!B.live.sharing || !liveHost()) return null;
    const p = page(); if(!p) return { on:true, rev:B.live.rev, page:null };
    const pg = JSON.parse(JSON.stringify(p)), imgs = {}; let size = 0;
    const want = [p.bg === 'img' ? p.bgImg : null, ...p.items.filter(i => i.t === 'i').map(i => i.id)].filter(Boolean);
    want.forEach(id => { const src = B.src.get(id); if(src && size + src.length < LIVE_IMG_CAP){ imgs[id] = src; size += src.length; } });
    if(p.bg === 'vis') pg.visHTML = B.visHTML || '';
    return { on:true, rev:B.live.rev, title:B.doc ? B.doc.title : '', n:B.page + 1, of:B.doc ? B.doc.pages.length : 1, page:pg, imgs };
  }
  function setSharing(on){
    B.live.sharing = !!on && liveHost();
    const b = B.el && B.el.querySelector('#bdLive');
    if(b){ b.classList.toggle('on', B.live.sharing); b.setAttribute('aria-pressed', B.live.sharing ? 'true' : 'false');
      b.innerHTML = B.live.sharing ? '📡<span class="bd-lbl"> Everyone can see</span>' : '📡<span class="bd-lbl"> Show everyone</span>'; }
    B.live.rev += 1; const L = liveObj(); if(L) L.push(0);
    status(B.live.sharing ? 'Everyone in the Space can now see this board. Tap 📡 again to stop.' : 'The board is just on your screen again.');
  }
  /* On a child's screen: show what the teacher shared. */
  function fromShared(sh){
    if(liveHost()) return;
    if(!B.doc){ B.live.pending = sh; return; }
    const at = B.doc.pages.findIndex(p => p.key === 'live');
    if(!sh || !sh.on || !sh.page){
      if(at >= 0){ const was = B.page === at; B.doc.pages.splice(at, 1); if(B.page >= at && B.page > 0) B.page -= 1; if(was || B.page >= B.doc.pages.length) B.page = Math.min(B.live.back || 0, B.doc.pages.length - 1); B.live.got = 0; if(B.el && B.el.isConnected) paintAll(); }
      return;
    }
    if(sh.rev === B.live.got && at >= 0) return;
    B.live.got = sh.rev;
    Object.keys(sh.imgs || {}).forEach(id => { if(!B.imgs.has(id) || !B.imgs.get(id).src){ const im = new Image(); im.onload = () => paint(); im.src = sh.imgs[id]; B.imgs.set(id, im); B.src.set(id, sh.imgs[id]); } });
    const pg = Object.assign({}, sh.page, { key:'live', id:'live', title:'📡 Teacher’s board' + (sh.page.title ? ': ' + sh.page.title : ''), prompt:sh.page.prompt || '' });
    const newPg = B.live.lastPageId !== sh.page.id; B.live.lastPageId = sh.page.id;
    if(at >= 0) B.doc.pages[at] = pg; else { B.doc.pages.unshift(pg); B.page += 1; }
    const li = B.doc.pages.findIndex(p => p.key === 'live');
    if(at < 0 || newPg){ if(B.page !== li) B.live.back = B.page; B.page = li; B.sel = null; }   // follow the teacher when they share or turn the page
    if(B.el && B.el.isConnected) paintAll();
  }
  function exportPNG(){
    commitText();
    const p = page(); if(!p) return;
    const c = document.createElement('canvas'); c.width = p.w; c.height = p.h;
    const g = c.getContext('2d'); paper(g, p); p.items.forEach(it => drawItem(g, it));
    try{
      const a = document.createElement('a'); a.download = `${(B.doc.title || 'board').replace(/[^\w-]+/g, '-').toLowerCase()}-page-${B.page + 1}.png`;
      a.href = c.toDataURL('image/png'); document.body.appendChild(a); a.click(); a.remove();
      status('Saved a picture of this page to your downloads.');
    }catch(e){ status('Sorry, the picture could not be saved here.'); }
  }

  window.FabBoard = { open:openBoard, addPages, undock, docked:() => !!(B.el && B.el.classList.contains('docked')), addBooklet:o => addBooklet(o), state:() => B, _page:page, _save:saveNow, _paint:paint,
    liveShared, fromShared:sh => { B.live.last = sh; fromShared(sh); }, setSharing, sharing:() => B.live.sharing, hasLive:() => !!(B.doc && B.doc.pages.some(p => p.key === 'live')),
    mount, unmount, inlaid, setVis, setDeck, goWhere, addModelPage, setBig, page:() => page(), go:goPage, refresh:() => { if(B.el && B.doc) paintAll(); },
    /* for live sharing (coview.js): the whole page as plain data, and a way to show a page sent by the teacher */
    snapshot:() => { const p = page(); return p ? { title:B.doc.title, n:B.page, of:B.doc.pages.length, page:JSON.parse(JSON.stringify(p)) } : null; },
    imgSrc:id => dget('imgs', id), putImg:(id, src) => { const im = new Image(); im.onload = () => paint(); im.src = src; B.imgs.set(id, im); return dput('imgs', id, src); } };
})();
