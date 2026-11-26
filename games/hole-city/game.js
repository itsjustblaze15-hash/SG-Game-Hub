'use strict';
(() => {
const {mount,clamp,lerp,tau,ellipse,box,polygon,gradient,label,particleKit}=SGArcade;
const art=window.SGCityArt;
const districts=[['Downtown City',0],['Residential Neighborhood',33],['Beach Town',61],['Industrial District',95],['Mega City',125]];
const skins=[['Plasma','#e260ff',0],['Aquatic','#5af9f0',30],['Solar','#ffbf5b',62],['Ultraviolet','#8692ff',100]];
const rivalsData=[['Nova','#5ecafa'],['Orbit','#ff9a5e'],['Rift','#9fee6c'],['Echo','#ff75ad'],['Atlas','#ecc66a']];
const items={
  trash:[6,0,3,19],cone:[8,0,5,24],planter:[12,16,8,43],bench:[15,22,11,69],
  table:[19,27,15,108],lamp:[18,29,19,118],tree:[25,34,26,182],car:[30,43,37,272],
  truck:[40,54,56,371],house:[49,64,84,650],building:[62,84,136,965],
  tower:[78,108,235,1510],landmark:[108,140,410,2200]
};
const big=new Set(['house','building','tower','landmark']);
const tilt=.72,shear=.22;
const worldRng=seed=>()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/2**32);
function routeAt(road,fraction){
  const distance=clamp(fraction,0,.99999)*(road.points.length-1),i=Math.floor(distance);
  const a=road.points[i],b=road.points[i+1],f=distance-i;
  return {x:lerp(a.x,b.x,f),y:lerp(a.y,b.y,f),angle:Math.atan2(b.y-a.y,b.x-a.x)};
}
function generate(world,index){
  const props=[],cars=[],rand=worldRng(11389+index*40271);
  const add=(k,x,y,scale=1,variant=Math.floor(rand()*6),angle=0)=>{
    if(x<13||y<13||x>world.w-13||y>world.h-13||!world.isLand(x,y))return null;
    const p={k,x,y,r:items[k][0]*scale,scale,variant,angle,fall:0,owner:null,skip:false};
    props.push(p);return p;
  };
  const skyline=index===0||index===4?world.plots
    .filter(p=>p.r>=74&&p.zone!=='park'&&Math.hypot(p.x-world.spawn.x,p.y-world.spawn.y)>205)
    .sort((a,b)=>Math.hypot(a.x-world.spawn.x-265,a.y-world.spawn.y-126)-Math.hypot(b.x-world.spawn.x-265,b.y-world.spawn.y-126))[0]:null;
  for(const [i,plot] of world.plots.entries()){
    const {x,y,r,zone}=plot;
    const type=plot===skyline?'landmark':zone==='downtown'?(i%6===0&&r>93?'landmark':i%3===0?'tower':'building')
      :zone==='homes'?'house':zone==='industrial'?(i%4===0?'tower':'building')
      :zone==='market'?(i%3===0?'building':'table'):zone==='harbor'?(i%4===0?'building':'truck'):'tree';
    const scale=type==='landmark'?clamp(r/96,.91,1.23):clamp(r/(items[type][0]*1.12),.67,1.18);
    add(type,x,y,scale,i%6);
    const scatter=r*.67+10;
    for(let j=0;j<4;j++){
      const d=j*tau/4+i*.14,px=x+Math.cos(d)*scatter,py=y+Math.sin(d)*scatter;
      const kinds=zone==='park'?['trash','planter','tree','bench','lamp','table']:['trash','cone','bench','planter','lamp','tree'];
      const kind=kinds[(i+j*2)%kinds.length];
      add(kind,px,py,.88+rand()*.28,i%6);
    }
    for(let j=0;j<3;j++){
      const angle=rand()*tau,d=r*(.4+rand()*.67);
      add(j===2?'cone':'trash',x+Math.cos(angle)*d,y+Math.sin(angle)*d,.85+rand()*.22,i%6);
    }
  }
  for(const [i,road] of world.roads.entries()){
    if(road.points.length<8)continue;
    const count=Math.min(4,Math.ceil(road.points.length/30));
    for(let j=0;j<count;j++){
      const fraction=(j+rand()*.55+.22)/count;
      const p=routeAt(road,fraction);
      const dir=j%2?-1:1,offset=road.width*.21*dir;
      const car=add(i%5===0?'truck':'car',p.x-Math.sin(p.angle)*offset,p.y+Math.cos(p.angle)*offset,.78+rand()*.29,i%6,dir>0?p.angle:p.angle+Math.PI);
      if(car){car.road=road;car.fraction=fraction;car.dir=dir;car.offset=offset;car.speed=(.013+rand()*.014)*100/road.points.length;cars.push(car);}
    }
    const stop=road.width*.65;
    for(let j=1;j<=4;j++){
      const p=routeAt(road,(j+.28)/5);
      add(j===4?'planter':'trash',p.x-Math.sin(p.angle)*stop,p.y+Math.cos(p.angle)*stop,.96,i%6);
    }
  }
  const {x,y}=world.spawn;
  for(let i=0;i<9;i++){
    const a=i*.42-.99,d=16+i*10;
    add(i%3?'trash':'cone',x+Math.cos(a)*d,y+Math.sin(a)*d,1,i%6);
  }
  add('trash',x,y,1,2);
  return {props,cars};
}
function landmark(g,r,variant){
  const colors=[['#6cacc9','#365777','#dae8dd','#24536e'],['#c8a98b','#876882','#f6dcb2','#768db0'],['#90bfc5','#475985','#e6e9fe','#527b91']][variant%3];
  const [front,side,roof,window]=colors,tiers=variant%3===1?4:3;
  const faces=[];
  const wide=r*.78;
  let floor=r*.12;
  ellipse(g,r*.23,r*.10,r*.93,r*.31,'#1d314c36');
  for(let tier=0;tier<tiers;tier++){
    const width=wide*(1-tier*.16),height=r*(tier===0?1.18:tier===tiers-1?1.7:1.13);
    const left=-width*.58,right=width*.60, top=floor-height;
    const depth=width*.30,rise=width*.27;
    polygon(g,[[right,top],[right+depth,top-rise],[right+depth,floor-rise],[right,floor]],gradient(g,right,top,right+depth,floor,[side,'#495678']));
    g.fillStyle=gradient(g,left,top,right,floor,[front,'#667a9c',side]);g.fillRect(left,top,right-left,height);
    const rows=Math.max(4,Math.ceil(height/(r*.20))),cols=tier===0?5:4;
    for(let row=0;row<rows;row++){
      const y=top+(row+.5)*height/(rows+.45),step=(right-left)/cols;
      for(let col=0;col<cols;col++){
        g.fillStyle=(row*3+col+variant)%6===0?'#f8dc9ab5':window;
        g.fillRect(left+step*(col+.14),y,step*.70,height/(rows+.45)*.55);
      }
      g.fillStyle='#ffe9c94f';g.fillRect(left,y-2,right-left,1.15);
      g.strokeStyle='#bfd7e34f';g.lineWidth=1.2;g.beginPath();g.moveTo(right+1,y);g.lineTo(right+depth,y-rise);g.stroke();
    }
    faces.push({left,right,top,depth,rise});
    floor=top+1;
  }
  for(const {left,right,top,depth,rise} of faces){
    polygon(g,[[left,top],[left+depth,top-rise],[right+depth,top-rise],[right,top]],roof);
    polygon(g,[[left+3,top-2],[left+depth+3,top-rise+2],[right+depth-4,top-rise+2],[right-4,top-2]],variant%2?'#a5979d':'#6ba1ad');
    g.strokeStyle='#fff0c9c4';g.lineWidth=2;g.beginPath();g.moveTo(left,top);g.lineTo(right,top);g.lineTo(right+depth,top-rise);g.stroke();
  }
  const last=faces.at(-1), mast=last.top-last.rise*.5;
  if(variant%2===0){
    g.beginPath();g.moveTo(r*.12,mast);g.lineTo(r*.12,mast-r*.55);g.lineWidth=3;g.strokeStyle='#6d668a';g.stroke();
    ellipse(g,r*.12,mast-r*.55,3.5,3.5,'#ff907b');
  }else{
    ellipse(g,r*.08,mast,last.depth*.62,last.rise*.33,'#e3f3cc');
    label(g,'H',r*.08,mast,Math.max(12,r*.19),'#5b7e8c');
  }
}
const tallCache=new Map();
function tallArt(g,p){
  if(!tallCache.has(p.variant)){
    const canvas=document.createElement('canvas'),size=86;
    canvas.width=231;canvas.height=560;
    const brush=canvas.getContext('2d');brush.translate(112,523);
    landmark(brush,size,p.variant);tallCache.set(p.variant,canvas);
  }
  const image=tallCache.get(p.variant),scale=p.r/86;
  g.drawImage(image,-112*scale,-523*scale,231*scale,560*scale);
}

mount({
  title:'Hole City',highlight:'City',category:'City takeover',description:'Roam the waterfront, grow through whole neighborhoods, and race five rival holes.',
  orientation:'landscape',modes:['Timed','Endless','City Destruction'],unlockTitle:'Districts & vortex skins',
  defaults:{maxSize:0,total:0,map:0,skin:0,destroyed:0},root:46,tune:[0,3,7,10,7,5,3,10]
},api=>{
  const fx=particleKit(110);
  let world,worldIndex=-1,overview,levelScene,demo,player,rivals=[],props=[],cars=[],origin=null,
    vector={x:0,y:0},view,round=0,limit=0,done=false,tip=true,saveAt=0,savePending=false,hudAt=0,rng;
  const actor=(base,x,y,size)=>({...base,x,y,r:size,size,points:0,objects:0,buildings:0,target:null,think:base.think??0,phase:0});
  function loadDistrict(){
    if(world&&worldIndex===api.state.map)return;
    worldIndex=api.state.map;world=window.SGCityDistrict.create(worldIndex);
    demo=null;overview=document.createElement('canvas');overview.width=252;overview.height=182;
    const g=overview.getContext('2d');
    g.drawImage(world.ground,0,0,252,182);
  }
  function camera(x,y,zoom){
    const edgeY=Math.min(world.h*.5,api.h*.52/(zoom*tilt)),edgeX=Math.min(world.w*.5,api.w*.5/zoom+edgeY*shear);
    return {x:clamp(x,edgeX,world.w-edgeX),y:clamp(y,edgeY,world.h-edgeY),zoom};
  }
  function safeSpawn(angle,distance,cx=world.spawn.x,cy=world.spawn.y){
    for(let i=0;i<12;i++){
      const a=angle+i*.48,x=clamp(cx+Math.cos(a)*distance,70,world.w-70),y=clamp(cy+Math.sin(a)*distance,70,world.h-70);
      if(world.isLand(x,y))return {x,y};
    }
    return world.spawn;
  }
  function start(mode){
    loadDistrict();
    ({props,cars}=generate(world,worldIndex));
    rng=worldRng(1571+worldIndex*4096);
    round=0;limit=mode==='Timed'?135:mode==='City Destruction'?185:0;
    origin=null;vector={x:0,y:0};done=false;tip=true;saveAt=0;savePending=false;hudAt=0;
    player=actor({name:'You',color:skins[api.state.skin][1],isPlayer:true},world.spawn.x,world.spawn.y,mode==='City Destruction'?32:14);
    view=camera(player.x,player.y,1.05);
    rivals=rivalsData.map(([name,color],i)=>{
      const {x,y}=safeSpawn(-1.7+i*tau/rivalsData.length,386+i*83);
      return actor({name,color,index:i,think:i*.08},x,y,mode==='City Destruction'?23+i*.8:13+i*.56);
    });
    fx.clear();hud();
    if(mode==='Endless')api.controls([{label:'Finish run',action:()=>finish('City tour finished'),icon:'■'}]);
  }
  function ranking(){return [player,...rivals].sort((a,b)=>b.points-a.points||Number(!!b.isPlayer)-Number(!!a.isPlayer));}
  function hud(){
    const place=ranking().indexOf(player)+1;
    const values=[['Rank',place+'/6'],['Score',player.points],['Size',Math.floor(player.size)]];
    if(api.mode==='City Destruction')values.push(['Buildings',player.buildings+'/6']);
    if(limit)values.push(['Time',Math.max(0,Math.ceil(limit-round))]);
    api.hud(values);
  }
  function finish(head){
    if(done)return;
    done=true;api.save();
    api.end(player.points,head,'Place '+(ranking().indexOf(player)+1)+' of 6 · '+player.objects+' objects · size '+Math.floor(player.size)+'.');
  }
  function movement(p){
    if(!origin)return;
    const dx=p.x-origin.x,dy=p.y-origin.y,d=Math.hypot(dx,dy);
    vector.x=d>5?(dx-dy*shear/tilt)/Math.max(d,58):0;vector.y=d>5?dy/tilt/Math.max(d,58):0;
    if(d>12)tip=false;
  }
  function move(unit,dx,dy,dt,speed){
    const magnitude=Math.hypot(dx,dy),step=speed*dt/Math.max(1,magnitude);
    const x=clamp(unit.x+dx*step,18,world.w-18),y=clamp(unit.y+dy*step,18,world.h-18);
    if(world.isLand(x,y)){unit.x=x;unit.y=y;return;}
    if(world.isLand(x,unit.y))unit.x=x;
    if(world.isLand(unit.x,y))unit.y=y;
  }
  function requirement(p){
    return items[p.k][1]*clamp(.76+p.scale*.24,.90,1.10);
  }
  function accessible(unit,p){return !p.skip&&!p.owner&&unit.r>=requirement(p);}
  function chooseTarget(unit){
    let best=null,rank=0;
    for(const p of props){
      if(!accessible(unit,p))continue;
      const d=(unit.x-p.x)**2+(unit.y-p.y)**2;
      if(d>1200**2)continue;
      const weight=(3+items[p.k][2]*.38)/(1+d/(12700+unit.r*115));
      if(weight>rank){rank=weight;best=p;}
    }
    if(best)return best;
    return safeSpawn(unit.index*1.8+rng()*tau,200+rng()*280,unit.x,unit.y);
  }
  function moveRival(unit,dt){
    unit.think-=dt;unit.phase+=dt;
    if(!unit.target||unit.target.owner||unit.target.skip||unit.think<=0){
      unit.target=chooseTarget(unit);unit.think=.45+unit.index*.054+rng()*.24;
    }
    const dx=unit.target.x-unit.x,dy=unit.target.y-unit.y,d=Math.hypot(dx,dy);
    const beforeX=unit.x,beforeY=unit.y;
    if(d>5)move(unit,dx/d,dy/d,dt,124+unit.index*5+Math.min(unit.r,100)*.22);
    if(unit.x===beforeX&&unit.y===beforeY){
      const wiggle=unit.phase*1.7+unit.index*1.9;
      move(unit,Math.cos(wiggle),Math.sin(wiggle),dt,102);
    }
  }
  function updateTraffic(dt){
    for(const car of cars){
      if(car.owner||car.skip)continue;
      car.fraction+=car.speed*dt*car.dir;
      if(car.fraction<0||car.fraction>=1)car.fraction=car.dir===1?.001:.999;
      const pos=routeAt(car.road,car.fraction);
      car.x=pos.x-Math.sin(pos.angle)*car.offset;car.y=pos.y+Math.cos(pos.angle)*car.offset;
      car.angle=pos.angle+(car.dir===1?0:Math.PI);
    }
  }
  function swallow(p){
    const who=p.owner,[,,,mass]=items[p.k];
    const prior=Math.floor(who.size);
    who.points+=items[p.k][2];who.objects++;
    who.size=Math.min(190,Math.sqrt(who.size**2+mass*clamp(p.scale,.73,1.20)));
    if(big.has(p.k))who.buildings++;
    p.skip=true;
    if(!who.isPlayer)return;
    api.state.total++;
    if(big.has(p.k))api.state.destroyed++;
    api.state.maxSize=Math.max(api.state.maxSize,Math.floor(player.size));
    if(districts.some(([,min])=>min>prior&&min<=player.size)||skins.some(([,,min])=>min>prior&&min<=player.size)){
      api.notice('New district or vortex unlocked');api.tone('level');
    }else if(big.has(p.k)){api.notice(p.k==='landmark'?'Landmark swallowed':'Building swallowed');api.tone('combo');}
    else api.tone('good');
    fx.burst(player.x,player.y,player.color,big.has(p.k)?18:5,big.has(p.k)?172:93,12);
    api.buzz();savePending=true;
  }
  function updateProps(dt,units){
    for(const p of props){
      if(p.skip)continue;
      if(p.owner){
        p.fall+=dt;p.x=lerp(p.x,p.owner.x,Math.min(1,dt*7));p.y=lerp(p.y,p.owner.y,Math.min(1,dt*7));
        if(p.fall>=(big.has(p.k)?.73:.41))swallow(p);
        continue;
      }
      for(const unit of units){
        const range=Math.max(7,unit.r*.80-p.r*.10);
        if(Math.abs(unit.x-p.x)>range||Math.abs(unit.y-p.y)>range)continue;
        if(accessible(unit,p)&&(unit.x-p.x)**2+(unit.y-p.y)**2<range*range){
          p.owner=unit;break;
        }
      }
    }
  }
  function clash(){
    if(round<16)return;
    for(const rival of rivals){
      const distance=Math.hypot(rival.x-player.x,rival.y-player.y);
      if(rival.r>player.r*1.36&&distance<rival.r*.64){
        fx.burst(player.x,player.y,rival.color,28,180,17);
        finish(rival.name+' swallowed you');return;
      }
      if(player.r>rival.r*1.38&&distance<player.r*.67){
        player.points+=Math.round(rival.points*.34)+38;
        player.size=Math.min(190,Math.sqrt(player.size**2+rival.size**2*.36));
        api.state.maxSize=Math.max(api.state.maxSize,Math.floor(player.size));savePending=true;
        const turned=safeSpawn(rival.index*1.6+round,730,player.x,player.y);
        Object.assign(rival,{...turned,target:null,think:0,r:14,size:14});
        fx.burst(player.x,player.y,rival.color,22,148,20);
        api.notice('Rival swallowed · '+rival.name);api.tone('combo');
      }
    }
  }
  function update(dt){
    round+=dt;
    if(limit&&round>=limit){finish('Time is up');return;}
    if(api.mode==='City Destruction'&&player.buildings>=6){finish('Skyline cleared');return;}
    move(player,vector.x,vector.y,dt,168+Math.min(player.r,120)*.40);
    for(const rival of rivals)moveRival(rival,dt);
    const units=[player,...rivals];
    for(const unit of units)unit.r=lerp(unit.r,unit.size,1-Math.exp(-dt*5));
    updateTraffic(dt);updateProps(dt,units);clash();
    view.zoom=lerp(view.zoom,clamp(1.12-player.r*.0031,.53,1.09),1-Math.exp(-dt*2.8));
    const target=camera(player.x,player.y,view.zoom);
    view=camera(lerp(view.x,target.x,1-Math.exp(-dt*6)),lerp(view.y,target.y,1-Math.exp(-dt*6)),view.zoom);
    fx.update(dt);
    if(savePending&&round>=saveAt){saveAt=round+.65;savePending=false;api.save();}
    if(round>=hudAt){hudAt=round+.19;hud();}
  }
  function hole(g,x,y,r,color,time){
    const glow=g.createRadialGradient(x,y,Math.max(1,r*.50),x,y,r*1.46);
    glow.addColorStop(0,'#270e44');glow.addColorStop(.51,color+'b8');glow.addColorStop(1,color+'00');
    ellipse(g,x,y,r*1.46,r*1.46,glow);ellipse(g,x,y,r,r,'#08041c');
    g.save();g.translate(x,y);
    for(let j=0;j<4;j++){
      const sign=j%2?1:-1;
      g.beginPath();g.ellipse(0,0,r*(.78+j*.075),r*(.63+j*.10),j*.57+time*.52,time*sign*2+j,time*sign*2+j+Math.PI*1.53);
      g.lineCap='round';g.strokeStyle=j===3?'#eee2ff':color;g.globalAlpha=.53+j*.10;g.lineWidth=Math.max(1.5,r*.043-j*.18);g.stroke();
    }
    g.restore();
  }
  function drawMinimap(g){
    const wide=api.w>760,w=wide?133:100,h=wide?88:67,x=api.w-w-12,y=77;
    box(g,x-4,y-4,w+8,h+8,9,'#1d1539e8');
    g.save();g.beginPath();g.roundRect(x,y,w,h,6);g.clip();
    g.drawImage(overview,x,y,w,h);
    for(const unit of [...rivals,player]){
      const px=x+unit.x/world.w*w,py=y+unit.y/world.h*h;
      ellipse(g,px,py,unit.isPlayer?4:2.8,unit.isPlayer?4:2.8,unit.color);
      if(unit.isPlayer)ellipse(g,px,py,1.5,1.5,'#fff');
    }
    g.restore();
  }
  function drawLeaders(g){
    const x=api.w-145,y=177,leaders=ranking().slice(0,3);
    box(g,x,y,132,77,8,'#1c153bdf');
    leaders.forEach((unit,i)=>{
      const line=y+14+i*23;
      ellipse(g,x+12,line,3.2,3.2,unit.color);
      label(g,(i+1)+'  '+unit.name,x+21,line,12,unit.isPlayer?'#fff':'#e0d2ef','left');
      label(g,''+unit.points,x+121,line,12,'#fff','right');
    });
  }
  function draw(g,now,screen){
    loadDistrict();const {w,h}=api;
    const menu=screen==='menu'||!view;
    if(menu&&!demo){
      demo=generate(world,worldIndex).props;
      const center=world.plots.filter(p=>p.zone==='downtown').find(p=>p.r>82&&p.x>world.w*.43&&p.x<world.w*.72&&p.y>world.h*.20)??world.spawn;
      levelScene={x:center.x-225,y:center.y+90,zoom:.87};
    }
    const scene=menu?camera(levelScene.x,levelScene.y,levelScene.zoom):view;
    const z=scene.zoom,screenX=x=>w*.5+(x-scene.x)*z,screenY=y=>h*.52+(y-scene.y)*z*tilt;
    const project=(x,y)=>({x:screenX(x)+(y-scene.y)*z*shear,y:screenY(y)});
    g.fillStyle='#327e92';g.fillRect(0,0,w,h);
    const show=menu?demo:props;
    const units=menu?[{x:scene.x+w*.24/z,y:scene.y+105,r:72,color:skins[api.state.skin][1]}]:[...rivals,player];
    g.save();
    g.transform(z,0,z*shear,z*tilt,w*.5-z*(scene.x+scene.y*shear),h*.52-z*tilt*scene.y);
    g.drawImage(world.ground,0,0,world.w,world.h);
    for(const unit of units)hole(g,unit.x,unit.y,unit.r,unit.color,now);
    g.restore();
    const visible=show.filter(p=>{
      if(p.skip)return false;
      const pos=project(p.x,p.y);
      return pos.x>-p.r*z*2-25&&pos.x<w+p.r*z*2+25&&pos.y>-60&&pos.y<h+Math.max(70,p.r*z*(p.k==='landmark'?6:4));
    }).sort((a,b)=>a.y-b.y);
    for(const p of visible){
      const pos=project(p.x,p.y);
      g.save();g.translate(pos.x,pos.y);g.scale(z,z);
      if(p.owner){
        const fraction=1-clamp(p.fall/(big.has(p.k)?.73:.41),0,.98);
        g.rotate((p.variant%2?1:-1)*(1-fraction)*.94);
        g.scale(fraction,fraction*.85);g.globalAlpha=fraction;
      }else if(p.road){
        const angle=Math.atan2(tilt*Math.sin(p.angle),Math.cos(p.angle)+shear*Math.sin(p.angle));
        g.rotate(angle);
      }
      if(p.k==='landmark')tallArt(g,p);else art.draw(g,p.k,p.r,p.variant);
      g.restore();
    }
    if(!menu){
      g.save();
      g.transform(z,0,z*shear,z*tilt,w*.5-z*(scene.x+scene.y*shear),h*.52-z*tilt*scene.y);
      fx.draw(g);g.restore();
      for(const unit of units){
        const pt=project(unit.x,unit.y);
        if(pt.x<12||pt.x>w-12||pt.y<18||pt.y>h-16)continue;
        const nameY=pt.y+Math.max(17,unit.r*z*tilt+12);
        box(g,pt.x-25,nameY-8,50,16,5,'#1f1337e5');label(g,unit.name,pt.x,nameY,11,unit.color);
      }
      if(screen==='play'){
        drawMinimap(g);if(w>735)drawLeaders(g);
        if(tip&&round<11){
          box(g,w/2-107,h*.84-18,214,34,12,'#201535dc');
          label(g,'Drag to move',w/2,h*.84,19,'#fff2ff');
        }
        if(origin&&Math.hypot(vector.x,vector.y)>.1){
          ellipse(g,origin.x,origin.y,32,32,'#1e133b6b');
          ellipse(g,origin.x+vector.x*18,origin.y+vector.y*15,10,10,player.color+'a1');
        }
      }
    }
  }
  function unlocks(){
    api.showChoices('Districts & vortex skins','Size record '+api.state.maxSize+' · '+api.state.total+' lifetime objects',[
      ...districts.map(([name,need],i)=>({label:name,detail:need>api.state.maxSize?'Reach size '+need:'Select district',disabled:need>api.state.maxSize,selected:i===api.state.map,action(){api.state.map=i;api.save();unlocks();}})),
      ...skins.map(([name,,need],i)=>({label:name,detail:need>api.state.maxSize?'Reach size '+need:'Vortex skin',disabled:need>api.state.maxSize,selected:i===api.state.skin,action(){api.state.skin=i;api.save();unlocks();}})),
      {label:'Skyline eater',detail:api.state.destroyed>=10?'Achievement earned':'Swallow 10 buildings ('+api.state.destroyed+'/10)'},
      {label:'Street sweep',detail:api.state.total>=100?'Achievement earned':'Swallow 100 total objects ('+api.state.total+'/100)'}
    ]);
  }
  function cancel(){origin=null;vector.x=vector.y=0;}
  return {start,update,draw,unlocks,recordText:()=>api.state.maxSize+' size record · '+api.state.total+' lifetime objects',
    down(p){origin=p;},move:movement,up:cancel,cancel};
});
})();
