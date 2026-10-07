const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const {chromium}=require('C:/Users/Administrador/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root='X:/MainWP/dist';const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.wasm':'application/wasm','.webm':'video/webm','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{try{let f=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(fs.statSync(f).isDirectory())f=path.join(f,'index.html');const b=fs.readFileSync(f);const range=req.headers.range?.match(/bytes=(\d+)-(\d*)/);if(range){const start=+range[1],end=range[2]?+range[2]:b.length-1;res.writeHead(206,{'Content-Type':types[path.extname(f)]||'application/octet-stream','Content-Range':`bytes ${start}-${end}/${b.length}`,'Accept-Ranges':'bytes'});res.end(b.subarray(start,end+1));}else{res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream'});res.end(b);}}catch{res.writeHead(404);res.end();}});
(async()=>{await new Promise(r=>server.listen(4330,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'}),results=[];const errors=[];
try{const page=await browser.newPage({viewport:{width:1440,height:900}});page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:4330/cv/');await page.waitForTimeout(1500);
assert.equal(await page.locator('.accordion-body img[src]').count(),0);assert.equal(await page.locator('[data-cv-video][src]').count(),0);
await page.locator('.accordion-header').first().click();await page.waitForFunction(()=>[...document.querySelectorAll('.accordion-item.open img')].every(i=>i.complete&&i.naturalWidth>0));
results.push({test:'CV accordion loads on first expansion',passed:true});
await page.locator('.animation-card').first().scrollIntoViewIfNeeded();await page.locator('.animation-card .card-toggle').first().click();await page.waitForFunction(()=>{const v=document.querySelector('[data-cv-video]');return v.getAttribute('src')&&v.readyState>=2&&!v.paused;});
await page.locator('.animation-card .card-toggle').first().click();assert.equal(await page.locator('[data-cv-video]').first().evaluate(v=>v.paused),true);results.push({test:'CV video plays expanded and pauses collapsed',passed:true});
await page.goto('http://127.0.0.1:4330/');await page.waitForTimeout(2000);
const st='/_astro/'+fs.readdirSync(root+'/_astro').find(n=>n.startsWith('ScrollTrigger.'));
const count=()=>page.evaluate(async url=>(await import(url)).t.getAll().length,st);
const counts=[await count()];for(let i=0;i<3;i++){await page.setViewportSize({width:390,height:844});await page.waitForTimeout(450);await page.setViewportSize({width:1440,height:900});await page.waitForTimeout(600);counts.push(await count());}
assert.ok(counts.slice(1).every(n=>n===counts[1]),JSON.stringify(counts));results.push({test:'Home ScrollTrigger counts stable after repeated breakpoint round trips',counts});
await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));await page.waitForTimeout(1600);assert.ok(await page.locator('[data-footer-marquee][data-glass-gpu]').count());await page.screenshot({path:'after-footer.png'});results.push({test:'Deferred footer GPU effect initializes at footer',passed:true});
await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(1800);await page.waitForSelector('[data-hero-distortion]');
await page.evaluate(()=>{window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));});await page.waitForTimeout(200);assert.equal(await page.locator('[data-hero-distortion]').count(),1);results.push({test:'Persisted lifecycle events retain one Hero canvas (synthetic, not actual BFCache)',passed:true});
for(const route of ['/work/wewhale/','/work/groaqua/','/work/exo-environmental/','/work/wwf/','/work/sperm-whales-of-dominica/']){
await page.goto('http://127.0.0.1:4330'+route);await page.waitForTimeout(750);const checkpoints=await page.evaluate(async url=>{const t=(await import(url)).t.getById('case-study-rail');return t?Array.from({length:9},(_,i)=>t.start+(t.end-t.start)*i/8):[];},st);
for(const y of checkpoints){await page.evaluate(y=>scrollTo(0,y),y);await page.waitForTimeout(220);}await page.waitForTimeout(1000);
const broken=await page.locator('img[data-case-src]').evaluateAll(imgs=>imgs.filter(i=>!i.src||!i.complete||!i.naturalWidth).map(i=>i.dataset.caseSrc));assert.deepEqual(broken,[]);results.push({test:route+' full rail media loads',passed:true});
}
const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce',colorScheme:'dark'});const mobile=await context.newPage();mobile.on('pageerror',e=>errors.push(e.message));for(const route of ['/','/about/','/cv/']){await mobile.goto('http://127.0.0.1:4330'+route);await mobile.waitForTimeout(1500);assert.equal(await mobile.evaluate(()=>document.documentElement.dataset.theme),'dark');await mobile.screenshot({path:'reduced-dark-'+(route==='/'?'home':route.replaceAll('/',''))+'.png'});}
assert.deepEqual(errors,[]);results.push({test:'Dark/reduced-motion mobile routes and no uncaught JS errors',passed:true});
}catch(e){results.push({failure:e.stack});process.exitCode=1;}finally{fs.writeFileSync('regression-results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));await browser.close();server.close();}})();
