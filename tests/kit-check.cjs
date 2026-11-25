// Kit check, step 1 (see the kit's INSTRUCTIONS FOR CLAUDE): puts each of the 46 items, then the six test outfits, on the fox through the shop's own
// buttons and saves the try-on stack at exactly 1006 x 1470 in ./kitshots. Then run kit-compare.py to compare them with the kit's worn-previews.
// The worn previews and the sheet are not in this repo (they are only for checking): unzip the kit and set the paths at the top of both files.
// Puts each kit item on the fox through the shop's own buttons and saves the try-on stack at exactly 1006 x 1470, for comparing with worn-previews.
const http=require('http'),fs=require('fs'),path=require('path');const { chromium } = require('playwright');
const ROOT='/home/claude/fab-app';const TYPES={'.css':'text/css','.html':'text/html; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.js':'text/javascript','.json':'application/json','.webp':'image/webp'};
const server=http.createServer((req,res)=>{const p=path.join(ROOT,decodeURIComponent(new URL(req.url,'http://x').pathname));if(!p.startsWith(ROOT)||!fs.existsSync(p)||fs.statSync(p).isDirectory()){res.writeHead(404);res.end();return;}res.writeHead(200,{'Content-Type':TYPES[path.extname(p)]||'application/octet-stream'});fs.createReadStream(p).pipe(res);});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;
  const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});const ctx=await b.newContext({viewport:{width:1400,height:1700},deviceScaleFactor:2});const p=await ctx.newPage();
  p.on('pageerror',e=>console.log('PE',String(e).slice(0,200)));
  await p.goto('http://127.0.0.1:'+port+'/index.html');await p.evaluate(()=>{showScreen('screen-world');try{fabGameMount('screen-world');}catch(e){}});
  const fr=await (await p.$('.game-frame[data-game="world"]')).contentFrame();await fr.waitForFunction(()=>!!window.WORLD&&WORLD.KIT.ready);
  await fr.evaluate(()=>{WORLD.mStuff('fab');});await fr.waitForSelector('.kbox');
  const m=JSON.parse(fs.readFileSync(ROOT+'/shop/manifest.json','utf8')),outfits=JSON.parse(fs.readFileSync('/home/claude/work/kit-outfits.json','utf8'));
  const wearSet=async(ids)=>fr.evaluate(async(ids)=>{const wait=ms=>new Promise(r=>setTimeout(r,ms));const all=document.querySelector('#kitOff [data-off=all]');if(all)all.click();else{const one=document.querySelector('#kitOff [data-off]');if(one)one.click();}
    for(const id of ids){const it=WORLD.KIT.by[id];[...document.querySelectorAll('#stChips button')].find(x=>x.textContent===it.category).click();document.querySelector('.kbox[data-id="'+id+'"]').click();}
    const fox=document.querySelector('#kitFox');fox.style.cssText='position:fixed;left:0;top:0;width:503px;height:735px;z-index:99999;background:#fff';
    const pin=()=>{fox.style.cssText='position:fixed;left:0;top:0;width:503px;height:735px;z-index:99999;background:#fff';};for(let i=0;i<80;i++){if([...fox.querySelectorAll('img')].every(im=>im.complete&&im.naturalWidth))break;await wait(50);}for(let i=0;i<6;i++){await wait(70);pin();}await wait(30);
    const r=fox.getBoundingClientRect(),same=[...fox.querySelectorAll('img')].every(im=>{const q=im.getBoundingClientRect();return Math.abs(q.left-r.left)<.01&&Math.abs(q.top-r.top)<.01&&Math.abs(q.width-r.width)<.01&&Math.abs(q.height-r.height)<.01;});
    return {layers:[...fox.querySelectorAll('img')].map(im=>im.dataset.p),same,size:[r.width,r.height]};},ids);
  const log=[];
  for(const it of m.items){const r=await wearSet([it.id]);await (await fr.$('#kitFox')).screenshot({path:'kitshots/'+it.id+'.png'});log.push({id:it.id,layers:r.layers,same:r.same,size:r.size});}
  for(const [name,ids] of Object.entries(outfits)){const r=await wearSet(ids);await (await fr.$('#kitFox')).screenshot({path:'kitshots/outfit-'+name.replace(/ /g,'-')+'.png'});log.push({outfit:name,layers:r.layers,same:r.same});}
  fs.writeFileSync('kitshots/log.json',JSON.stringify(log));console.log('shots',log.length,'all layers fill the container:',log.every(x=>x.same),'sizes ok:',log.filter(x=>x.size).every(x=>x.size[0]===503&&x.size[1]===735));
  await b.close();server.close();})();
