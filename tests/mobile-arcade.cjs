const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {playDesktop}=require('./desktop-input.cjs');
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
    const page=await browser.newPage({viewport:{width:1152,height:720}});
    const seen=errors(page);
    await page.goto(base);
    assert(await page.evaluate(()=>SGMacDesktop()));
    assert.equal(await page.getByText('Mobile Exclusive',{exact:true}).count(),0);
    assert(await page.locator('.game-tile').count()>20);
    for(const game of games){
      await pick(page,game);
      assert(await page.locator('#play').isEnabled());
      assert.equal(await page.locator('#game-devices').getByRole('img',{name:'Mac: playable',exact:true}).count(),1);
      assert.equal(await page.locator('#game-devices').getByRole('img',{name:'iPhone: playable',exact:true}).count(),1);
      assert.deepEqual(await page.locator('#game-cover').evaluate(async img=>{await img.decode();return [img.naturalWidth,img.naturalHeight];}),[2048,768]);
      await page.locator('#play').click();
      const frame=page.frameLocator('#player-frame iframe');
      await playDesktop(page,frame,game);
      await shot(page,'mac-'+game);
      await frame.getByRole('button',{name:'Return to SG',exact:true}).click();
      await page.locator('#player').waitFor({state:'hidden'});
    }
    await pick(page,'eight-ball');
    assert(await page.locator('#play').isEnabled());
    await page.locator('#play').click();
    await page.locator('#player-frame iframe').waitFor();
    await page.getByRole('button',{name:'Back to SG',exact:true}).click();
    assert(await page.locator('#player').isHidden());
    assert.deepEqual(seen,[]);

    const unsupported=await browser.newPage({userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36'});
    await unsupported.addInitScript(()=>Object.defineProperty(navigator,'platform',{get:()=> 'Win32'}));
    await unsupported.goto(base);
    await pick(unsupported,'hole-city');
    assert(await unsupported.locator('#play').isHidden());
    await unsupported.goto(base+'games/hole-city/');
    assert.equal(await unsupported.locator('#menu-panel h2').textContent(),'Play on Mac, iPhone or iPad');
  }finally{await browser.close();}
}
async function testMobile(browser,base,device,landscape,ids,offline){
  const context=await browser.newContext(mobile(device,landscape));
  try{
    let page=await context.newPage(),seen=errors(page);
    await page.goto(base);
    const deviceInfo = await page.evaluate(() => ({mobile:window.SGAppleMobile(),ua:navigator.userAgent,platform:navigator.platform,touch:navigator.maxTouchPoints}));
    assert(deviceInfo.mobile, JSON.stringify(deviceInfo));
    assert.equal(await page.getByText('Mobile Exclusive',{exact:true}).count(),0);
    await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
    if(offline){
      disconnected=true;
      await page.reload();
    }
    for(const id of ids){
      await pick(page,id);await tap(page,'Play now');
      const frame=page.frameLocator('#player-frame iframe');
      await frame.locator('#menu-panel h1').waitFor();
      assert.equal(await frame.getByRole('button',{name:'Return to SG'}).count(),1);
      assert(await frame.locator('#back-to-sg').isVisible());
      if(id==='color-switch'){
        await tap(frame,'How to play');
        await frame.getByText('2. Match the middle color',{exact:true}).waitFor();
        await tap(frame,'Back');
      }
      await shot(page,device.replaceAll(' ','-')+'-'+id+'-menu');
      await tap(frame,'Settings');await tap(frame,'Music on');await tap(frame,'Back');await tap(frame,'Play');
      const canvas=frame.locator('#board');
      await canvas.waitFor();
      const selection=await canvas.evaluate(c=>{
        const css=getComputedStyle(c.closest('#arcade'));
        return {select:css.getPropertyValue('user-select')||css.getPropertyValue('-webkit-user-select'),
          callout:css.getPropertyValue('-webkit-touch-callout'),
          canceled:['copy','selectstart','contextmenu','dragstart'].map(type=>
            !c.dispatchEvent(new Event(type,{bubbles:true,cancelable:true})))};
      });
      assert.equal(selection.select,'none',JSON.stringify(selection));
      assert(!selection.callout||selection.callout==='none',JSON.stringify(selection));
      assert(selection.canceled.every(Boolean),JSON.stringify(selection));
      await shot(page,device.replaceAll(' ','-')+'-'+id+'-play');
      assert(await frame.locator('#stats').isVisible());
      const rect=await canvas.boundingBox();
      assert(rect.width>240&&rect.height>220);
      if(id==='color-switch'){
        for(let i=0;i<8;i++){
          await page.touchscreen.tap(rect.x+rect.width*.5,rect.y+rect.height*.55);
          await new Promise(r=>setTimeout(r,130));
        }
        assert.match(await frame.locator('#stats').textContent(),/Ball(?:Cyan|Pink|Purple)/);
      }else if(id==='burger-rush'){
        assert.equal(await frame.locator('#station-bun-bottom .control-icon canvas').count(),1);
        assert.equal(await frame.locator('[data-group=stations] .control-icon').count(),4);
        assert.match(await frame.locator('.arcade-sr').textContent(),/Bottom bun, Beef, Cheese, Top bun/);
        await tap(frame,'Bottom bun');await tap(frame,'Beef');
        const button=frame.getByRole('button',{name:'Beef · ready',exact:true});await button.waitFor({timeout:12000});await button.tap();
        await tap(frame,'Cheese');await tap(frame,'Top bun');await tap(frame,'Serve');
        await frame.getByText('1/3',{exact:true}).waitFor();
      }else{
        if(id==='highway-rush'){
          await tap(frame,'Nitro');
          await frame.locator('#nitro:disabled').waitFor();
        }
        const x=rect.x+rect.width*.47,y=rect.y+rect.height*.60;
        await page.mouse.move(x,y);await page.mouse.down();
        await page.mouse.move(x+90,y-12,{steps:9});
        await new Promise(r=>setTimeout(r,490));await page.mouse.up();
        if(id==='hole-city'){
          await frame.locator('#stats').getByText(/Rank/).waitFor();
          await shot(page,device.replaceAll(' ','-')+'-hole-city-race');
        }
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
      if(id==='color-switch')assert(stored.gates>=2,'a touch-controlled run should clear both practice bars');
      if(id==='hole-city')assert(stored.total>=1,'a city run should swallow an object');
      await page.close();page=await context.newPage();page.on('pageerror',error=>seen.push(error.message));
      await page.goto(base);
      await pick(page,id);await tap(page,'Play now');
      const reloaded=page.frameLocator('#player-frame iframe');
      await tap(reloaded,'Settings');assert(await reloaded.getByRole('button',{name:'Music off',exact:true}).count());
      await tap(reloaded,'Back');await tap(reloaded,'Return to SG');
      await page.locator('#player').waitFor({state:'hidden'});
    }
    assert.deepEqual(seen,[]);
  }finally{disconnected=false;await context.close();}
}
async function resultButtons(browser,base){
  const context=await browser.newContext(mobile('iPhone 15',true));
  try{
    const page=await context.newPage();
    await page.goto(base);await pick(page,'hole-city');await tap(page,'Play now');
    const frame=page.frameLocator('#player-frame iframe');
    await tap(frame,'Endless');await tap(frame,'Play');await tap(frame,'Finish run');
    await frame.getByRole('heading',{name:'City tour finished',exact:true}).waitFor();
    assert.equal(await frame.locator('.menu-actions button').allTextContents().then(labels=>labels.join('|')),'Play again|Main menu');
    assert.equal(await frame.getByRole('button',{name:'Return to SG'}).count(),1);
    assert.equal(await frame.locator('#back-to-sg').textContent(),'SG');
    await shot(page,'iPhone-15-hole-city-result');
    await tap(frame,'Return to SG');
    await page.locator('#player').waitFor({state:'hidden'});
  }finally{await context.close();}
}
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port+'/sg/';
  try{
    await testMac(base);console.log('Chromium Mac: all five have working desktop controls and return to SG, with original covers and the existing Eight Ball launch.');
    const browser=await webkit.launch();
    try{
      await testMobile(browser,base,'iPhone 15',true,games.filter(id=>!portrait.has(id)),true);
      await testMobile(browser,base,'iPhone 15',false,games.filter(id=>portrait.has(id)),true);
      console.log('WebKit iPhone profile: all five launch offline, accept input, save settings across close/reopen, and return to SG.');
      await testMobile(browser,base,'iPad Mini',true,games,true);
      await resultButtons(browser,base);
      console.log('WebKit iPad profile: all five load offline, accept input, save settings across close/reopen, and return to SG.');
    }finally{await browser.close();}
  }finally{server.closeAllConnections();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
