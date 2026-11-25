'use strict';
(() => {
const {mount,clamp,lerp,rnd,tau,ellipse,box,polygon,gradient,label,particleKit}=SGArcade;
const art=window.SGCityArt;
const size={w:2180,h:1560,cw:310,ch:254,road:65};
const maps=[
  ['Downtown City',0,'#8aa077','#87a97b','#b8b8aa','#586475',34],
  ['Residential Neighborhood',33,'#8aa258','#a7b767','#d8c3a1','#6a6c73',51],
  ['Beach Town',61,'#c0ba7b','#aac477','#f1d5ab','#647d90',86],
  ['Industrial District',95,'#95897e','#a4a088','#b8b19b','#534c5f',77],
  ['Mega City',125,'#7795a4','#7c9a92','#c0c9d0','#4b506a',119]
];
const vortex=[['Plasma','#e260ff',0],['Aquatic','#5af9f0',30],['Solar','#ffbf5b',62],['Ultraviolet','#8692ff',100]];
const items={
  trash:[6,0,3],cone:[8,0,5],planter:[11,12,8],bench:[14,17,11],table:[18,21,15],lamp:[17,25,19],
  tree:[22,30,26],car:[28,42,37],truck:[35,54,55],house:[42,68,84],building:[52,89,136],tower:[64,115,235]
};
const worldRng=seed=>()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/2**32);
function makeBg(mapIndex){
  const canvas=document.createElement('canvas');canvas.width=size.w;canvas.height=size.h;
  const g=canvas.getContext('2d'),[, ,dirt,grass,walk,road,seed]=maps[mapIndex],rand=worldRng(seed);
  g.fillStyle=dirt;g.fillRect(0,0,size.w,size.h);
  g.fillStyle=walk;g.fillRect(0,0,size.w,size.h);
  for(let x=0;x<size.w;x+=size.cw){g.fillStyle=road;g.fillRect(x,0,size.road,size.h);}
  for(let y=0;y<size.h;y+=size.ch){g.fillStyle=road;g.fillRect(0,y,size.w,size.road);}
  g.globalAlpha=.24;g.fillStyle='#222b36';
  for(let i=0;i<9000;i++){
    const x=rand()*size.w,y=rand()*size.h;
    if(x%size.cw<size.road||y%size.ch<size.road)g.fillRect(x,y,1+rand()*2,1);
  }
  g.globalAlpha=1;
  for(let x=0;x<size.w;x+=size.cw)for(let y=0;y<size.h;y+=size.ch){
    const left=x+size.road+14,top=y+size.road+14,w=size.cw-size.road-28,h=size.ch-size.road-28;
    box(g,left+2,top+4,w,h,10,'#34364237');
    box(g,left,top,w,h,10,grass);
    if(mapIndex===3){box(g,left+7,top+9,w-14,h-18,7,'#8d8b88');}
    if((x/size.cw+y/size.ch)%3===0){
      box(g,left+w*.60,top+h*.12,w*.30,h*.71,6,mapIndex===2?'#5ad2db':'#a2bd82');
      box(g,left+w*.65,top+h*.14,w*.07,h*.66,2,'#ffffff1e');
    }
    g.strokeStyle='#8d918f45';g.lineWidth=1;
    for(let j=0;j<10;j++){g.beginPath();g.moveTo(left+j*w/10,top-13);g.lineTo(left+j*w/10,top-3);g.stroke();}
    g.fillStyle='#fcebdc';
    for(let i=0;i<6;i++){
      g.fillRect(x+8+i*8,y+size.road+4,4,11);g.fillRect(x+size.road+4,y+8+i*8,10,4);
    }
    for(let i=0;i<8;i++){
      g.fillStyle='#e8bc72a0';g.fillRect(x+size.road+22+i*26,y+size.road/2,12,2);
      g.fillRect(x+size.road/2,y+size.road+19+i*20,2,11);
    }
    if(mapIndex===2&&y>=size.ch*5){g.fillStyle='#3ab0b9';g.fillRect(x+size.road+4,y+size.road+4,w+20,h+20);}
  }
  return canvas;
}
function generate(mapIndex){
  const list=[],rand=worldRng(maps[mapIndex][6]*39);
  const add=(k,x,y,angle=0,moving=0)=>{
    if(x>size.w-32||y>size.h-25)return;
    list.push({k,x,y,angle,moving,home:x,variant:Math.floor(rand()*6),r:items[k][0]*(.9+rand()*.22),fall:0,skip:false});
  };
  for(let col=0;col<7;col++)for(let row=0;row<6;row++){
    const x=col*size.cw,y=row*size.ch,plot=col*13+row;
    if(plot%4!==0||col===0&&row===0){
      add(plot%8===3||mapIndex===4&&plot%3===0?'tower':plot%3===0&&mapIndex!==1?'building':'house',x+172,y+158);
    }else add('table',x+184,y+156);
    add('bench',x+100,y+105);add('planter',x+113,y+219);
    add('table',x+239,y+111);add('tree',x+247,y+212);add('tree',x+86,y+166);add('lamp',x+290,y+77);
    add('car',x+110,y+24,0,plot%2?15:0);add(plot%2?'car':'truck',x+242,y+43,Math.PI,plot%3?-12:0);
    if(plot%3===1)add('car',x+43,y+178,Math.PI/2);
    for(let i=0;i<7;i++)add(i%5===0?'cone':'trash',x+75+(i*44)%226+rand()*10,y+(i%2?226:79)+rand()*10);
  }
  // Closely spaced street litter gives every district an easy first growth route.
  for(let i=0;i<12;i++)add(i%4?'trash':'cone',83+i*17,83+Math.sin(i*.57)*12);
  return list;
}
mount({title:'Hole City',highlight:'City',category:'City sandbox',description:'Drag to move through town. Swallow street clutter, then work up to the skyline.',orientation:'landscape',modes:['Timed','Endless','City Destruction'],unlockTitle:'Districts & vortex skins',defaults:{maxSize:0,total:0,map:0,skin:0,destroyed:0},root:46,tune:[0,3,7,10,7,5,3,10]},api=>{
  const fx=particleKit(125);
  let bg=null,mapIndex=-1,list=[],at={x:105,y:115},origin=null,vector={x:0,y:0},r=14,targetR=14,view={x:105,y:115,zoom:1.2},points=0,consumed=0,time=0,cityCount=0,limit=0,ending=false,tip=true;
  function cache(){if(mapIndex!==api.state.map||!bg){mapIndex=api.state.map;bg=makeBg(mapIndex);}}
  function frameCenter(x,y,zoom){
    const edgeX=Math.min(size.w/2,api.w*.5/zoom),edgeY=Math.min(size.h/2,api.h*.5/zoom);
    return {x:clamp(x,edgeX,size.w-edgeX),y:clamp(y,edgeY,size.h-edgeY),zoom};
  }
  function start(mode){
    cache();list=generate(mapIndex);at={x:103,y:87};origin=null;vector={x:0,y:0};r=targetR=mode==='City Destruction'?29:14;
    view=frameCenter(at.x,at.y,1.17);points=consumed=time=cityCount=0;ending=false;tip=true;
    limit=mode==='Timed'?105:mode==='City Destruction'?145:0;fx.clear();hud();
    if(mode==='Endless')api.controls([{label:'Finish run',action:()=>finish('City tour finished')}]);
  }
  function hud(){
    const values=[['Score',points],['Size',Math.floor(targetR)],['Swallowed',consumed]];
    if(api.mode==='City Destruction')values.push(['Buildings',cityCount+'/6']);
    if(limit)values.push(['Time',Math.max(0,Math.ceil(limit-time))]);api.hud(values);
  }
  function finish(head){
    if(ending)return;ending=true;api.save();api.end(points,head,consumed+' objects swallowed · size '+Math.floor(targetR)+'.');
  }
  function movement(p){
    if(!origin)return;
    const dx=p.x-origin.x,dy=p.y-origin.y,d=Math.hypot(dx,dy);
    vector.x=d>5?dx/Math.max(d,65):0;vector.y=d>5?dy/Math.max(d,65):0;
    if(d>12)tip=false;
  }
  function update(dt){
    time+=dt;if(limit&&time>=limit){finish('Time is up');return;}
    if(api.mode==='City Destruction'&&cityCount>=6){finish('Skyline cleared');return;}
    const speed=173+Math.min(r*1.24,83);
    at.x=clamp(at.x+vector.x*dt*speed,16,size.w-16);at.y=clamp(at.y+vector.y*dt*speed,16,size.h-16);
    r=lerp(r,targetR,1-Math.exp(-dt*5));
    const scale=clamp(1.32-r*.0061,.55,1.25);
    view.zoom=lerp(view.zoom,scale,1-Math.exp(-dt*3));
    const target=frameCenter(at.x,at.y,view.zoom);
    view=frameCenter(lerp(view.x,target.x,1-Math.exp(-dt*6)),lerp(view.y,target.y,1-Math.exp(-dt*6)),view.zoom);
    for(const p of list){
      if(p.skip)continue;
      if(p.fall){
        p.fall+=dt;
        p.x=lerp(p.x,at.x,dt*7);p.y=lerp(p.y,at.y,dt*7);
        if(p.fall<.51)continue;
        p.skip=true;consumed++;
        const value=items[p.k][2],previous=Math.floor(targetR);
        points+=value;targetR=Math.min(162,Math.sqrt(targetR**2+value*18));
        api.state.total++;
        if(['house','building','tower'].includes(p.k)){cityCount++;api.state.destroyed++;}
        api.state.maxSize=Math.max(api.state.maxSize,Math.floor(targetR));
        if(maps.some(row=>row[1]>previous&&row[1]<=targetR)||vortex.some(row=>row[2]>previous&&row[2]<=targetR)){
          api.notice('New district or vortex unlocked');api.tone('level');
        }else api.tone(value>=37?'combo':'good');
        fx.burst(at.x,at.y,vortex[api.state.skin][1],value>=37?14:5,96,5);api.buzz();api.save();
        continue;
      }
      if(p.moving)p.x=p.home+Math.sin(time*p.moving/52+p.home)*40;
      if(Math.abs(p.x-at.x)>r+60||Math.abs(p.y-at.y)>r+60)continue;
      const near=Math.hypot(p.x-at.x,p.y-at.y);
      if(near<r*.83&&targetR>=items[p.k][1])p.fall=.001;
    }
    fx.update(dt);hud();
  }
  function hole(g,x,y,radius,tint,time){
    const glow=g.createRadialGradient(x,y,Math.max(1,radius*.53),x,y,radius*1.48);
    glow.addColorStop(0,'#1c0a2d');glow.addColorStop(.49,tint+'b5');glow.addColorStop(1,tint+'00');
    ellipse(g,x,y,radius*1.48,radius*1.48,glow);
    ellipse(g,x,y,radius,radius,'#040315');
    g.save();g.translate(x,y);
    for(let j=0;j<5;j++){
      const sign=j%2?1:-1;
      g.beginPath();g.ellipse(0,0,radius*(.77+j*.075),radius*(.64+j*.085),j*.62+time*.52,time*sign*2+j, time*sign*2+j+Math.PI*1.45);
      g.lineCap='round';g.strokeStyle=j%3===0?'#eacbff':tint;g.globalAlpha=.53+j*.06;g.lineWidth=Math.max(1.2,radius*.04-j*.18);g.stroke();
    }
    for(let j=0;j<12;j++){
      const a=time*(1.4+j*.02)+j*2.4,d=radius*(1.02+j%3*.13);
      g.globalAlpha=.7-(j%3)*.12;ellipse(g,Math.cos(a)*d,Math.sin(a)*d,radius*.046+1,radius*.03+1,tint);
    }
    g.restore();
  }
  let demo=null;
  function draw(g,now,screen){
    cache();const {w,h}=api,tint=vortex[api.state.skin][1];
    const menu=screen==='menu';
    if(menu&&(!demo||demo.map!==mapIndex))demo={map:mapIndex,items:generate(mapIndex)};
    const scene=menu?frameCenter(465,328,.81):view;
    const sceneObjects=menu?demo.items:list;
    g.fillStyle='#363950';g.fillRect(0,0,w,h);
    g.save();g.translate(w/2,h/2);g.scale(scene.zoom,scene.zoom);g.translate(-scene.x,-scene.y);
    g.drawImage(bg,0,0);
    const center=menu?{x:scene.x+w*.23/scene.zoom,y:scene.y+44}:at;
    hole(g,center.x,center.y,menu?71+Math.sin(now*2)*6:r,tint,now);
    const mx=w*.5/scene.zoom+160,my=h*.5/scene.zoom+180;
    const visibles=sceneObjects.filter(p=>!p.skip&&Math.abs(p.x-scene.x)<mx&&Math.abs(p.y-scene.y)<my).sort((a,b)=>a.y-b.y);
    for(const p of visibles){
      g.save();g.translate(p.x,p.y);g.rotate(p.angle+(p.fall||0)*4.1);
      if(p.fall){
        const fall=Math.max(.01,1-p.fall/.53);
        g.scale(fall,fall*.81);g.globalAlpha=fall;
      }
      art.draw(g,p.k,p.r,p.variant);g.restore();
    }
    if(!menu)fx.draw(g);
    g.restore();
    if(!menu&&screen==='play'){
      if(tip&&time<10)label(g,'Drag to move',w/2,h*.86,24,'#fff2ff');
      if(origin&&Math.hypot(vector.x,vector.y)>.1){
        ellipse(g,origin.x,origin.y,34,34,'#17112c70');
        ellipse(g,origin.x+vector.x*22,origin.y+vector.y*22,12,12,tint+'be');
      }
    }
  }
  function unlocks(){
    api.showChoices('Districts & vortex skins','Size record '+api.state.maxSize+' · '+api.state.total+' lifetime objects',[
      ...maps.map(([name,need],i)=>({label:name,detail:need>api.state.maxSize?'Reach size '+need:'Select district',disabled:need>api.state.maxSize,selected:i===api.state.map,action(){api.state.map=i;api.save();unlocks();}})),
      ...vortex.map(([name,,need],i)=>({label:name,detail:need>api.state.maxSize?'Reach size '+need:'Vortex skin',disabled:need>api.state.maxSize,selected:i===api.state.skin,action(){api.state.skin=i;api.save();unlocks();}})),
      {label:'Skyline eater',detail:api.state.destroyed>=10?'Achievement earned':'Swallow 10 buildings ('+api.state.destroyed+'/10)'},
      {label:'Street sweep',detail:api.state.total>=100?'Achievement earned':'Swallow 100 total objects ('+api.state.total+'/100)'}
    ]);
  }
  function cancel(){origin=null;vector.x=vector.y=0;}
  return {start,update,draw,unlocks,recordText:()=>api.state.maxSize+' size record · '+api.state.total+' lifetime objects',
    down(p){origin=p;},move:movement,up:cancel,cancel};
});
})();
