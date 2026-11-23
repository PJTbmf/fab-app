/* Joins the Learning Board (board.js) and Show a link (coview.js) to the Learning Hub and lessons. */
(function(){
  'use strict';
  /* where the child is right now: the lesson, the screen, and (in a flightpath) their step */
  function current(){
    try{
      const p = Learn.pack; if(!p) return null;
      const s = p.screens[Learn.step]; if(!s) return { p };
      if(s.type === 'pathway'){
        const st = Learn.state[Learn.step], kid = st && pwKid(st, pwMe());
        if(kid && kid.step != null) return { p, s, stp:s.steps[kid.step], i:kid.step };
      }
      return { p, s };
    }catch(e){ return null; }
  }
  function boardFor(c, withBooklet){
    if(!c || !c.p) return FabBoard.open({ id:'workbook', title:'My workbook', back:'screen-learn' });
    const maths = /maths/i.test(c.p.subject || '');
    const stp = c.stp, opts = { id:'lesson:' + c.p.id, title:(c.p.emoji ? c.p.emoji + ' ' : '') + c.p.title, back:'screen-lesson' };
    if(stp){
      opts.step = { key:c.p.id + ':' + c.i, title:`Step ${c.i + 1}: ${stp.name}`,
        prompt:stp.task || 'Show what you know, your way: draw it, write it, add stickers or a picture.', bg:maths ? 'squares' : 'lines' };
      if(withBooklet && stp.booklet && stp.booklet.url) opts.booklet = { url:stp.booklet.url, pages:stp.booklet.pages, title:stp.booklet.title };
    } else if(c.s){
      opts.step = { key:c.p.id + ':screen' + Learn.step, title:c.s.title || 'My page', prompt:'Write or draw your ideas here.', bg:maths ? 'squares' : 'lines' };
    }
    return FabBoard.open(opts);
  }
  function stepLinks(c){
    if(!c || !c.stp) return [];
    const out = [];
    (Array.isArray(c.stp.media) ? c.stp.media : []).forEach(m => { if(m && m.url) out.push({ u:m.url, t:m.title }); });
    try{ ((pwMediaSaved()[c.i]) || []).forEach(m => out.push({ u:m.u, t:m.t })); }catch(e){}
    return out;
  }
  function paintShare(){
    const can = window.CoView && CoView.canShare();
    ['learnLinkBtn', 'lpLink'].forEach(id => { const b = document.getElementById(id); if(b) b.hidden = !can; });
  }
  document.getElementById('learnBoardBtn').addEventListener('click', () => FabBoard.open({ id:'workbook', title:'My workbook', back:'screen-learn' }));
  document.getElementById('lpBoard').addEventListener('click', () => boardFor(current(), false));
  document.getElementById('lpLink').addEventListener('click', () => CoView.launcher({ links:stepLinks(current()) }));
  document.addEventListener('click', e => {
    if(e.target.closest('[data-lbwrite]')){ e.preventDefault(); boardFor(current(), false); }
    else if(e.target.closest('[data-lbbook]')){ e.preventDefault(); boardFor(current(), true); }
  });
  /* a link shared before this file loaded */
  try{ if(typeof Live !== 'undefined' && Live.pendingView){ CoView.fromShared(Live.pendingView); Live.pendingView = null; } }catch(e){}
  paintShare(); setInterval(paintShare, 3000);
  window.FabLearnBoard = { current, boardFor };
})();
