/* spotlight.js — "Look here": the teacher's pointer (28 Nov 2026).
   Patrick: "a special teacher glow pen that we can use to point out important content so children's focus is on the key areas ...
   a magnifying glass or very light Bemorefab cloud overlay shape that the content can still be seen through but leaves no doubt on
   where the children should be looking".
   What it is: a soft cloud of light that follows the pointer. Inside the cloud the page is clear with a faint gold glow; outside it the
   page dims a little. Everyone looking at that viewer sees it, because it is drawn in the app itself.
   While it is on it is a pointing tool: taps do not reach the page (a tap parks the cloud, another tap lets it follow again), so it
   also works over Fab Fox World, Fox Blocks and the games. Done, or the Esc key, puts it away.
   How to get it: Shift + L anywhere (not while typing), or the "Look here" button, which shows when the teacher's pointer is switched
   on in the Teachers' area (Admin) or the link carries ?pointer=1. Nothing is saved except that on/off choice. */
(function(){
  'use strict';
  const K = 'fab-pointer', CLOUD = 'M50,112 C18,112 6,90 20,72 C8,46 34,28 56,40 C64,14 106,8 120,36 C148,20 180,44 166,72 C192,80 186,114 156,112 Z';
  const get = () => { try{ return localStorage.getItem(K) === 'on'; }catch(e){ return false; } };
  const S = { on:false, x:0, y:0, s:1.6, park:false, dim:.3 };
  let ov = null, btn = null;
  const place = () => { if(!ov) return; const t = `translate(${S.x - 96 * S.s},${S.y - 62 * S.s}) scale(${S.s})`; ov.querySelectorAll('path').forEach(p => p.setAttribute('transform', t)); };
  function draw(){
    const W = innerWidth, H = innerHeight;
    ov.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true"><defs><mask id="fabSpotMask"><rect width="${W}" height="${H}" fill="#fff"/><path d="${CLOUD}" fill="#000"/></mask>
      <filter id="fabSpotGlow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5"/></filter></defs>
      <rect width="${W}" height="${H}" fill="rgba(43,26,18,${S.dim})" mask="url(#fabSpotMask)"/>
      <path d="${CLOUD}" fill="none" stroke="#F0B913" stroke-width="9" opacity=".75" filter="url(#fabSpotGlow)"/>
      <path d="${CLOUD}" fill="rgba(255,212,131,.14)" stroke="#F0B913" stroke-width="3.5" stroke-linejoin="round"/></svg>
      <div class="fab-spot-bar" role="group" aria-label="Look here"><b>Look here</b><button type="button" data-spot="less">Smaller</button><button type="button" data-spot="more">Bigger</button><button type="button" data-spot="park">${S.park ? 'Follow me' : 'Stay here'}</button><button type="button" data-spot="off" class="go">Done</button></div>`;
    place();
  }
  function on(){
    if(S.on) return; S.on = true; S.park = false; if(!S.x){ S.x = innerWidth / 2; S.y = innerHeight / 2; }
    ov = document.createElement('div'); ov.id = 'fabSpot'; document.body.appendChild(ov); draw();
    ov.addEventListener('pointermove', e => { if(S.park || e.target.closest('.fab-spot-bar')) return; S.x = e.clientX; S.y = e.clientY; place(); });
    ov.addEventListener('pointerdown', e => { if(e.target.closest('.fab-spot-bar')) return; S.x = e.clientX; S.y = e.clientY; S.park = !S.park; draw(); });
    ov.addEventListener('wheel', e => { try{ window.scrollBy(0, e.deltaY); }catch(err){} }, { passive:true });
    ov.addEventListener('click', e => { const b = e.target.closest('[data-spot]'); if(!b) return; const k = b.dataset.spot;
      if(k === 'off') return off(); if(k === 'less') S.s = Math.max(.8, S.s - .3); if(k === 'more') S.s = Math.min(4, S.s + .3); if(k === 'park') S.park = !S.park; draw(); });
    paint();
  }
  function off(){ S.on = false; if(ov){ ov.remove(); ov = null; } paint(); }
  const toggle = () => S.on ? off() : on();
  function paint(){ if(btn){ btn.hidden = !get() || S.on; } }
  function show(v){ try{ localStorage.setItem(K, v ? 'on' : 'off'); }catch(e){} paint(); }
  function build(){
    const st = document.createElement('style'); st.textContent = `
#fabSpot{position:fixed;inset:0;z-index:2147483000;cursor:none;touch-action:none}#fabSpot svg{display:block;position:absolute;inset:0}
.fab-spot-bar{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:center;background:#FFF6E6;border:3px solid #2B1A12;border-radius:16px;padding:8px 12px;cursor:default;font:inherit;max-width:94vw}
.fab-spot-bar b{margin-right:4px}.fab-spot-bar button{font:inherit;font-size:1rem;cursor:pointer;background:#fff;border:2.5px solid #2B1A12;border-radius:12px;padding:6px 14px}.fab-spot-bar button.go{background:#F0B913;font-weight:700}
#fabSpotBtn{position:fixed;left:12px;bottom:12px;z-index:900;font:inherit;font-size:1rem;cursor:pointer;display:inline-flex;align-items:center;gap:8px;background:#FFF6E6;border:3px solid #2B1A12;border-radius:999px;padding:8px 16px}
#fabSpotBtn[hidden]{display:none}#fabSpotBtn svg{width:34px;height:22px}@media print{#fabSpot,#fabSpotBtn{display:none}}`;
    document.head.appendChild(st);
    btn = document.createElement('button'); btn.type = 'button'; btn.id = 'fabSpotBtn'; btn.hidden = true;
    btn.innerHTML = `<svg viewBox="0 0 196 124" aria-hidden="true"><path d="${CLOUD}" fill="#FFD483" stroke="#2B1A12" stroke-width="12" stroke-linejoin="round"/></svg><span>Look here</span>`;
    btn.addEventListener('click', on); document.body.appendChild(btn);
    try{ const q = new URLSearchParams(location.search).get('pointer'); if(q === '1') show(true); else if(q === '0') show(false); }catch(e){}
    document.addEventListener('keydown', e => { const t = e.target, typing = t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable);
      if(e.key === 'Escape' && S.on){ off(); return; } if(!typing && e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey && (e.key === 'L' || e.key === 'l')){ e.preventDefault(); toggle(); } });
    window.addEventListener('resize', () => { if(S.on) draw(); });
    paint();
  }
  window.FabSpot = { on, off, toggle, show, shown:get, state:S };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
