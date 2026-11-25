'use strict';
(() => {
const {mount,clamp,rnd,tau,ellipse,polygon,gradient,label,particleKit}=SGArcade;
const fruit=[
  {name:'Watermelon',colors:['#d8f574','#65ba22','#0f642e'],cut:'#ff4e57',edge:'#aada55',r:43},
  {name:'Pineapple',colors:['#fff485','#ffb91b','#a84e0e'],cut:'#ffdf49',edge:'#f09a0a',r:39},
  {name:'Strawberry',colors:['#ffb291','#fd3c50','#a3103e'],cut:'#ff637b',edge:'#f83350',r:32},
  {name:'Orange',colors:['#fff49f','#ff9e13','#ca4c05'],cut:'#ffb219',edge:'#ff9715',r:36},
  {name:'Kiwi',colors:['#ecbc7a','#9c6636','#4d321a'],cut:'#93d641',edge:'#8c6441',r:34},
  {name:'Blueberries',colors:['#c9d9ff','#5466ce','#242447'],cut:'#a78af6',edge:'#524aa5',r:28}
];
const blades=[['Blue Spark','#b3fdff',0],['Golden Arc','#fff48a',100],['Berry Blade','#ff96d7',250],['Aurora Steel','#9aff9b',650]];
const scenes=[['Paradise',null,0],['Golden Hour','#fc843e55',125],['Moon Cove','#363577b0',340]];
const backdrop=new Image();backdrop.src='paradise.jpg';
function polyCurve(g,fill,fn){g.beginPath();fn();g.closePath();g.fillStyle=fill;g.fill();}
function fruitSprite(g,id,r){
  const f=fruit[id];
  const shine=g.createRadialGradient(-.38*r,-.42*r,.08*r,0,0,r*1.07);
  f.colors.forEach((c,i)=>shine.addColorStop([0,.44,1][i],c));
  if(id===1){
    for(let i=0;i<8;i++){
      const x=(i-3.5)*r*.17;
      polyCurve(g,gradient(g,0,-r*1.5,0,0,['#aef745','#0f752d']),()=>{
        g.moveTo(0,-r*.41);g.quadraticCurveTo(x*.8,-r*1.33,x*1.65,-r*(1.33+Math.cos(i*2)*.25));g.quadraticCurveTo(x*1.12,-r*.72,0,-r*.41);
      });
    }
    ellipse(g,0,r*.08,r*.77,r*.94,shine);
    for(let y=-2;y<=2;y++)for(let j=-2;j<=2;j++){
      const x=(j+(y%2)*.5)*r*.27,rY=y*r*.3;
      if((x/(r*.74))**2+(rY/(r*.88))**2>1.13)continue;
      polygon(g,[[x,rY-r*.12],[x+r*.14,rY],[x,rY+r*.12],[x-r*.14,rY]],'#bc63126e');
      ellipse(g,x-r*.025,rY-r*.035,r*.037,r*.03,'#fff1a9');
    }
  }else if(id===2){
    polyCurve(g,shine,()=>{g.moveTo(0,-r*.84);g.bezierCurveTo(r*1.16,-r*1.24,r*1.02,r*.32,r*.16,r);g.quadraticCurveTo(0,r*1.15,-r*.18,r);g.bezierCurveTo(-r*1.23,r*.22,-r*1.05,-r*1.34,0,-r*.84);});
    for(let i=0;i<22;i++){
      const y=-r*.66+i%6*r*.24,x=Math.sin(i*2.95)*r*(.69-Math.max(0,y)*.35/r);
      ellipse(g,x,y,r*.034,r*.064,i%2?'#ffd09b':'#ffad64');
    }
    for(const i of [-2,-1,0,1,2])polygon(g,[[0,-r*.68],[i*r*.36,-r],[i*r*.28,-r*1.13],[r*.10,-r*.87]],i%2?'#4dd43a':'#2f9926');
  }else{
    const rx=id===0?r*1.04:id===4?r*.86:r;
    ellipse(g,0,0,rx,r,shine);
    if(id===0){
      g.save();g.beginPath();g.ellipse(0,0,rx,r,0,0,tau);g.clip();
      for(let i=-2;i<=2;i++){
        g.beginPath();g.moveTo(-r*.88+i*r*.19,-r*1.07);
        g.bezierCurveTo(-r*.58+i*r*.42,-r*.35,-r*.46+i*r*.31,r*.41,-r*.02+i*r*.28,r*1.09);
        g.strokeStyle=i%2?'#225f2cbb':'#276b26aa';g.lineWidth=r*.145;g.stroke();
      }
      g.restore();
    }else if(id===3||id===4){
      for(let i=0;i<31;i++){
        const a=i*2.39996,d=Math.sqrt(i/34)*r*.86;
        ellipse(g,Math.cos(a)*d*.9,Math.sin(a)*d,r*.016,r*.022,id===3?'#fff0bd77':'#e4bb846c');
      }
      if(id===3)polyCurve(g,'#6fdb39',()=>{g.moveTo(-r*.09,-r*.87);g.quadraticCurveTo(r*.17,-r*1.24,r*.58,-r*1.02);g.quadraticCurveTo(r*.28,-r*.80,-r*.09,-r*.87);});
    }else{
      const color=gradient(g,0,-r*.77,0,0,['#475cba','#141f60']);
      polygon(g,[[-r*.30,-r*.56],[-r*.11,-r*.73],[r*.11,-r*.58],[r*.36,-r*.63],[r*.26,-r*.37],[r*.32,-r*.16],[r*.01,-r*.22],[-r*.18,-r*.13],[-r*.23,-r*.35]],color);
    }
  }
  ellipse(g,-r*.33,-r*.32,r*.17,r*.055,'#fffffd53');
}
function half(g,p){
  const f=fruit[p.id],r=p.r;
  g.save();g.translate(p.x,p.y);g.rotate(p.a);g.scale(p.side,1);
  g.beginPath();g.ellipse(0,0,r,r,0,-Math.PI/2,Math.PI/2);g.closePath();g.fillStyle=f.edge;g.fill();
  g.beginPath();g.ellipse(r*.035,0,r*.86,r*.87,0,-Math.PI/2,Math.PI/2);g.closePath();g.fillStyle=f.cut;g.fill();
  if(p.id===0||p.id===2||p.id===4){
    for(let i=0;i<12;i++){
      const a=-1.4+i*.26,d=r*(.40+.24*Math.sin(i*14)**2);
      ellipse(g,Math.cos(a)*d,Math.sin(a)*d,r*.025,r*.055,p.id===2?'#ffd5a6':'#532632');
    }
    if(p.id===4)ellipse(g,r*.045,0,r*.20,r*.23,'#d5f5a2');
  }else if(p.id===3||p.id===1){
    for(let i=-3;i<=3;i++){
      const a=i*.43;
      g.beginPath();g.moveTo(0,0);g.lineTo(Math.cos(a)*r*.88,Math.sin(a)*r*.87);g.strokeStyle='#fff2b990';g.lineWidth=2;g.stroke();
    }
  }
  g.restore();
}
function bomb(g,r,t){
  const sh=g.createRadialGradient(-r*.40,-r*.37,1,0,0,r*1.12);
  sh.addColorStop(0,'#7b7c9f');sh.addColorStop(.52,'#29263e');sh.addColorStop(1,'#0a0f1d');
  ellipse(g,0,0,r,r,sh);ellipse(g,-r*.41,-r*.39,r*.135,r*.097,'#e8edff91');
  g.lineWidth=r*.24;g.strokeStyle='#161729';g.beginPath();g.moveTo(r*.39,-r*.78);g.quadraticCurveTo(r*.65,-r*1.37,r*.95,-r*1.15);g.stroke();
  const x=r*.96,y=-r*1.17;
  g.save();g.shadowColor='#ff7438';g.shadowBlur=15;
  for(let i=0;i<7;i++){const a=i*tau/7+t*8;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*r*(.21+.11*Math.sin(t*21+i)),y+Math.sin(a)*r*.25);g.strokeStyle=i%2?'#fff784':'#ff8e3e';g.lineWidth=2.2;g.stroke();}
  ellipse(g,x,y,4,4,'#ffffdb');g.restore();
}
function intersects(a,b,p){
  const dx=b.x-a.x,dy=b.y-a.y;
  const d=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);
  return (p.x-a.x-dx*d)**2+(p.y-a.y-dy*d)**2<p.r*p.r;
}
mount({title:'Slice Master',highlight:'Master',category:'Fruit arcade',description:'Swipe through flying fruit. Chain clean cuts and watch for fuses.',orientation:'landscape',modes:['Classic','Timed','Zen'],defaults:{blade:0,scene:0,total:0,combo:0},tune:[0,7,9,12,7,9,14,12],root:55},api=>{
  const fx=particleKit(170);
  let airborne=[],pieces=[],trail=[],last=null,score=0,lives=3,combo=0,chain=0,spawnAt=0,bestCombo=0,t=0,timeLimit=60,ending=false,showHelp=true;
  function start(mode){
    airborne=[];pieces=[];trail=[];last=null;score=0;lives=3;combo=0;chain=0;spawnAt=.85;bestCombo=0;t=0;
    timeLimit=mode==='Zen'?90:60;ending=false;showHelp=true;fx.clear();hud();
  }
  function hud(){api.hud([['Score',score],['Combo','×'+(combo||1)],api.mode==='Classic'?['Lives',lives]:['Time',Math.max(0,Math.ceil(timeLimit-t))]]);}
  function launch(bombItem=false,side=0){
    const id=Math.floor(rnd(0,fruit.length)),f=fruit[id],limit=api.w*.5-85;
    const x=api.w/2+clamp(side,-1,1)*limit+rnd(-38,38);
    const speed=rnd(675,790);
    airborne.push({id,bomb:bombItem,x,y:api.h+55,vx:rnd(-52,52)+(api.w/2-x)*.39,vy:-speed,r:(bombItem?34:f.r)*rnd(.90,1.04),a:rnd(-.6,.6),spin:rnd(-2.6,2.6)});
  }
  function end(head){
    if(ending)return;ending=true;api.save();
    api.end(score,head,score+' points · best chain ×'+bestCombo+'.');
  }
  function cut(a,b){
    if(ending)return;
    let any=false;
    for(let i=airborne.length-1;i>=0;i--){
      const p=airborne[i];if(!intersects(a,b,p))continue;
      airborne.splice(i,1);
      if(p.bomb){
        combo=0;chain=0;fx.burst(p.x,p.y,'#fff589',35,370,290);api.tone('fail');api.buzz('heavy');
        if(api.mode==='Classic'){end('Fuse tripped!');return;}
        else{timeLimit=Math.max(t,timeLimit-7);api.notice('Bomb · −7 seconds');}
        continue;
      }
      any=true;combo=chain>0?combo+1:1;chain=.38;bestCombo=Math.max(bestCombo,combo);
      score+=10+Math.max(0,combo-1)*4;api.state.total++;
      const prior=api.state.combo;api.state.combo=Math.max(api.state.combo,combo);
      const f=fruit[p.id];fx.burst(p.x,p.y,f.cut,18,260,350);
      for(const side of [-1,1])pieces.push({...p,vx:p.vx+side*rnd(90,160),vy:p.vy*.56-38,a:Math.atan2(b.y-a.y,b.x-a.x)+side*.8,spin:side*rnd(2,5),side});
      if(combo===3||combo===5||combo===8)api.notice('×'+combo+' fruit chain!');
      if(prior<5&&combo>=5)api.notice('Achievement · Five-fruit chain');
      if([...blades,...scenes].some(row=>row[2]===api.state.total)){api.notice('New unlock in the dojo');api.tone('level');}
    }
    if(any){api.tone(combo>=3?'combo':'good');api.buzz();api.save();hud();}
  }
  function update(dt){
    t+=dt;chain=Math.max(0,chain-dt);if(!chain)combo=0;
    if(t>=timeLimit&&api.mode!=='Classic'){end('Session complete');return;}
    if(t>=spawnAt){
      const wave=Math.min(4,Math.floor(t/18)+Math.floor(rnd(1,3)));
      for(let i=0;i<wave;i++)launch(false,wave===1?rnd(-.48,.48):lerpSigned(i,wave));
      if(api.mode!=='Zen'&&t>8&&Math.random()<Math.min(.53,.13+t*.004))launch(true,rnd(-.82,.82));
      spawnAt=t+Math.max(.76,1.75-t*.018)*rnd(.93,1.13);
    }
    for(const p of [...airborne,...pieces]){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=690*dt;p.a+=p.spin*dt;}
    for(let i=airborne.length-1;i>=0;i--){
      const p=airborne[i];
      if(p.y<api.h-32)p.appeared=true;
      if(!p.appeared||p.vy<0||p.y<api.h+82)continue;
      airborne.splice(i,1);
      if(api.mode==='Classic'&&!p.bomb){lives--;api.tone('fail');if(lives<=0){end('Last fruit dropped');return;}}
    }
    pieces=pieces.filter(p=>p.y<api.h+125||p.vy<0);
    trail=trail.filter(p=>(p.life-=dt)>0);fx.update(dt);hud();
  }
  function lerpSigned(i,count){return -.84+i*1.68/(count-1);}
  function draw(g,now,screen){
    const {w,h}=api;
    g.fillStyle=gradient(g,0,0,0,h,['#128eeb','#54cbfe','#36bdde']);g.fillRect(0,0,w,h);
    if(backdrop.naturalWidth){
      const scale=Math.max(w/backdrop.width,h/backdrop.height),W=backdrop.width*scale,H=backdrop.height*scale;
      g.drawImage(backdrop,(w-W)/2,(h-H)/2,W,H);
    }else{
      for(let i=0;i<8;i++){
        const x=(i*199+now*9)%(w+170)-85,y=56+(i*31)%240;
        ellipse(g,x,y,81,19,'#e2f6ff64');ellipse(g,x+17,y-13,47,19,'#f2fcff76');
      }
      polygon(g,[[0,h*.81],[w*.13,h*.65],[w*.22,h*.75],[w*.40,h*.68],[w*.63,h*.82],[w,h*.64],[w,h],[0,h]],'#2089a4');
      g.fillStyle=gradient(g,0,h*.83,0,h,['#3ecde2','#0c819e']);g.fillRect(0,h*.83,w,h*.17);
    }
    const tint=scenes[api.state.scene][1];if(tint){g.fillStyle=tint;g.fillRect(0,0,w,h);}
    if(screen==='menu'){
      for(let i=0;i<6;i++){g.save();g.translate(w*(.56+i*.075),h*(.23+i%3*.2)+Math.sin(now*1.5+i)*18);g.rotate(i*.42+now*.13);fruitSprite(g,i,43+(i%2)*13);g.restore();}
    }else{
      for(const p of airborne){g.save();g.translate(p.x,p.y);g.rotate(p.a);if(p.bomb)bomb(g,p.r,now);else fruitSprite(g,p.id,p.r);g.restore();}
      for(const p of pieces)half(g,p);
      fx.draw(g);
      for(const p of trail){
        g.save();g.globalAlpha=p.life/.19;g.lineCap='round';g.shadowBlur=16;g.shadowColor=blades[api.state.blade][1];g.strokeStyle=blades[api.state.blade][1];g.lineWidth=10;
        g.beginPath();g.moveTo(p.a.x,p.a.y);g.lineTo(p.b.x,p.b.y);g.stroke();g.shadowBlur=0;g.strokeStyle='#fff';g.lineWidth=3;g.stroke();g.restore();
      }
      if(showHelp&&t<6)label(g,'Swipe to slice',w/2,h*.78,24,'#fff5c8');
    }
  }
  const unlocks=()=>api.showChoices('Slice dojo','Slice fruit to unlock new blades and places.',[
    ...blades.map(([name,color,need],i)=>({label:name,detail:need>api.state.total?need+' fruit required':'Blade trail · '+(i===api.state.blade?'equipped':'equip'),disabled:need>api.state.total,selected:i===api.state.blade,action(){api.state.blade=i;api.save();unlocks();}})),
    ...scenes.map(([name,tint,need],i)=>({label:name,detail:need>api.state.total?need+' fruit required':'Backdrop',disabled:need>api.state.total,selected:i===api.state.scene,action(){api.state.scene=i;api.save();unlocks();}})),
    {label:'Fruit sliced',detail:api.state.total+' lifetime fruit'},
    {label:'Five-fruit chain',detail:api.state.combo>=5?'Achievement earned':'Challenge · slice five in one chain'},
    {label:'Combo record',detail:'×'+api.state.combo}
  ]);
  return {start,update,draw,unlocks,recordText:()=>api.state.total+' fruit sliced · combo record ×'+api.state.combo,
    down(p){last=p;},move(p){if(!last)return;if(Math.hypot(p.x-last.x,p.y-last.y)<3)return;showHelp=false;trail.push({a:last,b:p,life:.19});if(trail.length>24)trail.shift();cut(last,p);last=p;},
    up(p){if(last&&Math.hypot(p.x-last.x,p.y-last.y)>=3)cut(last,p);last=null;},cancel(){last=null;}
  };
});
})();
