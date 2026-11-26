const assert = require('node:assert/strict');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function playDesktop(page, scope, game){
  await scope.locator('html[data-input=desktop]').waitFor();
  const button=name=>scope.getByRole('button',{name,exact:true});
  if(game==='slice-master')await button('Zen').click();
  await button('Play').click();
  const board=scope.locator('#board');
  await board.waitFor();
  await board.focus();
  const stats=scope.locator('#stats');
  if(game==='slice-master'){
    const r=await board.boundingBox();
    await delay(1100);
    for(let i=0;i<16;i++){
      const y=r.y+[.57,.68,.48,.79][i%4]*r.height;
      await page.mouse.move(r.x+r.width*.055,y);
      await page.mouse.down();
      await page.mouse.move(r.x+r.width*.945,y,{steps:8});
      await page.mouse.up();
      if(/Score[1-9]/.test(await stats.textContent()))break;
    }
    assert.match(await stats.textContent(),/Score[1-9]/,'Mouse dragging should slice fruit.');
  }
  if(game==='highway-rush'){
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('d');
    await page.keyboard.press('Space');
    await scope.locator('#nitro:disabled').waitFor();
    assert.match(await stats.textContent(),/Nitro1\d%/,'Space should spend nitro charge.');
  }
  if(game==='color-switch'){
    await page.keyboard.down('Space');await delay(680);await page.keyboard.up('Space');
    assert.match(await stats.textContent(),/Score[1-9]/,'Holding Space should clear the first gate.');
  }
  if(game==='hole-city'){
    const marker=()=>board.evaluate(canvas=>{
      const w=canvas.clientWidth,h=canvas.clientHeight,logical=Math.max(640,Math.min(1210,Math.round(560*w/h)));
      const zoom=Math.min(w/logical,h/560),x0=(w-logical*zoom)/2,y0=(h-560*zoom)/2;
      const ratio=canvas.width/w, mapWidth=logical>760?133:100,mapHeight=logical>760?88:67;
      const left=Math.floor((x0+(logical-mapWidth-12)*zoom)*ratio);
      const top=Math.floor((y0+77*zoom)*ratio),width=Math.ceil(mapWidth*zoom*ratio),height=Math.ceil(mapHeight*zoom*ratio);
      const img=canvas.getContext('2d').getImageData(left,top,width,height);
      let sum=0,total=0;
      for(let i=0;i<img.data.length;i+=4){
        const [r,g,b]=img.data.subarray(i,i+3);
        if(r===226&&g===96&&b===255){sum+=(i/4)%width;total++;}
      }
      return total?sum/total:null;
    });
    await delay(200);
    const before=await marker();
    await page.keyboard.down('d');await delay(900);await page.keyboard.up('d');
    const after=await marker();
    assert(before!==null&&after>before+1,'D should move the player right on the city map. '+JSON.stringify({before,after}));
  }
  if(game==='burger-rush'){
    await page.keyboard.press('2');
    assert.equal(await scope.locator('[data-group=stations] .active').textContent(),'🥬Produce2');
    await page.keyboard.press('1');
    await page.keyboard.press('z');
    await page.keyboard.press('x');
    await button('Beef · ready').waitFor({timeout:12000});
    await page.keyboard.press('x');
    await page.keyboard.press('v');
    await page.keyboard.press('c');
    await page.keyboard.press('Enter');
    await stats.getByText('1/3',{exact:true}).waitFor();
  }
  await page.keyboard.press('Escape');
  await scope.getByRole('heading',{name:'Paused',exact:true}).waitFor();
  await page.keyboard.press('Escape');
  assert(await stats.isVisible());
}

module.exports = {playDesktop};
