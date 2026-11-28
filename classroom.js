/* classroom.js: several children at once (27 Nov 2026).
   Patrick runs groups of 2 to 5 children in Pencil Spaces, with one Web Viewer per child. Tested 27 Nov in the BMF Test Space:
   each Web Viewer is its own browser in Pencil's cloud, and it keeps its saved things between visits while "Always available"
   is on, so a child's progress lives in their own viewer.
   - Class links (a card on the For staff page): one link per Fab code. It opens the app as that child (?learner=CODE),
     starts with sounds off (&quiet=1, once) and turns on class mode (&class=1) for that viewer.
   - The help hand (class mode): the child taps "I'd like help". A big gold banner with their Fab code shows at the top of
     their app, so the teacher sees it on the Pencil board. Anyone can put it down. Nothing is sent anywhere.
   - Energy today: each child can choose Lots, Some or Low energy (per Fab code, per day). Low energy makes the do-it-for-me
     routes the first choice in Fox Blocks and Fab's Sanctuary, opens a lesson step's low-energy version, and Fab Fox World
     suggests a calm place. In class mode it shows beside the help hand, so the teacher can see it too.
   Fab codes only: never a name. A draft for BMF to check. */
(function(){
  'use strict';
  const INK = '#2B1A12';
  const CODE_RE = /^[a-z]{2,12}-\d{3}$/;
  const Q = (() => { try{ return new URLSearchParams(location.search); }catch(e){ return new URLSearchParams(''); } })();
  const ls = { get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }, set(k, v){ try{ localStorage.setItem(k, v); }catch(e){} }, del(k){ try{ localStorage.removeItem(k); }catch(e){} } };
  const h = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const who = () => { try{ return (typeof fabLearnerCode === 'function' ? fabLearnerCode() : '') || ''; }catch(e){ return ''; } };

  /* ---- class mode and quiet start: kept for this viewer (this browser) ---- */
  if(Q.get('class') === '1') ls.set('fab-class', '1');
  if(Q.get('class') === '0') ls.del('fab-class');
  if(Q.get('quiet') === '1' && !ls.get('fab-quiet-set')){ ls.set('bmf_sound', 'off'); ls.set('fab-quiet-set', '1'); try{ fabSoundSync(); }catch(e){} }
  const classOn = () => ls.get('fab-class') === '1';

  /* ---- drawings: a raised hand and three batteries (ink outline, flat fill) ---- */
  const HAND = `<svg viewBox="0 0 64 64" aria-hidden="true"><g fill="none" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round"><path d="M22 60C15 54 10 46 10 38V31C10 26 17 25 18 30L19 36V15C19 10 26 10 26 15V31V10C26 5 33 5 33 10V31V13C33 8 40 8 40 13V33V19C40 14 47 14 47 19V40C47 51 41 59 33 61Z" fill="#F0B913"/><path d="M52 8l4-4M55 16h5M47 4l1-4" stroke-width="2.6"/></g></svg>`;
  const BATT = { lots:['#BFD88E', 3], some:['#F0B913', 2], low:['#F4B58F', 1] };
  const batt = v => { const b = BATT[v] || BATT.some; let bars = ''; for(let i = 0; i < b[1]; i++) bars += `<rect x="${9 + i * 9}" y="17" width="6" height="14" rx="1.5" fill="${b[0]}" stroke="${INK}" stroke-width="2"/>`;
    return `<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="5" y="13" width="34" height="22" rx="4" fill="#FFFDF7" stroke="${INK}" stroke-width="3"/><rect x="39" y="19" width="5" height="10" rx="2" fill="${INK}"/>${bars}</svg>`; };
  const EWORD = { lots:'Lots of energy', some:'Some energy', low:'Low energy' };

  const css = `
  .fe-row{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px;margin:2px auto 12px;max-width:1000px;color:#2B1A12}
  .fe-row .fe-q{font:italic 700 1.05rem Aleo,Georgia,serif}
  .fe-row button{display:inline-flex;align-items:center;gap:6px;min-height:46px;padding:4px 14px 6px 8px;background:#FFF6E6;border:3px solid #2B1A12;border-radius:14px 16px 13px 17px;font:italic 700 1rem Aleo,Georgia,serif;color:#2B1A12;cursor:pointer;box-shadow:none}
  .fe-row button svg{width:32px;height:32px}
  .fe-row button[aria-pressed="true"]{background:#F0B913}
  .fe-row button:focus-visible,.fh-banner button:focus-visible,.fh-tag button:focus-visible{outline:3px solid #FE4D02;outline-offset:2px}
  .fe-row .fe-note{flex-basis:100%;text-align:center;font-size:.95rem;margin:0}
  body.fab-dark .fe-row{color:#FFF6E6}
  .fh-banner{position:fixed;top:10px;left:50%;transform:translateX(-50%);z-index:100000;display:flex;align-items:center;gap:14px;max-width:min(94vw,760px);background:#F0B913;color:#2B1A12;border:4px solid #2B1A12;border-radius:20px 26px 22px 27px;padding:8px 12px 8px 10px}
  .fh-banner[hidden]{display:none}
  .fh-banner .fh-ico svg{width:64px;height:64px;display:block}
  .fh-banner b{display:block;font:italic 700 clamp(1.15rem,2.6vw,1.6rem)/1.15 Aleo,Georgia,serif}
  .fh-banner small{display:block;font-size:clamp(.9rem,1.8vw,1.05rem);margin-top:2px}
  .fh-banner button{flex:none;min-height:48px;padding:6px 14px;background:#FFF6E6;border:3px solid #2B1A12;border-radius:14px 16px 13px 17px;font:italic 700 1rem Aleo,Georgia,serif;color:#2B1A12;cursor:pointer}
  @media (prefers-reduced-motion:no-preference){.fh-banner .fh-ico{animation:fhWave 1.6s ease-in-out infinite;transform-origin:50% 90%}}
  @keyframes fhWave{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(8deg)}}
  .fh-tag{position:absolute;top:6px;right:146px;z-index:5;display:flex;align-items:center;gap:6px;height:56px;box-sizing:border-box;background:#FFF6E6;color:#2B1A12;border:3px solid #2B1A12;border-radius:16px 18px 15px 19px;padding:3px 3px 3px 10px;font:italic 700 1rem Aleo,Georgia,serif}
  body.fh-notheme .fh-tag{right:80px}
  .fh-tag[hidden]{display:none}
  .fh-tag .fh-e{display:inline-flex;align-items:center}
  .fh-tag .fh-e svg{width:30px;height:30px}
  .fh-tag button{display:inline-flex;align-items:center;gap:4px;height:44px;padding:0 10px 0 4px;background:#F0B913;border:3px solid #2B1A12;border-radius:12px 14px 11px 15px;font:italic 700 1rem Aleo,Georgia,serif;color:#2B1A12;cursor:pointer}
  .fh-tag button svg{width:34px;height:34px}
  .fh-tag button[aria-pressed="true"]{background:#FE4D02;color:#fff}
  @media (max-width:760px){.fh-tag .fh-c,.fh-tag button span{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}.fh-tag,body.fh-notheme .fh-tag{top:68px;right:14px;padding-left:3px}.fh-tag button{padding:0 4px}}
  .lp-tips.fe-low{border-color:#F0B913!important}
  .lp-tips.fe-low summary::after{content:' · low energy today';font-weight:700}
  .cl-card{background:#FFF6E6;border:3px solid #2B1A12;border-radius:18px 22px 19px 23px;padding:12px 16px 14px;margin:0 0 16px;color:#2B1A12}
  .cl-card textarea{width:100%;min-height:92px;font:1rem/1.4 ui-monospace,Menlo,Consolas,monospace;border:3px solid #2B1A12;border-radius:12px;padding:8px 10px;box-sizing:border-box;background:#fff}
  .cl-card .cl-opts{display:flex;flex-wrap:wrap;gap:14px;margin:8px 0}
  .cl-card .cl-opts label{display:inline-flex;align-items:center;gap:6px;font-weight:700}
  .cl-card .cl-opts input{width:22px;height:22px}
  .cl-card ol{margin:6px 0 0;padding-left:1.4em;line-height:1.45}
  .cl-links{display:grid;gap:6px;margin:8px 0}
  .cl-links div{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
  .cl-links b{min-width:9.5em}
  .cl-links input{flex:1;min-width:14em;font:.92rem ui-monospace,Menlo,Consolas,monospace;padding:6px 8px;border:2px solid #2B1A12;border-radius:10px;background:#fff}
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* ---- energy today ---- */
  const EKEY = c => 'fab-energy-' + c;
  function energy(c){ c = c || who(); if(!c) return ''; try{ const e = JSON.parse(ls.get(EKEY(c)) || 'null'); return e && e.d === today() ? e.v : ''; }catch(e){ return ''; } }
  function setEnergy(v){ const c = who(); if(!c || !BATT[v]) return; ls.set(EKEY(c), JSON.stringify({ d:today(), v })); try{ if(window.FabImpact) FabImpact.log('energy', v); }catch(e){} try{ Sound.tick(); }catch(e){} paint(); }
  function energyRow(){
    const hub = document.getElementById('screen-hub'), whoBtn = document.getElementById('whoBtn'); if(!hub || !whoBtn) return;
    let row = document.getElementById('fabEnergy'), c = who();
    if(!c){ if(row) row.remove(); return; }
    if(!row){ row = document.createElement('div'); row.id = 'fabEnergy'; row.className = 'fe-row'; row.setAttribute('role', 'group'); row.setAttribute('aria-label', 'How much energy do you have today?'); (whoBtn.closest('.whobar') || whoBtn).insertAdjacentElement('afterend', row);
      row.addEventListener('click', e => { const b = e.target.closest('[data-energy]'); if(b) setEnergy(b.dataset.energy); }); }
    const v = energy(c);
    row.innerHTML = `<span class="fe-q">Energy today:</span>` + ['lots', 'some', 'low'].map(k => `<button type="button" data-energy="${k}" aria-pressed="${v === k}">${batt(k)}${['Lots', 'Some', 'Low'][['lots', 'some', 'low'].indexOf(k)]}</button>`).join('') +
      (v === 'low' ? '<p class="fe-note">Thanks for telling us. Take it gently today: look for “do it for me” buttons whenever you need them.</p>' : v ? '' : '<p class="fe-note">You can change this any time.</p>');
  }

  /* ---- the help hand ---- */
  const HKEY = c => 'fab-help-' + (c || 'local');
  const raised = () => !!ls.get(HKEY(who()));
  function fabHelp(on){
    const c = who(); if(on === undefined || on === null) on = !raised();
    if(on) ls.set(HKEY(c), String(Date.now())); else ls.del(HKEY(c));
    try{ on ? Sound.ding() : Sound.tick(); }catch(e){}
    paint(); return on;
  }
  window.fabHelp = fabHelp; window.fabHelpUp = raised; window.fabEnergy = energy;
  let banner, tag;
  function build(){
    banner = document.createElement('div'); banner.id = 'fabHand'; banner.className = 'fh-banner'; banner.setAttribute('role', 'status'); banner.hidden = true;
    banner.innerHTML = `<span class="fh-ico">${HAND}</span><div><b id="fabHandWho"></b><small>Your teacher can see your hand on the board.</small></div><button type="button" id="fabHandDown">Put my hand down</button>`;
    document.body.appendChild(banner);
    banner.querySelector('#fabHandDown').addEventListener('click', () => fabHelp(false));
    tag = document.createElement('div'); tag.id = 'fabTag'; tag.className = 'fh-tag'; tag.hidden = true; (document.querySelector('header') || document.body).appendChild(tag);
    tag.addEventListener('click', e => { if(e.target.closest('#fabTagHelp')) fabHelp(); });
  }
  const FULLWIN = ['screen-world', 'screen-code', 'screen-sanct'];
  function paint(){
    if(!banner) return;
    const c = who(), on = classOn(), up = on && raised(), act = (document.querySelector('.screen.active') || {}).id || '';
    document.body.classList.toggle('fab-classmode', on && !!c);
    const th = document.getElementById('themeToggle'); document.body.classList.toggle('fh-notheme', !th || th.hidden);
    banner.hidden = !up;
    if(up) banner.querySelector('#fabHandWho').textContent = (c || 'Someone') + ' would like help';
    tag.hidden = !(on && c) || FULLWIN.includes(act);
    if(!tag.hidden){ const v = energy(c);
      tag.innerHTML = `<span class="fh-c">${h(c)}</span>${v === 'low' ? `<span class="fh-e" title="Low energy today" role="img" aria-label="Low energy today">${batt(v)}</span>` : ''}<button type="button" id="fabTagHelp" aria-pressed="${up}" aria-label="${up ? 'Your hand is up. Tap to put it down' : 'I would like help'}">${HAND}<span>${up ? 'Hand up' : 'Help'}</span></button>`; }
    energyRow();
  }
  window.addEventListener('storage', e => { if(e.key && (e.key.indexOf('fab-help-') === 0 || e.key.indexOf('fab-energy-') === 0 || e.key === 'fab-class' || e.key === 'fab-me')) paint(); });

  /* a lesson step's low-energy version opens by itself on a low-energy day (the teacher sees it on the board) */
  function hookTips(){
    if(typeof window.learnTips !== 'function' || window.learnTips._fe) return;
    const base = window.learnTips;
    const wrapped = function(s){ const r = base.apply(this, arguments); try{ const t = document.getElementById('lpTips'), low = energy() === 'low' && s && s.lowEnergy; if(t){ t.classList.toggle('fe-low', !!low); if(low) t.open = true; } }catch(e){} return r; };
    wrapped._fe = true; window.learnTips = wrapped;
  }

  /* ---- For staff: today's class in Pencil Spaces ---- */
  const F = { text:'', quiet:true, hand:true, msg:'' };
  const parse = t => [...new Set(String(t || '').toLowerCase().split(/[\s,;]+/).map(x => x.replace(/[^a-z0-9-]/g, '').slice(0, 20)).filter(Boolean))];
  const teachLink = () => location.origin + location.pathname + '?pointer=1' + (F.quiet ? '&quiet=1' : '');
  const linkFor = c => location.origin + location.pathname + '?learner=' + encodeURIComponent(c) + (F.hand ? '&class=1' : '') + (F.quiet ? '&quiet=1' : '');
  function staffHTML(){
    if(!F.text){ try{ if(typeof pwCodes !== 'undefined' && pwCodes.length) F.text = pwCodes.slice(0, 6).join('\n'); }catch(e){} }
    const codes = parse(F.text), good = codes.filter(c => CODE_RE.test(c)), bad = codes.filter(c => !CODE_RE.test(c));
    return `<div class="me-card cl-card" id="clClass"><h2>Today’s class in Pencil Spaces</h2>
      <p>One Web Viewer per child. Each link opens the app as that child. Type or paste the children’s Fab codes (one per line), or make new ones.</p>
      <textarea id="clCodes" aria-label="Fab codes for today’s class, one per line" placeholder="otter-482&#10;robin-317" autocapitalize="none" spellcheck="false">${h(F.text)}</textarea>
      <div class="cl-opts"><label><input type="checkbox" id="clQuiet" ${F.quiet ? 'checked' : ''}>Start with sounds off</label><label><input type="checkbox" id="clHand" ${F.hand ? 'checked' : ''}>The help hand (class mode)</label></div>
      <div class="st-row"><button type="button" class="btn small leaf" id="clMake">Make a new code</button>${good.length > 1 ? '<button type="button" class="btn small soft" id="clCopyAll">Copy all links</button>' : ''}</div>
      ${bad.length ? `<p class="learn-msg">Not a Fab code: ${bad.map(h).join(', ')}. Fab codes look like otter-482. Please never use a name.</p>` : ''}
      <div class="cl-links cl-teach"><div><b>Your viewer</b><input readonly value="${h(teachLink())}" aria-label="App link for the teacher’s own viewer, with the Look here pointer"><button type="button" class="btn small soft" data-clcopy="__teach">Copy link</button></div></div>
      <p class="hint">For the teacher’s own viewer on the carpet: the app with the “Look here” pointer button on. In Pencil, Shift + L does not reach the app, so use the button (bottom left).</p>
      ${good.length ? `<div class="cl-links">${good.map(c => `<div><b>${h(c)}</b><input readonly value="${h(linkFor(c))}" aria-label="App link for ${h(c)}"><button type="button" class="btn small soft" data-clcopy="${h(c)}">Copy link</button></div>`).join('')}</div>` : ''}
      <p class="learn-msg" id="clMsg" aria-live="polite">${h(F.msg)}</p>
      <h3>Setting up the board</h3>
      <ol><li>Add one Web Viewer per child, and put their Fab code beside it (never a name).</li>
      <li>Paste the child’s link into their viewer’s address bar. The first click selects the viewer; the second goes into the address bar.</li>
      <li>Keep each viewer on the class board with <b>Always available</b> on. Each child’s progress is saved in their own viewer, so don’t delete it.</li>
      <li>Start each session with the viewer’s reload arrow, so it has the newest version of the app.</li></ol>
      <p class="hint">Record each child’s code in Beacon and use the same code every session. A raised hand shows in the child’s own viewer, so you see it on the board. In another Space or viewer a child starts afresh, for now. To turn class mode off on a device, open the app with <code>?class=0</code>.</p></div>`;
  }
  function staffWire(box, redraw){
    const card = box.querySelector('#clClass'); if(!card) return;
    const ta = card.querySelector('#clCodes');
    ta.addEventListener('change', () => { F.text = ta.value; F.msg = ''; redraw(); });
    card.querySelector('#clQuiet').addEventListener('change', e => { F.quiet = e.target.checked; redraw(); });
    card.querySelector('#clHand').addEventListener('change', e => { F.hand = e.target.checked; redraw(); });
    card.querySelector('#clMake').addEventListener('click', () => { F.text = ta.value; const n = typeof pupilMakeCodes === 'function' ? pupilMakeCodes(1) : []; if(n.length) F.text = (F.text.trim() ? F.text.trim() + '\n' : '') + n[0]; F.msg = n.length ? 'New code: ' + n[0] + '. Record it in Beacon.' : ''; redraw(); });
    const copy = (txt, b) => { const done = () => { F.msg = 'Copied.'; const m = card.querySelector('#clMsg'); if(m) m.textContent = 'Copied.'; if(b){ b.textContent = 'Copied'; } };
      try{ navigator.clipboard.writeText(txt).then(done, done); }catch(e){ done(); } };
    card.querySelectorAll('[data-clcopy]').forEach(b => b.addEventListener('click', () => copy(b.dataset.clcopy === '__teach' ? teachLink() : linkFor(b.dataset.clcopy), b)));
    const all = card.querySelector('#clCopyAll'); if(all) all.addEventListener('click', () => copy(parse(ta.value).filter(c => CODE_RE.test(c)).map(c => c + '  ' + linkFor(c)).join('\n'), all));
  }

  /* ---- start ---- */
  function start(){
    build(); hookTips(); paint();
    const base = window.showScreen;
    if(typeof base === 'function' && !base._fc){ const w = function(){ const r = base.apply(this, arguments); try{ paint(); }catch(e){} return r; }; w._fc = true; window.showScreen = w; }
    /* ?start=eyfs (or games, learn, wellbeing): open on that hub, e.g. a 1:1 with a Reception child */
    const START = { eyfs:'screen-eyfs', games:'screen-games', learn:'screen-learn', wellbeing:'screen-wellbeing' };
    const go = START[(Q.get('start') || '').toLowerCase()];
    if(go && document.getElementById(go)) setTimeout(() => { try{ window.showScreen(go); }catch(e){} }, 0);
  }
  window.FabClass = { staffHTML, staffWire, energy, setEnergy, help:fabHelp, raised, classOn, paint, linkFor, form:F };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
