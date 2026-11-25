const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {chromium, webkit, devices} = require(process.env.PLAYWRIGHT_PATH || 'playwright');

const root = process.env.SG_TEST_ROOT || path.resolve(__dirname, '..');
const games = ['slice-master','highway-rush','color-switch','hole-city','burger-rush'];
const portrait = new Set(['highway-rush','color-switch']);
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webmanifest':'application/manifest+json'};
let disconnected=false;
const server=http.createServer((req,res)=>{
  if(disconnected){req.socket.destroy();return;}
  const url=new URL(req.url,'http://localhost');
  const name=url.pathname.replace(/^\/sg\//,'');
  const file=path.join(root,name.endsWith('/')||!name?name+'index.html':name);
  const stream=fs.createReadStream(file);
  stream.on('open',()=>{res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');stream.pipe(res);});
  stream.on('error',()=>{res.writeHead(404);res.end('Not found');});
});
function errors(page){
  const result=[];
  page.on('pageerror',error=>result.push(error.message));
  page.on('response',response=>{if(response.status()>=400)result.push(response.status()+' '+response.url());});
  return result;
}
async function pick(page,id){await page.locator('[data-game="'+id+'"] .game-card').click();}
async function tap(scope,text){await scope.getByRole('button',{name:text,exact:true}).tap();}
async function closeDetails(page){await page.getByRole('button',{name:'Close game details'}).click();}
async function shot(page,filename){
  if(process.env.SG_SCREENSHOTS)await page.screenshot({path:path.join(process.env.SG_SCREENSHOTS,filename+'.png')});
}
const mobile=function(device,landscape){
  const {defaultBrowserType,...prefs}=devices[device];
  if(landscape){
    for(const key of ['viewport','screen']){
      const original=prefs[key];if(original)prefs[key]={width:original.height,height:original.width};
    }
  }
  return prefs;
};
async function testMac(base){
  const browser=await chromium.launch();
  try{
    const page=await browser.newPage();
    const seen=errors(page);
    await page.goto(base);
    await page.locator('#mobile-category').click();
    assert.equal(await page.locator('.game-tile').count(),5);
    for(const game of games){
      await pick(page,game);
      assert.equal(await page.locator('#play').textContent(),'Mobile Exclusive');
      assert(await page.locator('#play').isDisabled());
      assert.equal(await page.locator('#availability').textContent(),'Exclusively available on iPhone and iPad.');
      assert.deepEqual(await page.locator('#game-cover').evaluate(async img=>{await img.decode();return [img.naturalWidth,img.naturalHeight];}),[2048,768]);
      assert(await page.locator('#player').isHidden());
      await closeDetails(page);
    }
    await shot(page,'mac-category');
    await page.locator('#mobile-category').click();
    assert(await page.locator('.game-tile').count()>20);
    await pick(page,'eight-ball');
    assert(await page.locator('#play').isEnabled());
    await page.locator('#play').click();
    await page.locator('#player-frame iframe').waitFor();
    await page.getByRole('button',{name:'Back to SG',exact:true}).click();
    assert(await page.locator('#player').isHidden());
    for(const game of games){
      await page.goto(base+'games/'+game+'/');
      assert.equal(await page.locator('#menu-panel h2').textContent(),'Mobile Exclusive');
      assert.equal(await page.getByRole('button',{name:'Play',exact:true}).count(),0);
    }
    assert.deepEqual(seen,[]);
  }finally{await browser.close();}
}
async function testMobile(browser,base,device,landscape,ids,offline){
  const context=await browser.newContext(mobile(device,landscape));
  try{
    let page=await context.newPage(),seen=errors(page);
    await page.goto(base);
    const deviceInfo = await page.evaluate(() => ({mobile:window.SGAppleMobile(),ua:navigator.userAgent,platform:navigator.platform,touch:navigator.maxTouchPoints}));
    assert(deviceInfo.mobile, JSON.stringify(deviceInfo));
    await page.locator('#mobile-category').tap();
    await page.waitForFunction(()=>document.querySelector('#mobile-offline-status').textContent==='Ready for offline play');
    await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
    if(offline){
      disconnected=true;
      await page.reload();
      await page.locator('#mobile-category').tap();
    }
    for(const id of ids){
      await pick(page,id);await tap(page,'Play now');
      const frame=page.frameLocator('#player-frame iframe');
      await frame.locator('#menu-panel h1').waitFor();
      await shot(page,device.replaceAll(' ','-')+'-'+id+'-menu');
      await tap(frame,'Settings');await tap(frame,'Music on');await tap(frame,'Back');await tap(frame,'Play');
      const canvas=frame.locator('#board');
      await canvas.waitFor();
      await shot(page,device.replaceAll(' ','-')+'-'+id+'-play');
      assert(await frame.locator('#stats').isVisible());
      const rect=await canvas.boundingBox();
      assert(rect.width>240&&rect.height>220);
      if(id==='color-switch'){
        for(let i=0;i<13;i++){
          await page.touchscreen.tap(rect.x+rect.width*.5,rect.y+rect.height*.55);
          await new Promise(r=>setTimeout(r,150));
        }
      }else if(id==='burger-rush'){
        await tap(frame,'Bottom bun');await tap(frame,'Beef');
        const button=frame.getByRole('button',{name:'Beef · ready',exact:true});await button.waitFor({timeout:12000});await button.tap();
        await tap(frame,'Cheese');await tap(frame,'Top bun');await tap(frame,'Serve');
        await frame.getByText('1/3',{exact:true}).waitFor();
      }else{
        if(id==='highway-rush'){
          await tap(frame,'Nitro');
          assert(await frame.locator('#nitro').isDisabled());
        }
        const x=rect.x+rect.width*.47,y=rect.y+rect.height*.60;
        await page.mouse.move(x,y);await page.mouse.down();
        await page.mouse.move(x+90,y-12,{steps:9});
        await new Promise(r=>setTimeout(r,320));await page.mouse.up();
      }
      if(await frame.locator('#pause').isVisible()){
        await frame.getByRole('button',{name:'Pause game'}).tap();
        await frame.getByRole('heading',{name:'Paused'}).waitFor();
        await tap(frame,'Restart');assert(await frame.locator('#stats').isVisible());
        await frame.getByRole('button',{name:'Return to SG'}).tap();
      }else await tap(frame,'Return to SG');
      await page.locator('#player').waitFor({state:'hidden'});
      let stored=await page.evaluate(id=>JSON.parse(localStorage.getItem('sg-arcade-v1:'+id)),id);
      assert.equal(stored.settings.music,false);
      if(id==='burger-rush')assert(stored.served>=1);
      if(id==='color-switch')assert(stored.gates>=1,'a touch-controlled run should clear a ring');
      if(id==='hole-city')assert(stored.total>=1,'a city run should swallow an object');
      await page.close();page=await context.newPage();page.on('pageerror',error=>seen.push(error.message));
      await page.goto(base);await page.locator('#mobile-category').tap();
      await pick(page,id);await tap(page,'Play now');
      const reloaded=page.frameLocator('#player-frame iframe');
      await tap(reloaded,'Settings');assert(await reloaded.getByRole('button',{name:'Music off',exact:true}).count());
      await tap(reloaded,'Back');await tap(reloaded,'Return to SG');
      await page.locator('#player').waitFor({state:'hidden'});
    }
    assert.deepEqual(seen,[]);
  }finally{disconnected=false;await context.close();}
}
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port+'/sg/';
  try{
    await testMac(base);console.log('Chromium Mac: five untouched covers, category, all direct routes and launch controls blocked; Eight Ball still launches.');
    const browser=await webkit.launch();
    try{
      await testMobile(browser,base,'iPhone 15',true,games.filter(id=>!portrait.has(id)),true);
      await testMobile(browser,base,'iPhone 15',false,games.filter(id=>portrait.has(id)),true);
      console.log('WebKit iPhone profile: all five launch offline, accept input, save settings across close/reopen, and return to SG.');
      await testMobile(browser,base,'iPad Mini',true,games,true);
      console.log('WebKit iPad profile: all five load offline, accept input, save settings across close/reopen, and return to SG.');
    }finally{await browser.close();}
  }finally{server.closeAllConnections();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
