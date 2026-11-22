/* Fab App pictures: maps, diagrams, timelines and picture cards for flightpath steps.
   Everything is drawn as inline SVG/HTML with CSS animation (no timers), so it works offline and re-renders safely.
   World map: Natural Earth (public domain), built into maps.js. */
(function(){
'use strict';
const FV = window.FabVis = { types:{}, dia:{}, version:1 };
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const R = n => Math.round(n * 10) / 10;
const lc = s => String(s == null ? '' : s).toLowerCase();
const arr = v => v == null ? [] : Array.isArray(v) ? v : [v];

/* ---------- Words in a question → parts of the picture ---------- */
function toks(text){ return ' ' + lc(text).replace(/[“”"]/g, ' ').replace(/[‘’]/g, "'").replace(/[^a-z0-9' -]+/g, ' ').replace(/(^|\s)'+/g, ' ').replace(/'+(?=\s|$)/g, ' ').replace(/\s+/g, ' ') + ' '; }
function variants(n){ const t = toks(n).trim(); if(!t) return []; const out = [t, t + 's', t + "'s"]; if(t.length > 3 && /s$/.test(t)) out.push(t.slice(0, -1)); return out; }
FV.hits = function(text, index){
  let work = toks(text); const found = [], cands = [];
  index.forEach(p => arr(p.names).forEach(n => variants(n).forEach(v => cands.push({ id:p.id, k:' ' + v + ' ' }))));
  cands.sort((a, b) => b.k.length - a.k.length);
  cands.forEach(c => { const i = work.indexOf(c.k); if(i >= 0){ if(found.indexOf(c.id) < 0) found.push(c.id); work = work.slice(0, i) + ' '.repeat(c.k.length) + work.slice(i + c.k.length); } });
  return found;
};
function expand(ids, index){
  const out = [];
  arr(ids).forEach(id => {
    if(/:\*$/.test(id)){ const pre = id.slice(0, -1); index.forEach(p => { if(p.id.indexOf(pre) === 0 && out.indexOf(p.id) < 0) out.push(p.id); }); }
    else if(out.indexOf(id) < 0) out.push(id);
  });
  return out;
}
/* Which parts are lit for the question (q) and the answer (a) */
function resolve(index, ctx){
  const q = expand(ctx.vq != null ? ctx.vq : FV.hits(ctx.ask || '', index), index);
  let a = expand(ctx.va != null ? ctx.va : FV.hits(ctx.ans || '', index), index);
  if(ctx.va == null) a = a.filter(id => q.indexOf(id) < 0);
  return { q, a };
}
FV.resolve = resolve;
/* Which parts are lit, and whether to show the whole picture with every name (the "overview"):
   always on request, and also when nothing in the question points at a part of the picture. */
function prep(ix, ctx, fix){
  const r = resolve(ix, ctx); let q = r.q, a = r.a;
  if(fix){ q = fix(q); a = fix(a); }
  const show = ctx.reveal ? q.concat(a) : q;
  const ov = !!ctx.overview || (!q.length && !(ctx.reveal && a.length));
  const cls = {}; q.forEach(i => cls[i] = 'hq'); if(ctx.reveal) a.forEach(i => cls[i] = 'ha');
  return { q, a, show, cls, ov };
}

function wrap(o){
  return `<div class="fv fv-${o.type} ${o.cls || ''}" data-vkey="${esc(o.key)}" role="img" aria-label="${esc(o.alt)}"><${o.html ? 'div class="fv-body" data-vid="body"' : 'svg viewBox="' + o.vb + '" preserveAspectRatio="xMidYMid meet" focusable="false"'}>${o.body}</${o.html ? 'div' : 'svg'}><div class="fv-cap" data-vid="cap">${esc(o.cap || '')}</div></div>`;
}
function caption(ctx, disp, q, a, ov, spec){
  const nm = ids => ids.map(i => disp[i]).filter(Boolean);
  if(ov) return spec.cap || '';
  const qn = nm(q), an = nm(a);
  if(ctx.reveal && an.length) return (qn.length ? qn.join(' and ') + '  →  ' : '') + an.join(' and ');
  if(qn.length) return 'Look at: ' + qn.join(' and ');
  return spec.cap || '';
}
function alt(label, ids, disp){ const n = ids.map(i => disp[i]).filter(Boolean); return label + (n.length ? '. Shown: ' + n.join(', ') + '.' : '.'); }

/* ---------- World map ---------- */
const CONT_ORDER = ['North America', 'South America', 'Europe', 'Africa', 'Asia', 'Oceania', 'Antarctica'];
const mapState = {};
function mapIndex(){
  if(mapState.ix) return mapState;
  const M = FAB_MAPS.world, ix = [], disp = {}, by = {};
  const EXTRA = { GBR:['uk', 'britain', 'great britain'], USA:['usa', 'united states'] };
  M.land.forEach(l => { let id = 'c:' + l.id; if(by[id]){ id += '*'; l.uid = id; by[id] = l; disp[id] = l.n; ix.push({ id, names:[l.n] }); return; } l.uid = id; by[id] = l; disp[id] = l.n; ix.push({ id, names:[l.n].concat(EXTRA[l.id] || []) }); });
  CONT_ORDER.forEach(k => { const id = 'k:' + k; disp[id] = k; ix.push({ id, names:[k] }); });
  M.oceans.forEach(o => { const id = 'o:' + o.n; disp[id] = o.n; ix.push({ id, names:[o.n, o.n.replace(' Ocean', '')] }); });
  [['l:equator', 'The Equator', ['equator']], ['l:tropicN', 'Tropic of Cancer', ['tropic of cancer']], ['l:tropicS', 'Tropic of Capricorn', ['tropic of capricorn']], ['l:prime', 'Prime Meridian', ['prime meridian']],
   ['l:arctic', 'Arctic Circle', ['arctic circle']], ['l:antarctic', 'Antarctic Circle', ['antarctic circle']], ['p:N', 'North Pole', ['north pole']], ['p:S', 'South Pole', ['south pole']],
   ['h:N', 'Northern Hemisphere', ['northern hemisphere']], ['h:S', 'Southern Hemisphere', ['southern hemisphere']], ['h:E', 'Eastern Hemisphere', ['eastern hemisphere']], ['h:W', 'Western Hemisphere', ['western hemisphere']]]
    .forEach(x => { disp[x[0]] = x[1]; ix.push({ id:x[0], names:x[2] }); });
  Object.keys(M.rivers).forEach(k => { const id = 'r:' + k; disp[id] = 'River ' + k; ix.push({ id, names:['river ' + k, k] }); });
  Object.keys(M.cities).forEach(k => { const id = 't:' + k; disp[id] = k; ix.push({ id, names:[k] }); });
  mapState.ix = ix; mapState.disp = disp; mapState.by = by; return mapState;
}
function unionBox(boxes){ if(!boxes.length) return null; return [Math.min.apply(0, boxes.map(b => b[0])), Math.min.apply(0, boxes.map(b => b[1])), Math.max.apply(0, boxes.map(b => b[2])), Math.max.apply(0, boxes.map(b => b[3]))]; }
function zoomFor(box, W, H, maxS, minW, minH){
  if(!box) return { s:1, tx:0, ty:0 };
  const cx = (box[0] + box[2]) / 2, cy = (box[1] + box[3]) / 2, bw = Math.max(box[2] - box[0], minW), bh = Math.max(box[3] - box[1], minH);
  let s = Math.min(W / (bw * 1.45), H / (bh * 1.45)); s = Math.max(1, Math.min(s, maxS));
  let tx = W / 2 - s * cx, ty = H / 2 - s * cy;
  tx = Math.min(0, Math.max(W * (1 - s), tx)); ty = Math.min(0, Math.max(H * (1 - s), ty));
  return { s, tx, ty };
}
FV.types.map = {
  index(){ return mapIndex().ix; },
  html(spec, ctx){
    const S = mapIndex(), M = FAB_MAPS.world, W = M.w, H = M.h;
    const { q, a, show, cls, ov } = prep(S.ix, ctx, ids => ids.indexOf('k:Antarctica') >= 0 ? ids.filter(i => i !== 'c:ATA') : ids);
    const on = !ov && show.length > 0;
    // zoom on what is lit (question, then answer)
    const boxes = [];
    show.forEach(id => {
      const p = id.slice(2);
      if(id[0] === 'c' && S.by[id] && S.by[id].bb) boxes.push(S.by[id].bb);
      else if(id[0] === 'k') boxes.push(M.continents[p].bb);
      else if(id[0] === 'o') boxes.push(M.oceans.find(o => o.n === p).bb);
      else if(id[0] === 'r') boxes.push(M.rivers[p].bb);
      else if(id[0] === 't') { const c = M.cities[p]; boxes.push([c[0] - 30, c[1] - 20, c[0] + 30, c[1] + 20]); }
    });
    let box = ov ? null : unionBox(boxes);
    if(!box && spec.view && M.views[spec.view]) box = M.views[spec.view];
    const z = zoomFor(box, W, H, spec.maxZoom || 6.5, 90, 50);
    const fs = n => R(n / Math.sqrt(z.s));
    const colour = ov || spec.colour;
    const contHit = k => cls['k:' + k] || '';
    // land
    let land = '';
    M.land.forEach(l => {
      const id = l.uid, kIdx = CONT_ORDER.indexOf(l.c);
      const hc = cls[id] || contHit(l.c) || '';
      if(l.split){
        land += `<path class="land k${CONT_ORDER.indexOf('Europe')} ${cls[id] || contHit('Europe')}" data-vid="${id}-e" d="${l.d}" clip-path="url(#fvce)"/><path class="land k${CONT_ORDER.indexOf('Asia')} ${cls[id] || contHit('Asia')}" data-vid="${id}-a" d="${l.d}" clip-path="url(#fvca)"/>`;
      } else land += `<path class="land k${kIdx} ${hc}" data-vid="${id}" d="${l.d}"/>`;
    });
    const ru = M.land.find(l => l.split);
    const defs = `<defs><clipPath id="fvce"><path d="${ru.split.europe}"/></clipPath><clipPath id="fvca"><path d="${ru.split.asia}"/></clipPath><filter id="fvblur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7"/></filter></defs>`;
    // oceans
    let oc = ''; M.oceans.forEach(o => { oc += `<path class="ocean ${cls['o:' + o.n] || ''}" data-vid="o-${esc(o.n)}" d="${o.d}"/>`; });
    // hemispheres
    const eqY = (M.grat.equator.match(/,([\d.]+)/) || [0, H / 2])[1];
    const hemi = [['N', `M0,0 H${W} V${eqY} H0Z`], ['S', `M0,${eqY} H${W} V${H} H0Z`], ['W', `M0,0 H${W / 2} V${H} H0Z`], ['E', `M${W / 2},0 H${W} V${H} H${W / 2}Z`]]
      .map(h => `<path class="hemi ${cls['h:' + h[0]] || ''}" data-vid="h-${h[0]}" d="${h[1]}"/>`).join('');
    // lines
    const showLines = spec.lines === true || ov && spec.lines;
    const lineNames = { equator:'l:equator', tropicN:'l:tropicN', tropicS:'l:tropicS', prime:'l:prime', arctic:'l:arctic', antarctic:'l:antarctic' };
    let lines = ''; Object.keys(lineNames).forEach(k => {
      const id = lineNames[k], hl = cls[id] || '';
      lines += `<path class="gline ${showLines || hl ? 'vis' : ''} ${hl}" data-vid="g-${k}" d="${M.grat[k]}"/>`;
    });
    // rivers
    let rv = ''; Object.keys(M.rivers).forEach(k => { rv += `<path class="river ${cls['r:' + k] || ''} ${spec.rivers === true ? 'vis' : ''}" data-vid="r-${k}" d="${M.rivers[k].d}"/>`; });
    // labels: continents, oceans (static) and up to 4 dynamic labels (countries, cities, poles)
    let labs = '';
    CONT_ORDER.forEach(k => { const c = M.continents[k], vis = ov && spec.labels !== false || cls['k:' + k] && (ctx.reveal || cls['k:' + k] === 'hq'); labs += `<text class="lab cont ${vis ? 'show' : ''}" data-vid="lk-${k}" x="${c.lx}" y="${c.ly}" style="font-size:${fs(25)}px">${esc(k)}</text>`; });
    M.oceans.forEach(o => { const vis = ov && spec.labels !== false || cls['o:' + o.n] && (ctx.reveal || cls['o:' + o.n] === 'hq'); labs += `<text class="lab sea ${vis ? 'show' : ''}" data-vid="lo-${esc(o.n)}" x="${o.lx}" y="${o.ly}" style="font-size:${fs(21)}px">${esc(o.n)}</text>`; });
    const dyn = [];
    show.forEach(id => {
      if(id[0] === 'c' && S.by[id]){ const l = S.by[id], b = l.bb; if(b) dyn.push({ x:(b[0] + b[2]) / 2, y:(b[1] + b[3]) / 2, t:l.n, hl:cls[id], country:true }); }
      else if(id[0] === 't'){ const c = M.cities[id.slice(2)]; dyn.push({ x:c[0], y:c[1] - 8, t:id.slice(2), hl:cls[id] }); }
      else if(id === 'p:N') dyn.push({ x:M.poles.north[0], y:M.poles.north[1] + 18, t:'North Pole', hl:cls[id] });
      else if(id === 'p:S') dyn.push({ x:M.poles.south[0], y:M.poles.south[1] - 12, t:'South Pole', hl:cls[id] });
      else if(id[0] === 'l'){ const k = Object.keys(lineNames).find(kk => lineNames[kk] === id); const m = M.grat[k].match(/M([\d.]+),([\d.]+)/); if(k === 'prime') dyn.push({ x:500 + 6, y:30, t:'Prime Meridian', hl:cls[id] }); else dyn.push({ x:880, y:+m[2] - 6, t:disp(id), hl:cls[id] }); }
      else if(id[0] === 'h'){ const n = { N:[500, 70], S:[500, 450], E:[760, 260], W:[240, 260] }[id[2]]; dyn.push({ x:n[0], y:n[1], t:S.disp[id], hl:cls[id] }); }
      else if(id[0] === 'r'){ const b = M.rivers[id.slice(2)].bb; dyn.push({ x:(b[0] + b[2]) / 2, y:(b[1] + b[3]) / 2, t:S.disp[id], hl:cls[id] }); }
    });
    function disp(id){ return S.disp[id]; }
    const kl = []; CONT_ORDER.forEach(k => { if(cls['k:' + k] && (ctx.reveal || cls['k:' + k] === 'hq') || ov) kl.push(M.continents[k]); });
    for(let i = 0; i < 4; i++){
      const d = dyn[i]; let y = d ? d.y : 0;
      if(d) kl.forEach(c => { if(Math.abs(d.x - c.lx) < 60 && Math.abs(y - c.ly) < 18 / Math.sqrt(z.s) + 8) y = c.ly + 22 / Math.sqrt(z.s) + 6; });
      labs += `<text class="lab dyn ${d && !(ov && d.country) ? 'show ' + (d.hl || '') : ''}" data-vid="ld-${i}" x="${d ? R(d.x) : 0}" y="${R(y)}" style="font-size:${fs(23)}px">${d ? esc(d.t) : ''}</text>`;
    }
    // poles
    const pole = (k, p) => `<g class="pole ${cls['p:' + k] || ''} ${spec.lines === true ? 'vis' : ''}" data-vid="pl-${k}"><circle cx="${p[0]}" cy="${p[1]}" r="${fs(5)}"/></g>`;
    // markers (country/city emoji), shown for the answer or the overview
    let mk = '';
    arr(spec.markers).forEach((m, i) => {
      let p = null; if(m.c){ const l = M.land.find(x => x.id === m.c || x.n === m.c); if(l && l.bb) p = [(l.bb[0] + l.bb[2]) / 2, (l.bb[1] + l.bb[3]) / 2]; } else if(m.t && M.cities[m.t]) p = M.cities[m.t];
      if(!p) return;
      const lit = (m.c && (cls[(M.land.find(x => x.id === m.c || x.n === m.c) || {}).uid])) || (m.t && cls['t:' + m.t]);
      mk += `<text class="mk ${ov || ctx.reveal || spec.markersAlways ? 'vis' : ''} ${lit || ''}" data-vid="mk-${i}" x="${R(p[0])}" y="${R(p[1])}" style="font-size:${fs(m.size || 22)}px">${m.e}</text>`;
    });
    // arrows between cities
    let ar = ''; arr(spec.arrows).forEach((a2, i) => {
      const A = M.cities[a2.from], B = M.cities[a2.to]; if(!A || !B) return;
      const mx = (A[0] + B[0]) / 2, my = Math.min(A[1], B[1]) - 14;
      ar += `<path class="arrow ${ov || ctx.reveal || spec.arrowsAlways ? 'vis' : ''}" data-vid="ar-${i}" d="M${A[0]},${A[1]} Q${mx},${my} ${B[0]},${B[1]}" style="stroke-width:${fs(3)}px"/>`;
    });
    const cap = caption(ctx, S.disp, q, a, ov, spec);
    const body = `${defs}<rect class="sea-bg" x="0" y="0" width="${W}" height="${H}" data-vid="bg"/><g class="fv-zoom ${on ? 'on' : ''}" data-vid="zoom" style="transform:translate(${R(z.tx)}px,${R(z.ty)}px) scale(${R(z.s * 100) / 100})">${oc}${hemi}${land}${rv}${lines}${ar}${pole('N', M.poles.north)}${pole('S', M.poles.south)}${mk}${labs}</g>`;
    return wrap({ type:'map', key:'map', cls:(on ? 'has-on ' : '') + (colour ? 'ov ' : '') + (ctx.reveal ? 'rev' : ''), vb:`0 0 ${W} ${H}`, body, cap, alt:alt('A map of the world', show, S.disp) });
  },
};

/* ---------- United Kingdom map ---------- */
const ukState = {};
function ukIndex(){
  if(ukState.ix) return ukState;
  const U = FAB_MAPS.uk, ix = [], disp = {};
  const add = (id, n, names) => { disp[id] = n; ix.push({ id, names }); };
  U.nations.forEach(n => add('n:' + n.n, n.n, [n.n]));
  Object.keys(U.capitals).forEach(k => add('cap:' + k, k, [k]));
  add('cap:Dublin', 'Dublin', ['Dublin']);
  Object.keys(U.seas).forEach(k => add('sea:' + k, k, [k]));
  U.around.forEach(a => add('x:' + a.n, a.n, [a.n]));
  add('uk:all', 'The United Kingdom', ['united kingdom', 'uk']);
  add('gb:all', 'Great Britain', ['great britain']);
  ukState.ix = ix; ukState.disp = disp; return ukState;
}
FV.types.uk = {
  index(){ return ukIndex().ix; },
  html(spec, ctx){
    const S = ukIndex(), U = FAB_MAPS.uk;
    const swap = ids => { const o = []; ids.forEach(i => { if(i === 'uk:all') U.nations.forEach(n => o.push('n:' + n.n)); else if(i === 'gb:all') ['England', 'Scotland', 'Wales'].forEach(n => o.push('n:' + n)); else o.push(i); }); return o; };
    const { q, a, show, cls, ov } = prep(S.ix, ctx, swap);
    const on = !ov && show.length > 0;
    let s = U.around.map(x => `<path class="land ctx ${cls['x:' + x.n] || ''}" data-vid="x-${esc(x.n)}" d="${x.d}"/>`).join('');
    const nc = ['k0', 'k4', 'k1', 'k2'];
    s += U.nations.map((n, i) => `<path class="land ${ov ? nc[i] : ''} ${cls['n:' + n.n] || ''} nat" data-vid="n-${esc(n.n)}" d="${n.d}"/>`).join('');
    let labs = '';
    U.nations.forEach(n => { const p = U.nationLabels[n.n], vis = ov || cls['n:' + n.n]; labs += `<text class="lab nat ${vis ? 'show' : ''}" data-vid="ln-${esc(n.n)}" x="${p[0]}" y="${p[1] - (n.n === 'Northern Ireland' ? 20 : 0)}" style="font-size:17px">${esc(n.n)}</text>`; });
    Object.keys(U.seas).forEach(k => { const p = U.seas[k], vis = ov || cls['sea:' + k]; labs += `<ellipse class="seaglow ${cls['sea:' + k] || ''}" data-vid="sg-${esc(k)}" cx="${p[0]}" cy="${p[1] - 4}" rx="62" ry="26"/><text class="lab sea ${vis ? 'show' : ''}" data-vid="ls-${esc(k)}" x="${p[0]}" y="${p[1]}" style="font-size:15px">${esc(k)}</text>`; });
    const caps = Object.assign({}, U.capitals, { Dublin:U.other.Dublin });
    Object.keys(caps).forEach(k => { const p = caps[k], hl = cls['cap:' + k] || '', vis = ov && k !== 'Dublin' || hl; s += `<g class="cap ${vis ? 'show' : ''} ${hl}" data-vid="cp-${k}"><circle cx="${p[0]}" cy="${p[1]}" r="6.5"/><text x="${p[0] + 10}" y="${p[1] + 5}">${esc(k)}</text></g>`; });
    const cap = caption(ctx, S.disp, q, a, ov, spec);
    return wrap({ type:'uk', key:'uk', cls:(on ? 'has-on ' : '') + (ov ? 'ov ' : '') + (ctx.reveal ? 'rev' : ''), vb:`0 0 ${U.w} ${U.h}`, body:`<defs><filter id="fvblur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7"/></filter></defs><rect class="sea-bg" x="0" y="0" width="${U.w}" height="${U.h}" data-vid="bg"/>${s}${labs}`, cap, alt:alt('A map of the United Kingdom', show, S.disp) });
  },
};

/* ---------- Timeline (evenly spaced stops, not to scale) ---------- */
FV.types.time = {
  index(spec){ return spec.nodes.map((n, i) => ({ id:'e:' + i, names:[n.l].concat(n.names || [], n.y ? [n.y] : []) })); },
  html(spec, ctx){
    const nodes = spec.nodes, ix = this.index(spec), disp = {}; nodes.forEach((n, i) => disp['e:' + i] = n.l);
    const { q, a, show, cls, ov } = prep(ix, ctx);
    const n = nodes.length, W = 900, H = 420, pad = 80, step = (W - 2 * pad) / Math.max(1, n - 1), y0 = 215;
    let s = `<rect class="tl-bg" x="0" y="0" width="${W}" height="${H}" data-vid="bg"/><path class="tl-line" d="M${pad - 30},${y0} H${W - pad + 30}" data-vid="tl"/>`;
    nodes.forEach((nd, i) => {
      const x = pad + i * step, up = i % 2 === 0, id = 'e:' + i, hl = cls[id] || '', lit = ov || hl, ly = up ? y0 - 92 : y0 + 118;
      s += `<g class="stop ${hl}" data-vid="s-${i}"><circle class="dot" cx="${R(x)}" cy="${y0}" r="11"/><line class="stem" x1="${R(x)}" y1="${y0 + (up ? -12 : 12)}" x2="${R(x)}" y2="${up ? y0 - 52 : y0 + 52}"/><text class="em" x="${R(x)}" y="${up ? y0 - 62 : y0 + 100}" text-anchor="middle">${nd.e}</text>${nd.y ? `<text class="yr" x="${R(x)}" y="${up ? y0 - 24 : y0 + 36}" text-anchor="middle">${esc(nd.y)}</text>` : ''}<text class="nm ${lit ? 'show' : ''}" x="${R(x)}" y="${ly + (up ? -38 : 36)}" text-anchor="middle">${wrapText(nd.l, 16).map((t, k) => `<tspan x="${R(x)}" dy="${k ? 19 : 0}">${esc(t)}</tspan>`).join('')}</text></g>`;
    });
    if(spec.note) s += `<text class="tl-note" x="${W / 2}" y="${H - 14}" text-anchor="middle">${esc(spec.note)}</text>`;
    return wrap({ type:'time', key:'time:' + esc(spec.id || n), cls:(show.length && !ov ? 'has-on ' : '') + (ctx.reveal ? 'rev' : ''), vb:`0 0 ${W} ${H}`, body:s, cap:caption(ctx, disp, q, a, ov, spec), alt:alt('A timeline', show, disp) });
  },
};
function wrapText(t, n){ const w = String(t).split(' '), out = []; let cur = ''; w.forEach(x => { if((cur + ' ' + x).trim().length > n && cur){ out.push(cur); cur = x; } else cur = (cur + ' ' + x).trim(); }); if(cur) out.push(cur); return out; }
FV.wrapText = wrapText;

/* ---------- Picture cards (emoji tiles) ---------- */
FV.types.cards = {
  index(spec){ return spec.cards.map(c => ({ id:'k:' + c.id, names:[c.t].concat(c.names || []) })); },
  html(spec, ctx){
    const cards = spec.cards, ix = this.index(spec), disp = {}; cards.forEach(c => disp['k:' + c.id] = c.t);
    const { q, a, show, cls, ov } = prep(ix, ctx);
    let body = '';
    if(spec.bar){
      const b = spec.bar, ids = ix.length, bhit = FV.hits(ctx.ask + ' ' + ctx.ans, [{ id:'bar', names:b.names || [] }]).length && !ov;
      body += `<div class="fv-bar ${bhit ? 'on' : ''}" data-vid="bar"><span>${esc(b.from)}</span><i></i><b>${esc(b.label)}</b><i></i><span>${esc(b.to)}</span></div>`;
    }
    body += `<div class="fv-grid" style="--cols:${spec.cols || 4}">` + cards.map(c => { const id = 'k:' + c.id, hl = cls[id] || ''; return `<div class="fv-card ${hl}" data-vid="cd-${esc(c.id)}"><span class="em" aria-hidden="true">${c.e}</span><span class="nm ${ov || hl ? 'show' : ''} ${c.t.length > 10 ? 'lg' : ''}">${esc(c.t)}</span></div>`; }).join('') + '</div>';
    return wrap({ type:'cards', html:true, key:'cards:' + esc(spec.id || cards.length), cls:(show.length && !ov ? 'has-on ' : '') + (ctx.reveal ? 'rev' : ''), body, cap:caption(ctx, disp, q, a, ov, spec), alt:alt('Picture cards', show, disp) });
  },
};

/* ---------- Word tiles: build a word from its parts, or match a word with its partner ----------
   The item brings its own payload (ctx.vx): { items:[{t, e?, role?, hide?}], op:'+'|'≈'|'↔', res:{t, e?}, m:'meaning' } */
FV.types.words = {
  index(){ return []; },
  html(spec, ctx){
    const vx = ctx.vx; if(!vx || !vx.items || !vx.items.length) return '';
    const rev = !!ctx.reveal, op = vx.op || '+', eq = op === '+' ? '=' : op;
    const tile = (it, i, res) => { const hide = res ? !rev : (it.hide && !rev); const cl = 'fv-tile ' + ((it.t || '').length > 14 ? 'long ' : '') + (it.role || '') + (hide ? ' q' : '') + (res ? ' res' : '') + (rev && it.ans ? ' win' : '');
      return `<div class="${cl}" data-vid="${res ? 'res' : 'ti-' + i}">${it.e && !hide ? `<span class="em" aria-hidden="true">${it.e}</span>` : ''}<span class="tx">${hide ? '?' : esc(it.t)}</span></div>`; };
    const parts = vx.items.map((it, i) => i ? `<span class="fv-pair"><span class="fv-op" data-vid="op-${i}">${op === '+' ? '+' : esc(op)}</span>${tile(it, i, false)}</span>` : tile(it, i, false)).join('');
    const sym = op === '+' ? '=' : op === '→' ? '↓' : (vx.items.length > 1 ? '=' : esc(op));
    const row = `<div class="fv-parts${vx.items.length > 2 && vx.items.some(i => i.e || (i.t || '').length > 3) ? ' n3' : ''}">${parts}</div>` + (vx.res ? `<div class="fv-sum"><span class="fv-op" data-vid="eq">${sym}</span>${tile(vx.res, 0, true)}</div>` : '');
    const cap = rev ? (vx.cap || (vx.m ? (vx.res ? `${vx.res.t} means “${vx.m}”` : (vx.w ? `${vx.w} means “${vx.m}”` : vx.m)) : (spec.cap || '')))
      : (vx.c !== undefined ? vx.c : (vx.m && !vx.mh ? `Meaning: ${vx.m}` : (spec.cap || '')));
    const label = vx.items.map(i => i.hide && !rev ? 'a missing part' : i.t).join(op === '+' ? ' plus ' : ' and ') + (rev && vx.res ? ' makes ' + vx.res.t : '');
    return `<div class="fv fv-words ${rev ? 'rev' : ''}" data-vkey="words" role="img" aria-label="${esc(label)}"><div class="fv-body" data-vid="body"><div class="fv-row">${row}</div></div><div class="fv-cap" data-vid="cap">${esc(cap)}</div></div>`;
  },
};

/* ---------- Diagrams: a drawing made of named parts (see vis-dia.js) ---------- */
FV.types.dia = {
  index(spec){ const D = FV.dia[spec.id]; return D ? D.parts.map(p => ({ id:p.id, names:[p.l || p.id].concat(p.names || []) })) : []; },
  html(spec, ctx){
    const D = FV.dia[spec.id]; if(!D) return '';
    const ix = this.index(spec), disp = {}; D.parts.forEach(p => disp[p.id] = p.l || p.id);
    const { q, a, show, cls, ov } = prep(ix, ctx);
    const st = { reveal:!!ctx.reveal, ov, q, a, on:id => !!cls[id] };
    let body = `<defs><filter id="fvblur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7"/></filter></defs>` + (typeof D.bg === 'function' ? D.bg(st) : D.bg || '');
    D.parts.forEach(p => {
      const hl = cls[p.id] || '', lit = (ov && !p.ovHide) || hl, svg = typeof p.svg === 'function' ? p.svg(st) : p.svg;
      const lab = p.lab && p.lab.length ? `<g class="plab ${lit ? 'show' : ''}"><text x="${p.lab[0]}" y="${p.lab[1]}" text-anchor="${p.lab[3] || 'middle'}">${esc(p.lab[2] || p.l || p.id)}</text></g>` : '';
      body += `<g class="part ${p.cls || ''} ${hl}" data-vid="p-${p.id}">${svg}${lab}</g>`;
    });
    if(typeof D.fg === 'function') body += D.fg(st);
    return wrap({ type:'dia', key:'dia:' + spec.id, cls:(show.length && !ov ? 'has-on ' : '') + (ctx.reveal ? 'rev ' : '') + (D.cls || ''), vb:D.vb || '0 0 800 520', body, cap:caption(ctx, disp, q, a, ov, Object.assign({ cap:D.cap }, spec)), alt:alt(D.alt || 'A diagram', show, disp) });
  },
};

/* ---------- Public helpers ---------- */
FV.html = function(spec, ctx){
  if(!spec || !FV.types[spec.t]) return '';
  try { return FV.types[spec.t].html(spec, ctx || {}); } catch(e){ if(window.console) console.warn('FabVis', e); return ''; }
};
FV.index = function(spec){ const T = spec && FV.types[spec.t]; return T ? T.index(spec) : []; };
/* Items (with ask/ans/vq/va) that light up nothing at all, so a teacher or the tests can see which pictures need a hand-written link. */
FV.unlit = function(spec, items){
  const ix = FV.index(spec); const out = [];
  arr(items).forEach(it => { const r = resolve(ix, { ask:it.ask, ans:it.ans, vq:it.vq, va:it.va }); if(!r.q.length && !r.a.length) out.push(it.ask); });
  return out;
};
/* Smooth movement between states. The lesson screen is redrawn from scratch on every tap, so before it is redrawn we take a
   snapshot of how each part of the picture looked, and afterwards we start each part from that look and let CSS carry it to
   the new one (zoom, fade, colour). Nothing runs on a timer; with reduced motion the CSS has no transitions so it just changes. */
const SNAP = ['opacity', 'fill', 'transform', 'backgroundColor', 'borderTopColor'];
FV.snap = function(root){
  const el = root && root.querySelector ? root.querySelector('.fv') : null; if(!el) return null;
  const map = {}; el.querySelectorAll('[data-vid]').forEach(e => { const cs = getComputedStyle(e), o = {}; SNAP.forEach(p => { o[p] = cs[p]; }); map[e.getAttribute('data-vid')] = o; });
  return { key:el.getAttribute('data-vkey'), map };
};
FV.keep = function(root, snap){
  const nw = root && root.querySelector ? root.querySelector('.fv') : null;
  if(!nw || !snap || nw.getAttribute('data-vkey') !== snap.key) return;
  const todo = [];
  nw.querySelectorAll('[data-vid]').forEach(e => {
    const was = snap.map[e.getAttribute('data-vid')]; if(!was) return;
    const cs = getComputedStyle(e), diff = [];
    SNAP.forEach(p => { if(was[p] && was[p] !== cs[p]) diff.push([p, was[p]]); });
    if(diff.length) todo.push([e, diff]);
  });
  if(!todo.length) return;
  todo.forEach(t => t[1].forEach(d => { t[0].style[d[0]] = d[1]; }));
  todo.forEach(t => { getComputedStyle(t[0]).opacity; });
  todo.forEach(t => t[1].forEach(d => { t[0].style[d[0]] = ''; }));
};

/* ---------- Styles ---------- */
const css = `
.fv-words{ background:#FFF8E6; }
.fv-words .fv-body{ padding:26px 14px; min-height:220px; display:flex; align-items:center; justify-content:center; }
.fv-words .fv-row{ display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; }
.fv-parts{ display:flex; align-items:center; justify-content:center; flex-wrap:wrap; gap:10px; }
.fv-pair{ display:inline-flex; align-items:center; gap:10px; }
.fv-parts.n3{ gap:6px; } .fv-parts.n3 .fv-pair{ gap:6px; } .fv-parts.n3 .fv-tile{ min-width:0; padding:8px 10px; border-radius:16px; } .fv-parts.n3 .fv-tile .tx{ font-size:clamp(1.05rem,2.1vw,1.6rem); } .fv-parts.n3 .fv-tile .em{ font-size:clamp(1.7rem,3.4vw,2.5rem); } .fv-parts.n3 .fv-op{ font-size:1.4rem; }
.fv-sum{ display:flex; flex-direction:column; align-items:center; gap:0; } .fv-sum .fv-op{ line-height:1; margin-bottom:2px; }
.fv-tile{ min-width:72px; padding:12px 16px; border-radius:20px; background:#fff; border:4px solid var(--cream-deep,#F6E2B8); text-align:center; display:flex; flex-direction:column; align-items:center; gap:2px; transition:transform .5s, opacity .5s, background-color .5s; }
.fv-tile .em{ font-size:clamp(2.2rem,5vw,3.4rem); line-height:1.1; } .fv-tile .tx{ font-family:var(--disp,Georgia,serif); font-weight:700; font-size:clamp(1.5rem,3vw,2.2rem); color:var(--ink,#314128); }
.fv-tile.pre{ border-color:#E84432; background:#FFEDE8; } .fv-tile.root{ border-color:#437039; background:#EAF6E6; } .fv-tile.suf{ border-color:#325456; background:#E3EEF0; } .fv-tile.part{ border-color:#F3BB17; background:#FFF3C9; }
.fv-tile.q{ border-style:dashed; background:#fff; } .fv-tile.q .tx{ opacity:.45; }
.fv-tile.res{ border-color:#6DBE67; background:#E5F6E1; } .fv-tile.res.q{ border-color:var(--cream-deep,#F6E2B8); background:#fff; }
.fv-words.rev .fv-tile.res{ animation:fvpop .7s ease-out; }
.fv-tile.win{ border-color:#3FAE45; background:#E5F6E1; box-shadow:0 0 0 4px rgba(63,174,69,.28); transform:scale(1.07); }
.fv-tile.long .tx{ font-size:clamp(1.05rem,2.2vw,1.45rem); max-width:11em; }
.fv-op{ font-family:var(--disp,Georgia,serif); font-weight:700; font-size:2rem; color:#7A6B4E; }
@keyframes fvpop{ 0%{ transform:scale(.7); opacity:0; } 60%{ transform:scale(1.1); opacity:1; } 100%{ transform:scale(1); } }
.pw-vis{ align-self:stretch; display:flex; flex-direction:column; min-width:0; min-height:min(540px, calc(100vh - 24px)); }
.pw-vis .fv{ position:sticky; top:8px; flex:1 1 auto; display:flex; flex-direction:column; max-height:calc(100vh - 16px); min-height:0; }
.pw-vis .fv > svg{ flex:1 1 0; min-height:0; height:100%; max-height:none; }
.pw-vis .fv > :not(svg):not(.fv-cap){ flex:1 1 auto; min-height:0; display:flex; align-items:center; justify-content:center; }
.pw-vis .fv > .fv-cap{ flex:none; }
.pw-vis .fv.fv-map, .pw-vis .fv.fv-uk{ background:#CBE9F6; }
.pw-vis .fv{ container-type:inline-size; }
.pw-vis .fv-body > svg{ flex:1 1 auto; width:100%; height:100%; max-height:100%; min-height:0; }
.pw-vis .fv-words .fv-tile .tx{ font-size:clamp(1.4rem, 7.5cqi, 3.2rem); } .pw-vis .fv-words .fv-tile .em{ font-size:clamp(2rem, 10cqi, 4.4rem); }
.pw-vis .fv-words .fv-op{ font-size:clamp(2rem, 8cqi, 3.4rem); }
.pw-vis .mx-em{ font-size:clamp(3.5rem, 18cqi, 8rem); gap:4cqi; } .pw-vis .mx-em:has(> span:only-child){ font-size:clamp(5rem, 34cqi, 12rem); } .pw-vis .mx-em small{ font-size:clamp(1rem, 3.6cqi, 1.5rem); }
.fv-map,.fv-uk{ background:#CBE9F6; }
.fv{ position:relative; width:100%; margin:0 auto; background:#EAF6FB; border:3px solid var(--sunshine,#FFD483); border-radius:22px; overflow:hidden; box-shadow:var(--shadow,0 4px 14px rgba(49,65,40,.14)); font-family:var(--disp,Georgia,serif); }
.fv svg{ display:block; width:100%; height:auto; max-height:72vh; }
.fv-cap{ padding:8px 12px; text-align:center; font-family:var(--disp,Georgia,serif); font-weight:700; font-size:1.12rem; color:var(--ink,#314128); background:#FFFBF3; border-top:3px solid var(--sunshine,#FFD483); min-height:2.4em; }
.fv-cap:empty{ display:none; }
.fv .sea-bg{ fill:#CBE9F6; }
.fv .land{ fill:#F1E7CF; stroke:#fff; stroke-width:.5; vector-effect:non-scaling-stroke; transition:fill .6s, opacity .6s; }
.fv .land.ctx{ fill:#E6DFC8; }
.fv.ov .k0{ fill:#F4A261; } .fv.ov .k1{ fill:#E9C46A; } .fv.ov .k2{ fill:#90BE6D; } .fv.ov .k3{ fill:#F9844A; } .fv.ov .k4{ fill:#43AA8B; } .fv.ov .k5{ fill:#B388EB; } .fv.ov .k6{ fill:#DFE7EF; }
.fv .land.hq{ fill:#F3BB17; animation:fvglow 1.6s ease-in-out infinite; }
.fv .land.ha{ fill:#6DBE67; animation:fvglow 1.6s ease-in-out infinite; }
.fv.has-on .land:not(.hq):not(.ha){ opacity:.62; }
.fv .ocean{ fill:#9ED3EE; opacity:0; transition:opacity .6s; filter:url(#fvblur); }
.fv .ocean.hq{ fill:#F3BB17; opacity:.55; } .fv .ocean.ha{ fill:#4FB3E8; opacity:.75; }
.fv .hemi{ fill:#F3BB17; opacity:0; transition:opacity .6s; } .fv .hemi.hq{ opacity:.28; } .fv .hemi.ha{ opacity:.34; fill:#6DBE67; }
.fv .gline{ fill:none; stroke:#C43524; stroke-width:1.6; stroke-dasharray:6 4; vector-effect:non-scaling-stroke; opacity:0; transition:opacity .6s; }
.fv .gline.vis{ opacity:.8; } .fv .gline.hq,.fv .gline.ha{ opacity:1; stroke-width:3.4; stroke:#E84432; animation:fvdash 1.2s linear infinite; }
.fv .river{ fill:none; stroke:#3E8EDE; stroke-width:2.4; stroke-linecap:round; vector-effect:non-scaling-stroke; opacity:0; transition:opacity .6s; } .fv .river.vis,.fv .river.hq,.fv .river.ha{ opacity:1; } .fv .river.hq,.fv .river.ha{ stroke-width:4.4; }
.fv .pole circle{ fill:#C43524; opacity:0; transition:opacity .6s; } .fv .pole.vis circle,.fv .pole.hq circle,.fv .pole.ha circle{ opacity:1; } .fv .pole.hq circle,.fv .pole.ha circle{ animation:fvglow 1.2s ease-in-out infinite; }
.fv .lab{ font-family:var(--disp,Georgia,serif); font-weight:700; text-anchor:middle; fill:#314128; paint-order:stroke; stroke:rgba(255,255,255,.92); stroke-width:4px; stroke-linejoin:round; opacity:0; transition:opacity .5s, font-size .9s; pointer-events:none; }
.fv .lab.show{ opacity:1; } .fv .lab.sea{ fill:#0B4F7C; font-style:italic; } .fv .lab.dyn.hq{ fill:#7A4D00; } .fv .lab.dyn.ha{ fill:#1F5C1B; }
.fv .mk{ text-anchor:middle; dominant-baseline:central; opacity:0; transition:opacity .6s; } .fv .mk.vis{ opacity:.9; } .fv .mk.hq,.fv .mk.ha{ opacity:1; animation:fvbob 1.3s ease-in-out infinite; }
.fv .arrow{ fill:none; stroke:#E84432; stroke-linecap:round; stroke-dasharray:7 7; opacity:0; transition:opacity .6s; vector-effect:non-scaling-stroke; } .fv .arrow.vis{ opacity:1; animation:fvdash .8s linear infinite; }
.fv .seaglow{ fill:#F3BB17; opacity:0; transition:opacity .6s; filter:url(#fvblur); } .fv .seaglow.hq{ opacity:.6; } .fv .seaglow.ha{ opacity:.7; fill:#6DBE67; }
.fv .cap circle{ fill:#C43524; stroke:#fff; stroke-width:2; } .fv .cap text{ font-family:var(--disp,Georgia,serif); font-weight:700; font-size:13px; fill:#314128; paint-order:stroke; stroke:#fff; stroke-width:3px; } .fv .cap{ opacity:0; transition:opacity .5s; } .fv .cap.show{ opacity:1; } .fv .cap.hq circle,.fv .cap.ha circle{ animation:fvglow 1.1s ease-in-out infinite; r:9; }
.fv .fv-zoom{ transition:transform 1.3s cubic-bezier(.45,.05,.2,1); transform-origin:0 0; }
.fv .tl-bg{ fill:#FFF8E6; } .fv .tl-line{ stroke:#437039; stroke-width:7; stroke-linecap:round; fill:none; }
.fv .stop .dot{ fill:#fff; stroke:#437039; stroke-width:5; transition:fill .5s; } .fv .stop .stem{ stroke:#437039; stroke-width:3; stroke-dasharray:3 4; }
.fv .stop .em{ font-size:44px; transition:font-size .5s; } .fv .stop .yr{ font-family:var(--disp,Georgia,serif); font-weight:700; font-size:20px; fill:#C43524; }
.fv .stop .nm{ font-family:var(--disp,Georgia,serif); font-weight:700; font-size:17px; fill:#314128; text-anchor:middle; opacity:0; transition:opacity .5s; } .fv .stop .nm.show{ opacity:1; }
.fv.has-on .stop:not(.hq):not(.ha){ opacity:.45; } .fv .stop{ transition:opacity .5s; } .fv .stop.hq .dot{ fill:#F3BB17; } .fv .stop.ha .dot{ fill:#6DBE67; } .fv .stop.hq .em,.fv .stop.ha .em{ animation:fvbob 1.2s ease-in-out infinite; }
.fv .tl-note{ font-family:var(--body,Georgia,serif); font-size:15px; fill:#5C6B52; }
.fv-cards .fv-body{ padding:14px; }
.fv .fv-grid{ display:grid; grid-template-columns:repeat(var(--cols,4), minmax(0,1fr)); gap:10px; }
.fv .fv-card{ background:#fff; border:3px solid var(--cream-deep,#F6E2B8); border-radius:18px; padding:10px 6px 8px; text-align:center; display:flex; flex-direction:column; gap:4px; align-items:center; transition:opacity .5s, transform .5s, border-color .5s, background .5s; }
.fv .fv-card .em{ font-size:clamp(2rem,4.4vw,3rem); line-height:1.1; } .fv .fv-card .em svg{ display:block; } .fv .fv-card .nm{ font-weight:700; font-size:clamp(.7rem,1.55vw,.95rem); line-height:1.15; opacity:0; transition:opacity .5s; min-height:2.3em; overflow-wrap:anywhere; hyphens:auto; max-width:100%; display:flex; align-items:center; justify-content:center; } .fv .fv-card .nm.show{ opacity:1; } .fv .fv-card .nm.lg{ font-size:clamp(.58rem,1.1vw,.76rem); overflow-wrap:normal; hyphens:none; }
.fv.has-on .fv-card:not(.hq):not(.ha){ opacity:.5; } .fv .fv-card.hq{ border-color:#F3BB17; background:#FFF3C9; transform:scale(1.07); animation:fvglow2 1.6s ease-in-out infinite; } .fv .fv-card.ha{ border-color:#6DBE67; background:#E5F6E1; transform:scale(1.07); animation:fvglow2 1.6s ease-in-out infinite; }
.fv .fv-bar{ display:flex; align-items:center; gap:8px; background:#FFF3C9; border:3px solid var(--cream-deep,#F6E2B8); border-radius:999px; padding:6px 14px; margin-bottom:12px; font-weight:700; transition:background .5s, border-color .5s; } .fv .fv-bar i{ flex:1; height:6px; border-radius:6px; background:#437039; } .fv .fv-bar.on{ background:#E5F6E1; border-color:#6DBE67; }
.fv .part{ transition:opacity .6s; } .fv.has-on .part:not(.hq):not(.ha){ opacity:.4; }
.fv .part.hq{ filter:drop-shadow(0 0 7px #F3BB17); animation:fvpulse 1.5s ease-in-out infinite; } .fv .part.ha{ filter:drop-shadow(0 0 8px #3FAE45); animation:fvpulse 1.5s ease-in-out infinite; }
.fv .plab{ opacity:0; transition:opacity .5s; pointer-events:none; } .fv .plab.show{ opacity:1; }
.fv .plab text{ font-family:var(--disp,Georgia,serif); font-weight:700; font-size:22px; fill:#314128; paint-order:stroke; stroke:#fff; stroke-width:5px; stroke-linejoin:round; }
.fv .t{ font-family:var(--disp,Georgia,serif); font-weight:700; fill:#314128; } .fv .em{ text-anchor:middle; dominant-baseline:central; }
@keyframes fvglow{ 0%,100%{ filter:brightness(1); } 50%{ filter:brightness(1.18) saturate(1.2); } }
@keyframes fvglow2{ 0%,100%{ box-shadow:0 0 0 0 rgba(243,187,23,.0); } 50%{ box-shadow:0 0 18px 4px rgba(243,187,23,.55); } }
@keyframes fvpulse{ 0%,100%{ opacity:1; } 50%{ opacity:.82; } }
@keyframes fvdash{ to{ stroke-dashoffset:-22; } }
@keyframes fvbob{ 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(-5px); } }
@keyframes fvsway{ 0%,100%{ transform:rotate(-2.5deg); } 50%{ transform:rotate(2.5deg); } }
@keyframes fvrise{ 0%{ transform:translateY(14px); opacity:0; } 25%{ opacity:.9; } 100%{ transform:translateY(-70px); opacity:0; } }
@keyframes fvfall{ 0%{ transform:translateY(-30px); opacity:0; } 20%{ opacity:1; } 100%{ transform:translateY(60px); opacity:0; } }
@keyframes fvwiggle{ 0%,100%{ transform:translate(0,0); } 25%{ transform:translate(3px,-2px); } 50%{ transform:translate(-2px,3px); } 75%{ transform:translate(-3px,-1px); } }
@keyframes fvspin{ to{ transform:rotate(360deg); } }
@keyframes fvwave{ 0%{ transform:translateX(0); } 100%{ transform:translateX(-80px); } }
@keyframes fvflow{ to{ stroke-dashoffset:-40; } }
@keyframes fvtwinkle{ 0%,100%{ opacity:.35; transform:scale(.8); } 50%{ opacity:1; transform:scale(1.15); } }
@keyframes fvshake{ 0%,100%{ transform:translate(0,0); } 20%{ transform:translate(-3px,1px); } 40%{ transform:translate(3px,-2px); } 60%{ transform:translate(-2px,-1px); } 80%{ transform:translate(2px,2px); } }
.fv .a-bob{ animation:fvbob 2.2s ease-in-out infinite; } .fv .a-sway{ animation:fvsway 3s ease-in-out infinite; transform-box:fill-box; transform-origin:50% 100%; }
.fv .a-rise{ animation:fvrise 3.2s ease-in infinite; } .fv .a-fall{ animation:fvfall 1.5s ease-in infinite; } .fv .a-wiggle{ animation:fvwiggle .5s linear infinite; }
.fv .a-spin{ animation:fvspin 8s linear infinite; transform-box:fill-box; transform-origin:50% 50%; } .fv .a-wave{ animation:fvwave 4s linear infinite; } .fv .a-flow{ stroke-dasharray:10 10; animation:fvflow 1.2s linear infinite; }
.fv .a-twinkle{ animation:fvtwinkle 2s ease-in-out infinite; transform-box:fill-box; transform-origin:50% 50%; } .fv .a-shake{ animation:fvshake .45s linear infinite; }
.fv .d1{ animation-delay:-.4s; } .fv .d2{ animation-delay:-.9s; } .fv .d3{ animation-delay:-1.4s; } .fv .d4{ animation-delay:-2s; } .fv .d5{ animation-delay:-2.6s; }
@media (max-width:760px){ .pw-vis{ min-height:0; } .pw-vis .fv{ position:static; max-height:none; } .pw-vis .fv > svg{ flex:none; height:auto; max-height:56vh; } }
@media (prefers-reduced-motion: reduce){ .fv *{ animation:none !important; transition:none !important; } }
`;
const st = document.createElement('style'); st.id = 'fv-css'; st.textContent = css; document.head.appendChild(st);
window.FAB_VIS_LOADED = true;
})();
