/* vis-math.js — pictures that come with each question (FabVis type "mx").
   A pack step sets params.visual = { t:'mx' } and each item carries its own picture in vx, for example
   { k:'clock', h:3, m:30 }, { k:'coins', p:[20, 5, 1] }, { k:'ruler', len:7 }, { k:'shape', s:'hexagon' },
   { k:'bars', data:[['🍎', 5], ['🍌', 3]] }, { k:'sent', w:['The', 'cat', 'sat', '.'], hl:[1] }, { k:'text', title, t, find }.
   The picture models the idea first (I do), then the child answers. Drafts for a teacher to check. */
(function(){
  'use strict';
  const FV = window.FabVis; if(!FV) return;
  const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const R = n => Math.round(n * 10) / 10;
  const css = `
.fv-mx .fv-body{display:flex;justify-content:center;align-items:center}
.fv-mx svg{width:100%;height:auto;max-height:46vh;display:block}
.fv-mx .ink{fill:#314128}.fv-mx text.mxl{font:700 22px Aleo,Georgia,serif;fill:#314128;display:inline}.fv-mx text.mxs{font:700 18px Aleo,Georgia,serif;fill:#314128;display:inline}
.fv-mx .ans{opacity:0;transition:opacity .5s}.fv-mx.rev .ans{opacity:1}
.fv-mx .q{fill:#F3BB17}.fv-mx.rev .a{fill:#7fd36b}
.mx-sent{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;padding:14px}
.mx-sent span{background:#fff;border-radius:12px;padding:8px 12px;font:700 clamp(1.05rem,2.6vw,1.5rem) Aleo,Georgia,serif;box-shadow:0 3px 0 rgba(43,26,18,.16);color:#314128}
.mx-sent span.p{padding:8px 8px;min-width:1.2em;text-align:center}
.mx-sent span.hl{background:#ffe08a;outline:3px solid #F3BB17}.fv-mx.rev .mx-sent span.ok{background:#c8f0b8;outline:3px solid #3FAE45}
.mx-sent span.gap{background:#fff7e0;border:3px dashed #F3BB17;color:#c47f00}
.mx-text{background:#fffdf6;border-radius:16px;padding:14px 18px;box-shadow:inset 0 0 0 2px #f0e2c8;font:400 clamp(1rem,2.3vw,1.25rem)/1.55 Aleo,Georgia,serif;color:#314128;max-width:640px;text-align:left}
.mx-text b{display:block;margin-bottom:6px;font-size:1.1em}.mx-text p{margin:0}.mx-text mark{background:transparent;color:inherit;transition:background .5s}.fv-mx.rev .mx-text mark{background:#c8f0b8;border-radius:6px}
.mx-em{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;align-items:center;padding:10px;font-size:clamp(3rem,9vw,5.5rem);line-height:1}
.mx-em small{display:block;font:700 1rem Aleo,Georgia,serif;text-align:center;color:#314128}.mx-em span{text-align:center}
`;
  const st = document.createElement('style'); st.id = 'fv-mx-css'; st.textContent = css; document.head.appendChild(st);
  const svg = (vb, body) => `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`;
  const T = (x, y, s, cls, anchor) => `<text class="${cls === 'sml' ? 'mxs' : 'mxl'}" x="${R(x)}" y="${R(y)}" text-anchor="${anchor || 'middle'}">${E(s)}</text>`;
  const two = n => String(n).padStart(2, '0');

  const D = {
    clock(v){
      const cx = 200, cy = 170, r = 140, h = Number(v.h) || 12, m = Number(v.m) || 0;
      let s = `<circle cx="${cx}" cy="${cy}" r="${r + 10}" fill="#E84432"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="#fffdf6"/>`;
      for(let i = 0; i < 60; i++){ const a = i * 6 * Math.PI / 180, l = i % 5 ? 8 : 16; s += `<line x1="${R(cx + Math.sin(a) * (r - 4))}" y1="${R(cy - Math.cos(a) * (r - 4))}" x2="${R(cx + Math.sin(a) * (r - 4 - l))}" y2="${R(cy - Math.cos(a) * (r - 4 - l))}" stroke="#314128" stroke-width="${i % 5 ? 2 : 4}"/>`; }
      for(let i = 1; i <= 12; i++){ const a = i * 30 * Math.PI / 180; s += T(cx + Math.sin(a) * (r - 38), cy - Math.cos(a) * (r - 38) + 8, i); }
      const ha = ((h % 12) + m / 60) * 30 * Math.PI / 180, ma = m * 6 * Math.PI / 180;
      s += `<line x1="${cx}" y1="${cy}" x2="${R(cx + Math.sin(ha) * 70)}" y2="${R(cy - Math.cos(ha) * 70)}" stroke="#325456" stroke-width="12" stroke-linecap="round"/>`;
      s += `<line x1="${cx}" y1="${cy}" x2="${R(cx + Math.sin(ma) * 112)}" y2="${R(cy - Math.cos(ma) * 112)}" stroke="#E84432" stroke-width="7" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="9" fill="#314128"/>`;
      if(v.dig !== false) s += `<g class="ans"><rect x="140" y="322" width="120" height="34" rx="10" fill="#314128"/>${`<text x="200" y="347" text-anchor="middle" style="font:700 24px monospace;fill:#7fd36b">${(h % 12 || 12)}:${two(m)}</text>`}</g>`;
      return svg('0 0 400 362', s);
    },
    coins(v){
      const C = { 1:['#C87533', 34, '1p'], 2:['#C87533', 44, '2p'], 5:['#C9CCD1', 30, '5p'], 10:['#C9CCD1', 40, '10p'], 20:['#C9CCD1', 37, '20p', 7], 50:['#C9CCD1', 44, '50p', 7], 100:['#D9B23F', 41, '£1', 12], 200:['#C9CCD1', 47, '£2', 0, '#D9B23F'] };
      const list = (v.p || []).slice(0, 10); let x = 20, y = 70, s = '', rowH = 0; const W = 640;
      list.forEach(c => {
        const d = C[c] || C[1], rr = d[1]; if(x + rr * 2 > W - 10){ x = 20; y += rowH + 22; rowH = 0; }
        const cx = x + rr, cy = y; rowH = Math.max(rowH, rr * 2);
        const poly = n => Array.from({ length:n }, (_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return R(cx + Math.cos(a) * rr) + ',' + R(cy + Math.sin(a) * rr); }).join(' ');
        if(d[4]) s += `<circle cx="${cx}" cy="${cy}" r="${rr}" fill="${d[4]}" stroke="#7a6a3a" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="${rr * .7}" fill="${d[0]}"/>`;
        else if(d[3]) s += `<polygon points="${poly(d[3])}" fill="${d[0]}" stroke="#6b6f75" stroke-width="2"/>`;
        else s += `<circle cx="${cx}" cy="${cy}" r="${rr}" fill="${d[0]}" stroke="${c < 5 ? '#8a4a1e' : '#6b6f75'}" stroke-width="2"/>`;
        s += T(cx, cy + 7, d[2], 'lab'); x += rr * 2 + 16;
      });
      const H = y + rowH / 2 + 30;
      if(v.tot != null) s += `<g class="ans">${T(W / 2, H + 8, 'Total: ' + v.tot)}</g>`;
      return svg(`0 0 ${W} ${R(H + (v.tot != null ? 24 : 0))}`, s);
    },
    ruler(v){
      const max = v.max || 10, len = Number(v.len) || 0, u = v.u || 'cm', W = 680, x0 = 40, sc = (W - 80) / max;
      let s = `<rect x="${x0 - 14}" y="130" width="${R(max * sc + 28)}" height="70" rx="6" fill="#F3D27A" stroke="#a88a3a" stroke-width="2"/>`;
      for(let i = 0; i <= max * (v.mm ? 10 : 2); i++){ const per = v.mm ? 10 : 2, x = x0 + i * sc / per, big = i % per === 0; s += `<line x1="${R(x)}" y1="130" x2="${R(x)}" y2="${big ? 160 : 146}" stroke="#314128" stroke-width="${big ? 2.5 : 1.2}"/>`; if(big) s += T(x, 186, i / per, 'sml'); }
      s += T(x0 + max * sc + 4, 186, u, 'sml', 'start');
      const e = v.e || '✏️';
      s += `<rect x="${x0}" y="78" width="${R(len * sc)}" height="30" rx="8" fill="${v.col || '#5aa9e6'}" stroke="#314128" stroke-width="2"/><polygon points="${R(x0 + len * sc)},78 ${R(x0 + len * sc + 18)},93 ${R(x0 + len * sc)},108" fill="#f6dcb4" stroke="#314128" stroke-width="2"/>`;
      s += `<line x1="${x0}" y1="66" x2="${x0}" y2="128" stroke="#314128" stroke-dasharray="4 4"/><line x1="${R(x0 + len * sc)}" y1="66" x2="${R(x0 + len * sc)}" y2="128" stroke="#314128" stroke-dasharray="4 4"/>`;
      s += `<g class="ans">${T(x0 + len * sc / 2, 54, len + ' ' + u)}</g>`;
      return svg('0 0 680 210', s.replace('✏️', E(e)));
    },
    line(v){
      const min = v.min || 0, max = v.max || 10, step = v.step || 1, lab = v.lab || step, W = 680, x0 = 50, sc = (W - 100) / (max - min), val = Number(v.v);
      let s = `<line x1="${x0}" y1="120" x2="${x0 + (max - min) * sc}" y2="120" stroke="#314128" stroke-width="4" stroke-linecap="round"/>`;
      for(let n = min; n <= max + 1e-9; n += step){ const x = x0 + (n - min) * sc, big = Math.abs((n - min) / lab - Math.round((n - min) / lab)) < 1e-6; s += `<line x1="${R(x)}" y1="${big ? 100 : 108}" x2="${R(x)}" y2="${big ? 140 : 132}" stroke="#314128" stroke-width="${big ? 3 : 1.6}"/>`; if(big) s += T(x, 168, R(n) + (v.u && n === max ? ' ' + v.u : ''), 'sml'); }
      if(!isNaN(val)){ const x = x0 + (val - min) * sc; s += `<polygon class="q" points="${R(x - 14)},64 ${R(x + 14)},64 ${R(x)},94" stroke="#314128" stroke-width="2"/><g class="ans">${T(x, 52, R(val) + (v.u ? ' ' + v.u : ''))}</g>`; }
      if(v.ttl) s += T(W / 2, 200, v.ttl, 'sml');
      return svg('0 0 680 210', s);
    },
    jug(v){
      const max = v.max || 1000, step = v.step || 100, lab = v.lab || step * 2, val = Number(v.v) || 0, u = v.u || 'ml';
      const x0 = 150, y0 = 40, w = 200, hgt = 300, lvl = y0 + hgt - hgt * val / max;
      let s = `<path d="M${x0 + w},${y0 + 40} C${x0 + w + 70},${y0 + 40} ${x0 + w + 70},${y0 + 170} ${x0 + w},${y0 + 170}" fill="none" stroke="#9fb3c8" stroke-width="16"/>`;
      s += `<rect x="${x0}" y="${R(lvl)}" width="${w}" height="${R(y0 + hgt - lvl)}" fill="#7cc4f2" opacity=".85"/><rect x="${x0}" y="${y0}" width="${w}" height="${hgt}" rx="10" fill="none" stroke="#5f7a96" stroke-width="5"/>`;
      for(let n = 0; n <= max; n += step){ const y = y0 + hgt - hgt * n / max, big = n % lab === 0; s += `<line x1="${x0}" y1="${R(y)}" x2="${x0 + (big ? 44 : 26)}" y2="${R(y)}" stroke="#314128" stroke-width="${big ? 3 : 1.6}"/>`; if(big) s += T(x0 - 10, y + 6, n + (n === max ? ' ' + u : ''), 'sml', 'end'); }
      s += `<g class="ans">${T(x0 + w / 2, lvl - 12, val + ' ' + u)}</g>`;
      return svg('0 0 460 360', s);
    },
    shape(v){
      const nm = v.s, cx = 220, cy = 170, r = 120, fill = v.col || '#9bd3f5', st = 'stroke="#314128" stroke-width="4" stroke-linejoin="round"';
      const reg = (n, rot) => `<polygon points="${Array.from({ length:n }, (_, i) => { const a = (rot || -Math.PI / 2) + i * 2 * Math.PI / n; return R(cx + Math.cos(a) * r) + ',' + R(cy + Math.sin(a) * r); }).join(' ')}" fill="${fill}" ${st}/>`;
      const map = {
        triangle:() => reg(3), square:() => reg(4, -Math.PI / 4), pentagon:() => reg(5), hexagon:() => reg(6), heptagon:() => reg(7), octagon:() => reg(8),
        rectangle:() => `<rect x="${cx - 160}" y="${cy - 80}" width="320" height="160" fill="${fill}" ${st}/>`,
        circle:() => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${st}/>`,
        oval:() => `<ellipse cx="${cx}" cy="${cy}" rx="${r + 40}" ry="${r - 40}" fill="${fill}" ${st}/>`,
        semicircle:() => `<path d="M${cx - r},${cy + 40} A${r},${r} 0 0 1 ${cx + r},${cy + 40} Z" fill="${fill}" ${st}/>`,
        kite:() => `<polygon points="${cx},${cy - 140} ${cx + 90},${cy - 30} ${cx},${cy + 140} ${cx - 90},${cy - 30}" fill="${fill}" ${st}/>`,
        rhombus:() => `<polygon points="${cx},${cy - 130} ${cx + 100},${cy} ${cx},${cy + 130} ${cx - 100},${cy}" fill="${fill}" ${st}/>`,
        parallelogram:() => `<polygon points="${cx - 150},${cy + 80} ${cx + 90},${cy + 80} ${cx + 150},${cy - 80} ${cx - 90},${cy - 80}" fill="${fill}" ${st}/>`,
        trapezium:() => `<polygon points="${cx - 160},${cy + 80} ${cx + 160},${cy + 80} ${cx + 90},${cy - 80} ${cx - 90},${cy - 80}" fill="${fill}" ${st}/>`,
        'right-angled triangle':() => `<polygon points="${cx - 120},${cy + 100} ${cx + 120},${cy + 100} ${cx - 120},${cy - 110}" fill="${fill}" ${st}/><rect x="${cx - 120}" y="${cy + 76}" width="24" height="24" fill="none" stroke="#314128" stroke-width="3"/>`,
        cube:() => `<polygon points="${cx - 100},${cy - 40} ${cx + 40},${cy - 40} ${cx + 40},${cy + 100} ${cx - 100},${cy + 100}" fill="${fill}" ${st}/><polygon points="${cx - 100},${cy - 40} ${cx - 40},${cy - 100} ${cx + 100},${cy - 100} ${cx + 40},${cy - 40}" fill="#c8e8fa" ${st}/><polygon points="${cx + 40},${cy - 40} ${cx + 100},${cy - 100} ${cx + 100},${cy + 40} ${cx + 40},${cy + 100}" fill="#6fb8e6" ${st}/>`,
        cuboid:() => `<polygon points="${cx - 160},${cy - 30} ${cx + 60},${cy - 30} ${cx + 60},${cy + 90} ${cx - 160},${cy + 90}" fill="${fill}" ${st}/><polygon points="${cx - 160},${cy - 30} ${cx - 100},${cy - 90} ${cx + 120},${cy - 90} ${cx + 60},${cy - 30}" fill="#c8e8fa" ${st}/><polygon points="${cx + 60},${cy - 30} ${cx + 120},${cy - 90} ${cx + 120},${cy + 30} ${cx + 60},${cy + 90}" fill="#6fb8e6" ${st}/>`,
        sphere:() => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${st}/><ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="30" fill="none" stroke="#314128" stroke-width="2" stroke-dasharray="8 6"/><circle cx="${cx - 40}" cy="${cy - 50}" r="22" fill="#fff" opacity=".6"/>`,
        cylinder:() => `<path d="M${cx - 90},${cy - 100} V${cy + 100} A90,28 0 0 0 ${cx + 90},${cy + 100} V${cy - 100}" fill="${fill}" ${st}/><ellipse cx="${cx}" cy="${cy - 100}" rx="90" ry="28" fill="#c8e8fa" ${st}/>`,
        cone:() => `<path d="M${cx},${cy - 130} L${cx + 100},${cy + 100} A100,30 0 0 1 ${cx - 100},${cy + 100} Z" fill="${fill}" ${st}/><path d="M${cx - 100},${cy + 100} A100,30 0 0 1 ${cx + 100},${cy + 100}" fill="none" stroke="#314128" stroke-width="2" stroke-dasharray="8 6"/>`,
        'square-based pyramid':() => `<polygon points="${cx - 130},${cy + 80} ${cx + 50},${cy + 80} ${cx},${cy - 130}" fill="${fill}" ${st}/><polygon points="${cx + 50},${cy + 80} ${cx + 130},${cy + 30} ${cx},${cy - 130}" fill="#6fb8e6" ${st}/>`,
        'triangular prism':() => `<polygon points="${cx - 150},${cy + 80} ${cx - 50},${cy + 80} ${cx - 100},${cy - 20}" fill="#c8e8fa" ${st}/><polygon points="${cx - 50},${cy + 80} ${cx + 150},${cy + 30} ${cx + 100},${cy - 70} ${cx - 100},${cy - 20}" fill="${fill}" ${st}/>`
      };
      const body = (map[nm] || map.circle)();
      return svg('0 0 440 340', body + (v.lbl ? `<g class="ans">${T(cx, 334, v.lbl)}</g>` : ''));
    },
    rect(v){
      const w = Number(v.w) || 4, hh = Number(v.h) || 3, u = v.u || 'cm', sc = Math.min(48, 520 / w, 260 / hh), x0 = 80, y0 = 50, W = w * sc, H = hh * sc;
      let s = `<rect x="${x0}" y="${y0}" width="${R(W)}" height="${R(H)}" fill="#c8e8fa" stroke="#314128" stroke-width="4"/>`;
      if(v.grid){ for(let i = 1; i < w; i++) s += `<line x1="${R(x0 + i * sc)}" y1="${y0}" x2="${R(x0 + i * sc)}" y2="${R(y0 + H)}" stroke="#7aa7c7" stroke-width="1.5"/>`; for(let j = 1; j < hh; j++) s += `<line x1="${x0}" y1="${R(y0 + j * sc)}" x2="${R(x0 + W)}" y2="${R(y0 + j * sc)}" stroke="#7aa7c7" stroke-width="1.5"/>`; }
      else { s += T(x0 + W / 2, y0 - 12, w + ' ' + u) + T(x0 + W / 2, y0 + H + 30, w + ' ' + u) + T(x0 - 12, y0 + H / 2 + 7, hh + ' ' + u, 'mxl', 'end') + T(x0 + W + 12, y0 + H / 2 + 7, hh + ' ' + u, 'mxl', 'start'); }
      return svg(`0 0 ${R(x0 * 2 + W + 40)} ${R(y0 + H + 50)}`, s);
    },
    angle(v){
      const d = Number(v.d) || 90, cx = 200, cy = 260, L = 200, a = -d * Math.PI / 180;
      let s = `<line x1="${cx}" y1="${cy}" x2="${cx + L}" y2="${cy}" stroke="#314128" stroke-width="8" stroke-linecap="round"/><line x1="${cx}" y1="${cy}" x2="${R(cx + Math.cos(a) * L)}" y2="${R(cy + Math.sin(a) * L)}" stroke="#E84432" stroke-width="8" stroke-linecap="round"/>`;
      if(d === 90) s += `<rect x="${cx}" y="${cy - 40}" width="40" height="40" fill="#ffe08a" stroke="#314128" stroke-width="3"/>`;
      else { const r = 60, large = d > 180 ? 1 : 0; s += `<path d="M${cx + r},${cy} A${r},${r} 0 ${large} 0 ${R(cx + Math.cos(a) * r)},${R(cy + Math.sin(a) * r)}" fill="none" stroke="#F3BB17" stroke-width="7"/>`; }
      s += `<circle cx="${cx}" cy="${cy}" r="8" fill="#314128"/>`;
      if(v.lbl) s += `<g class="ans">${T(cx + 150, cy + 50, v.lbl)}</g>`;
      return svg('0 0 460 330', s);
    },
    bars(v){
      const data = v.data || [], max = v.max || Math.max(...data.map(x => x[1])) || 1, step = v.step || 1, W = 640, H = 330, x0 = 70, y0 = 270, bh = 230, bw = Math.min(90, (W - x0 - 30) / data.length - 20);
      let s = '';
      for(let n = 0; n <= max; n += step){ const y = y0 - bh * n / max; s += `<line x1="${x0}" y1="${R(y)}" x2="${W - 20}" y2="${R(y)}" stroke="#e7dcc6" stroke-width="2"/>${T(x0 - 12, y + 6, n, 'sml', 'end')}`; }
      data.forEach((d, i) => { const x = x0 + 20 + i * (bw + 20), hh = bh * d[1] / max, hl = (v.hl || []).indexOf(i) >= 0;
        s += `<rect class="${hl ? 'q' : ''}" x="${R(x)}" y="${R(y0 - hh)}" width="${R(bw)}" height="${R(hh)}" rx="6" fill="${hl ? '#F3BB17' : ['#5aa9e6', '#7fb069', '#ef915e', '#9b6bd1', '#ff8fab', '#E84432'][i % 6]}" stroke="#314128" stroke-width="2"/>`;
        s += `<text x="${R(x + bw / 2)}" y="${y0 + 36}" text-anchor="middle" style="font-size:${String(d[0]).length > 3 ? 16 : 28}px" class="mxs">${E(d[0])}</text><g class="ans">${T(x + bw / 2, y0 - hh - 8, d[1], 'sml')}</g>`; });
      s += `<line x1="${x0}" y1="${y0}" x2="${W - 20}" y2="${y0}" stroke="#314128" stroke-width="3"/><line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y0 - bh - 10}" stroke="#314128" stroke-width="3"/>`;
      if(v.ttl) s += T(W / 2, 22, v.ttl, 'sml');
      return svg(`0 0 ${W} ${H}`, s);
    },
    picto(v){
      const data = v.data || [], key = v.key || 1, e = v.e || '⭐'; let s = '', y = 40;
      data.forEach((d, i) => { s += T(20, y + 10, d[0], 'lab', 'start'); const n = d[1] / key; for(let j = 0; j < Math.floor(n); j++) s += `<text x="${150 + j * 44}" y="${y + 14}" style="font-size:34px">${e}</text>`; if(n % 1) s += `<text x="${150 + Math.floor(n) * 44}" y="${y + 14}" style="font-size:34px;opacity:.5">½</text>`; y += 52; });
      s += T(20, y + 16, 'Key: ' + e + ' = ' + key, 'sml', 'start');
      return svg(`0 0 640 ${y + 30}`, s);
    },
    tally(v){
      const n = Number(v.n) || 0; let s = '', x = 30;
      for(let g = 0; g < Math.ceil(n / 5); g++){ const k = Math.min(5, n - g * 5); for(let i = 0; i < Math.min(4, k); i++) s += `<line x1="${x + i * 22}" y1="40" x2="${x + i * 22}" y2="140" stroke="#314128" stroke-width="7" stroke-linecap="round"/>`; if(k === 5) s += `<line x1="${x - 12}" y1="120" x2="${x + 78}" y2="58" stroke="#E84432" stroke-width="7" stroke-linecap="round"/>`; x += 120; }
      return svg(`0 0 ${Math.max(200, x + 10)} 180`, s + `<g class="ans">${T(Math.max(200, x + 10) / 2, 172, n, 'sml')}</g>`);
    },
    grid(v){
      const n = v.n || 6, sc = 48, x0 = 50, y0 = 50 + n * sc; let s = '';
      for(let i = 0; i <= n; i++){ s += `<line x1="${x0 + i * sc}" y1="${y0}" x2="${x0 + i * sc}" y2="${y0 - n * sc}" stroke="#e0d3b8" stroke-width="2"/><line x1="${x0}" y1="${y0 - i * sc}" x2="${x0 + n * sc}" y2="${y0 - i * sc}" stroke="#e0d3b8" stroke-width="2"/>${T(x0 + i * sc, y0 + 26, i, 'sml')}${i ? T(x0 - 16, y0 - i * sc + 6, i, 'sml') : ''}`; }
      s += `<line x1="${x0}" y1="${y0}" x2="${x0 + n * sc + 10}" y2="${y0}" stroke="#314128" stroke-width="3"/><line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y0 - n * sc - 10}" stroke="#314128" stroke-width="3"/>`;
      (v.pts || []).forEach(p => { const x = x0 + p[0] * sc, y = y0 - p[1] * sc; s += `<circle cx="${x}" cy="${y}" r="10" fill="${p[3] || '#E84432'}" stroke="#314128" stroke-width="2"/>${T(x + 18, y - 12, p[2] || '', 'lab', 'start')}<g class="ans">${T(x + 18, y + 26, '(' + p[0] + ', ' + p[1] + ')', 'sml', 'start')}</g>`; });
      return svg(`0 0 ${x0 + n * sc + 70} ${y0 + 44}`, s);
    },
    sent(v){
      const hl = v.hl || [], ok = v.ok || [];
      return `<div class="mx-sent">${(v.w || []).map((w, i) => `<span class="${/^[.,!?;:'"“”‘’()-]$/.test(w) ? 'p ' : ''}${w === '_' ? 'gap ' : ''}${hl.indexOf(i) >= 0 ? 'hl ' : ''}${ok.indexOf(i) >= 0 ? 'ok' : ''}">${w === '_' ? '?' : E(w)}</span>`).join('')}</div>`;
    },
    text(v){
      let t = E(v.t || '');
      if(v.find){ const f = E(v.find), i = t.indexOf(f); if(i >= 0) t = t.slice(0, i) + '<mark>' + f + '</mark>' + t.slice(i + f.length); }
      return `<div class="mx-text">${v.title ? '<b>' + E(v.title) + '</b>' : ''}<p>${t}</p></div>`;
    },
    em(v){
      const list = v.row || [[v.e, v.c]];
      return `<div class="mx-em">${list.map(x => Array.isArray(x) ? `<span>${E(x[0])}${x[1] ? '<small>' + E(x[1]) + '</small>' : ''}</span>` : `<span>${E(x)}</span>`).join('')}</div>`;
    }
  };
  FV.types.mx = {
    index(){ return []; },
    html(spec, ctx){
      const v = ctx.vx; if(!v || !D[v.k]) return '';
      const rev = !!ctx.reveal, body = D[v.k](v);
      const cap = rev ? (v.rc || v.c || spec.cap || '') : (v.c || spec.cap || '');
      return `<div class="fv fv-mx ${rev ? 'rev' : ''}" data-vkey="mx-${E(v.k)}" role="img" aria-label="${E(v.alt || cap || 'A picture to help with the question')}"><div class="fv-body" data-vid="body">${body}</div>${cap ? `<div class="fv-cap" data-vid="cap">${E(cap)}</div>` : ''}</div>`;
    }
  };
  FV.mxKinds = Object.keys(D);
})();
