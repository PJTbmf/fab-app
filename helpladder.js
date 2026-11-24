/* helpladder.js — Help that starts with the app, so the teacher is free for the child who really needs them.
   The ladder (offered, never forced): Fab helps (a little bit of the answer) · a tip from Doctor McPhee ·
   Watch Miss Bell again (the step's I do) · ✋ Ask my teacher (joins the help queue).
   The teacher's help queue shows who is waiting, for how long, on which question, and what they already tried,
   with one-tap replies. A child on a break is listed first. Using help never costs stars.
   Loaded after the main script. */
(function(){
  'use strict';
  const h = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const arr = v => Array.isArray(v) ? v : (v && typeof v === 'object' ? Object.keys(v).sort((a, b) => a - b).map(k => v[k]) : []);
  const snd = k => { try{ Sound[k](); }catch(e){} };
  const qKey = q => q ? String(q.ask || '') + '|' + String(q.ans == null ? '' : q.ans) : '';

  /* the ladder's notes for the question on screen; they clear when the question changes */
  function sync(kid){
    const k = qKey(kid.q);
    if(!kid.hl || kid.hl.k !== k) kid.hl = { k, open:false, cut:[], lead:0, tried:(kid.hl && kid.hl.step === kid.step && kid.hl.tried) || {}, step:kid.step };
    kid.hl.cut = arr(kid.hl.cut); kid.hl.tried = kid.hl.tried || {};
    return kid.hl;
  }
  function cut(kid, i){ return !!kid && sync(kid).cut.includes(i); }
  function tapping(kid){ const q = kid.q; return !!q && q.mode !== 'shade' && (q.mode === 'choice' || (q.mode !== 'orient' && kid.tap)); }
  function note(kid, key){ const t = sync(kid).tried; t[key] = (t[key] || 0) + 1; }

  function fabHelps(s, kid, stp){
    const hl = sync(kid), q = kid.q; note(kid, 'fab');
    let msg;
    if(tapping(kid)){
      const ch = arr(q.choices), wrong = ch.map((c, i) => i).filter(i => pwNorm(ch[i]) !== pwNorm(q.ans) && !hl.cut.includes(i));
      if(ch.length - hl.cut.length > 2 && wrong.length){ hl.cut.push(wrong[Math.floor(Math.random() * wrong.length)]); msg = 'I’ve taken one answer away. Which of the others could it be?'; }
      else msg = 'Just two left. Say them both out loud. Which one sounds right?';
    } else if(q && (q.mode === 'num' || q.mode === 'rem' || !q.mode) && String(q.ans == null ? '' : q.ans).length > 1){
      const a = String(q.ans); hl.lead = Math.min(a.length - 1, (hl.lead || 0) + 1);
      msg = 'It starts with ' + a.slice(0, hl.lead).trim() + '… Can you finish it?';
    } else {
      let hint = ''; try{ hint = pwFindHint(stp, q, null).text; }catch(e){}
      msg = 'Look at the picture again, slowly. ' + hint;
    }
    kid.last = 'fabhelp'; kid.msg = msg; kid.hintLabel = 'Fab helped'; hl.open = false;
  }
  function tip(s, kid, stp){
    note(kid, 'tip');
    let hint = ''; try{ const worked = (sync(kid).tried.tip > 1) && typeof PW_WORKED !== 'undefined' && PW_WORKED[kid.q.kind]; hint = worked ? worked(kid.q) : pwFindHint(stp, kid.q, null).text; }catch(e){}
    kid.last = 'tip'; kid.msg = hint || 'Read the question once more, slowly.'; kid.hintLabel = 'Asked for a tip'; kid.hl.open = false;
  }
  function ask(kid, on){
    kid.help = on; kid.helpSeen = null;
    if(on){ kid.helpAt = Date.now(); kid.helpQ = kid.q && kid.phase !== 'ido' && kid.phase !== 'ready' ? String(kid.q.ask || '').slice(0, 90) : ''; }
    if(kid.hl) kid.hl.open = false;
  }

  /* ---------- the child's side ---------- */
  function btn(kid){
    return `<button class="btn small ${kid.help ? 'amber' : 'soft'}" data-hlact="open" aria-expanded="${!!(kid.hl && kid.hl.open)}">${kid.help ? '✋ Your teacher knows' : '🙋 I’d like help'}</button>`;
  }
  function waitHTML(kid){
    if(!kid.help) return '';
    const seen = kid.helpSeen === 'way' ? '<b>💛 Your teacher has seen you and is on the way.</b>' : kid.helpSeen === 'talk' ? '<b>💛 Your teacher is going to talk with you now.</b>' : '<b>✋ Your teacher knows you’d like help.</b>';
    return `<div class="hl-wait" role="status">${seen}<span>While you wait, you could have another go, draw it on your board, or take three slow breaths.</span></div>`;
  }
  function panelHTML(s, kid, stp){
    const rung = (act, who, alt, title, sub) => `<button type="button" class="hl-rung" data-hlact="${act}"><span class="fab-char ${who}" role="img" aria-label="${alt}"></span><span class="hl-txt"><b>${title}</b><small>${sub}</small></span></button>`;
    return `<div class="hl-panel" role="group" aria-label="Ways to get help"><b class="hl-title">What would help?</b>
      ${rung('fab', 'fab', 'Fab', 'Fab helps', 'Show me a little bit of the answer')}
      ${rung('tip', 'doc', 'Doctor McPhee', 'A tip from Doctor McPhee', 'A hint for this question')}
      ${stp.teach ? rung('bell', 'bell', 'Miss Bell', 'Watch Miss Bell again', 'See how it’s done, then come back') : ''}
      <button type="button" class="hl-rung hl-teacher" data-hlact="ask"><span class="hl-hand" aria-hidden="true">✋</span><span class="hl-txt"><b>${kid.help ? 'I’m OK now, thank you' : 'Ask my teacher'}</b><small>${kid.help ? 'Tell your teacher you don’t need them any more' : 'Your teacher will come to you'}</small></span></button>
      <div class="hl-foot"><button type="button" class="btn small soft" data-hlact="close">Close</button><span>Asking for help is a clever thing to do.</span></div></div>`;
  }
  /* takes the step's usual feedback and returns what the child should see there */
  function fb(s, kid, stp, usual){
    const hl = sync(kid);
    if(hl.open) return panelHTML(s, kid, stp);
    let out = usual;
    if(kid.last === 'fabhelp') out = `<div class="pw-fb try"><div class="fab-say"><span class="fab-char fab" role="img" aria-label="Fab"></span><div class="bubble"><b>Fab helps.</b>${h(kid.msg || '')}</div></div></div>`;
    else if(kid.last === 'tip') out = `<div class="pw-fb try"><div class="fab-say doc"><span class="fab-char doc" role="img" aria-label="Doctor McPhee"></span><div class="bubble"><b>${kid.hintLabel === 'Your teacher sent a hint' ? 'A hint from your teacher.' : 'A tip from Doctor McPhee.'}</b>${h(kid.msg || '')}</div></div></div>`;
    return out + waitHTML(kid);
  }

  /* returns true (handled, redraw), false (handled, no redraw) or null (not ours) */
  function click(t, s, st, me){
    const tq = t.closest('[data-hlq]');
    if(tq && pwIsTeacher(st)){
      const id = tq.dataset.id, a = tq.dataset.hlq;
      if(a === 'reteach'){ const stepI = Number(tq.dataset.step); Object.keys(st.kids || {}).forEach(i => { const k = st.kids[i]; if(k && k.step === stepI && s.steps[stepI].teach && !k.rest){ pwTeachInit(k, s.steps[stepI]); k.hintLabel = 'Teacher is teaching this again'; } }); snd('ding'); return true; }
      const k = st.kids && st.kids[id]; if(!k) return false;
      const stp = s.steps[k.step];
      if(a === 'way' || a === 'talk'){ k.helpSeen = a; snd('tick'); return true; }
      if(a === 'hint'){ let hint = ''; try{ hint = pwFindHint(stp, k.q, null).text; }catch(e){} k.last = 'tip'; k.msg = hint; k.hintLabel = 'Your teacher sent a hint'; k.help = false; k.helpSeen = null; if(k.hl) k.hl.open = false; snd('tick'); return true; }
      if(a === 'easier'){ if(k.step < 1) return false; const keep = k.done || 0; pwStart(s, st, id, k.step - 1); st.kids[id].done = keep; st.kids[id].help = false; st.kids[id].hintLabel = 'Teacher chose an easier step'; snd('tick'); return true; }
      return false;
    }
    const kid = st.kids && st.kids[me]; if(!kid) return null;
    /* stamp the old buttons too, so the queue knows how long a child has waited */
    const old = t.closest('[data-pwact]');
    if(old){
      if(old.dataset.pwact === 'help'){ ask(kid, !kid.help); snd('tick'); return true; }
      if(old.dataset.pwact === 'rest') kid.restAt = Date.now();
      if(old.dataset.pwact === 'back') kid.restAt = null;
      return null;
    }
    const b = t.closest('[data-hlact]'); if(!b) return null;
    const a = b.dataset.hlact, stp = s.steps[kid.step], hl = sync(kid);
    if(a === 'open'){ hl.open = !hl.open; snd('tick'); return true; }
    if(a === 'close'){ hl.open = false; snd('tick'); return true; }
    if(a === 'fab'){ fabHelps(s, kid, stp); snd('ding'); return true; }
    if(a === 'tip'){ tip(s, kid, stp); snd('ding'); return true; }
    if(a === 'bell'){ note(kid, 'bell'); const tried = hl.tried; pwTeachInit(kid, stp); kid.hintLabel = 'Watching Miss Bell again'; sync(kid).tried = tried; snd('ding'); return true; }
    if(a === 'ask'){ ask(kid, !kid.help); snd('tick'); return true; }
    return null;
  }

  /* ---------- the teacher's help queue ---------- */
  const since = ts => { const m = Math.max(0, Math.round((Date.now() - (ts || Date.now())) / 60000)); return m < 1 ? 'just now' : m + ' min'; };
  function triedText(k){
    const t = (k.hl && k.hl.step === k.step && k.hl.tried) || {}, out = [];
    if(t.fab) out.push('Fab’s help' + (t.fab > 1 ? ' ×' + t.fab : '')); if(t.tip) out.push('a tip' + (t.tip > 1 ? ' ×' + t.tip : '')); if(t.bell) out.push('Miss Bell again');
    return out.length ? 'Already tried: ' + out.join(', ') : 'Hasn’t tried the app’s help yet';
  }
  function queueHTML(s, st, ids){
    const kids = st.kids || {}, list = (ids || Object.keys(kids)).filter(id => kids[id]);
    const breaks = list.filter(id => kids[id].rest), helps = list.filter(id => kids[id].help && !kids[id].rest).sort((a, b) => (kids[a].helpAt || 0) - (kids[b].helpAt || 0));
    /* the same step is tricky for several children: offer to teach it again to all of them */
    const stuck = {}; list.forEach(id => { const k = kids[id]; if(k.rest || k.phase === 'ido' || k.phase === 'ready') return; if(k.help || k.last === 'try' || k.last === 'reveal' || k.last === 'tip' || k.last === 'fabhelp') (stuck[k.step] = stuck[k.step] || []).push(id); });
    const need = list.length >= 5 ? 3 : 2;
    const together = Object.keys(stuck).filter(i => stuck[i].length >= need && s.steps[i] && s.steps[i].teach).map(i => `<div class="hl-together"><span>💡 <b>${stuck[i].length} children</b> are finding <b>${h(s.steps[i].name)}</b> tricky.</span><button class="btn small leaf" data-hlq="reteach" data-step="${i}">👀 Teach it again to them all</button></div>`).join('');
    if(!breaks.length && !helps.length && !together) return '';
    const row = id => { const k = kids[id], stp = s.steps[k.step];
      if(!k.helpAt) k.helpAt = Date.now();
      return `<li class="hl-q"><div class="hl-q-top"><b>${h(pwName(id))}</b><span class="hl-since" data-hlsince="${k.helpAt}">waiting ${since(k.helpAt)}</span></div>
        <div class="hl-q-what">Step ${k.step + 1}: ${h(stp.name)}${k.helpQ ? ` · <i>${h(k.helpQ)}</i>` : k.phase === 'check' ? ' · on the checkpoint' : ''}</div>
        <div class="hl-q-tried">${h(triedText(k))}${k.helpSeen ? ` · <b>${k.helpSeen === 'way' ? 'Told: on my way' : 'Told: talking now'}</b>` : ''}</div>
        <div class="pw-card-btns"><button class="btn small ${k.helpSeen === 'way' ? 'amber' : 'soft'}" data-hlq="way" data-id="${h(id)}">On my way</button><button class="btn small ${k.helpSeen === 'talk' ? 'amber' : 'soft'}" data-hlq="talk" data-id="${h(id)}">Talk now</button>${k.phase !== 'check' ? `<button class="btn small soft" data-hlq="hint" data-id="${h(id)}">Send a hint</button>` : ''}${k.step > 0 ? `<button class="btn small soft" data-hlq="easier" data-id="${h(id)}">Make it easier</button>` : ''}<button class="btn small leaf" data-pwclear="${h(id)}">Helped ✓</button></div></li>`; };
    const brow = id => { const k = kids[id]; return `<li class="hl-q hl-break"><div class="hl-q-top"><b>${h(pwName(id))}</b><span class="hl-since" ${k.restAt ? `data-hlsince="${k.restAt}"` : ''}>${k.restAt ? 'resting ' + since(k.restAt) : 'resting'}</span></div><div class="hl-q-what">😴 Having a break with Nurse Willow. They’ll come back when they’re ready. Only you can see this.</div></li>`; };
    return `<section class="hl-queue" aria-label="Help queue"><h3>🙋 Help queue${helps.length ? ` <span class="hl-count">${helps.length} waiting</span>` : ''}</h3>${together}${breaks.length || helps.length ? `<ol>${breaks.map(brow).join('')}${helps.map(row).join('')}</ol>` : ''}</section>`;
  }
  setInterval(() => { document.querySelectorAll('[data-hlsince]').forEach(el => { const w = el.textContent.split(' ')[0]; el.textContent = w + ' ' + since(Number(el.dataset.hlsince)); }); }, 20000);

  const CSS = `
.pw-choice.hl-cut{opacity:.22;text-decoration:line-through;cursor:default;box-shadow:none}
.hl-panel{background:var(--cream,#FFF6E6);border:3px solid var(--ink,#2B1A12);border-radius:20px;padding:12px;margin:10px 0;display:grid;gap:8px;text-align:left}
.hl-title{font-family:var(--disp);font-size:var(--t-lead,1.15rem)}
.hl-rung{display:flex;align-items:center;gap:12px;width:100%;text-align:left;background:#fff;border:3px solid var(--cream-deep,#f0dfbd);border-radius:16px;padding:8px 12px;font:inherit;color:var(--ink,#2B1A12);cursor:pointer;min-height:64px}
.hl-rung:hover,.hl-rung:focus-visible{border-color:var(--flame,#FE4D02);outline:none}
.hl-rung .fab-char{width:46px;margin:0;flex:none}.hl-hand{font-size:2rem;width:46px;text-align:center;flex:none}
.hl-txt{display:flex;flex-direction:column}.hl-txt b{font-size:var(--t-body,1.05rem)}.hl-txt small{font-size:var(--t-small,.95rem);opacity:.8}
.hl-teacher{background:var(--sunshine,#FFD483);border-color:var(--amber,#e0a63a)}
.hl-foot{display:flex;flex-wrap:wrap;gap:10px;align-items:center;font-size:var(--t-small,.95rem);opacity:.9}
.hl-wait{background:#fff7dd;border:2px dashed var(--amber,#e0a63a);border-radius:14px;padding:8px 12px;margin:8px 0;display:flex;flex-direction:column;gap:2px;text-align:left}
.hl-queue{max-width:1120px;margin:0 auto 14px;background:#fff7dd;border:3px solid var(--amber,#e0a63a);border-radius:20px;padding:10px 14px;text-align:left}
.hl-queue h3{margin:0 0 8px;font-size:var(--t-head,1.3rem)}.hl-count{background:var(--flame,#FE4D02);color:#fff;border-radius:999px;padding:2px 10px;font-size:.9rem;vertical-align:middle;font-family:var(--body)}
.hl-queue ol{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.hl-q{background:#fff;border-radius:14px;padding:8px 12px;border-left:8px solid var(--amber,#e0a63a)}
.hl-q.hl-break{border-left-color:var(--sky,#3F6A8C)}
.hl-q-top{display:flex;justify-content:space-between;gap:10px}.hl-since{font-weight:700;color:var(--flame-dark,#C93C00)}
.hl-q-what i{font-style:normal;opacity:.85}.hl-q-tried{font-size:var(--t-small,.95rem);opacity:.85;margin:2px 0 6px}
.hl-together{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;background:#fff;border-radius:14px;padding:8px 12px;margin-bottom:8px}
`;
  const stl = document.createElement('style'); stl.textContent = CSS; document.head.appendChild(stl);

  window.FabHelp = { sync, cut, btn, fb, click, queueHTML, waitHTML };
})();
