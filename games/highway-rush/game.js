'use strict';
(() => {
const {mount,clamp,lerp,rnd,tau,box,ellipse,polygon,gradient,label,particleKit}=SGArcade;
const art=window.SGHighwayArt;
const routes=['Sunset City','Desert Highway','Night City','Coastal Highway','Mountain Highway'];
const vehicles=[
 ['Crimson GT','sport','#ed362b',0],['Alpine Coupé','sport','#49a0f2',70],['Monarch V8','muscle','#efac31',110],
 ['Nightline RT','muscle','#62657e',145],['Vortex R','super','#b850fe',205],['Helix X','super','#ff664f',295],
 ['Trail Scout','suv','#729961',85],['Sierra 4×4','suv','#5a97b2',130],['Summit XL','suv','#d6e1ed',245],
 ['Silverline','sedan','#bccbda',55],['Metro LX','sedan','#e77ba4',100],['Grand Touring','sport','#23cbb0',345]
];
const paint=['#ed362b','#efac31','#49a0f2','#23cbb0','#f1ede8','#693cc0','#28293a'];
const traffic=[['sedan','#dae8ef'],['truck','#c7c6be'],['suv','#549deb'],['muscle','#f8aa34'],['sedan','#936eaa'],['sport','#aad2a6']];
const day=()=>new Date().toLocaleDateString('en-CA');
function objective(){const n=[...day()].reduce((a,k)=>a+k.charCodeAt(0),0)%3;return [['Collect 24 coins',24,28,'coins'],['Drive 1,600 m',1600,35,'distance'],['Make 8 near misses',8,36,'near']][n];}

mount({title:'Highway Rush',highlight:'Rush',category:'Traffic racer',description:'Weave between lanes, collect gold and hit nitro when the highway opens up.',orientation:'portrait',modes:['Highway','Daily'],unlockTitle:'Garage & routes',defaults:{coins:0,car:0,owned:[0],paints:{},upgrades:{},route:0,dist:0,claimed:''},root:43,tune:[0,0,7,3,0,10,7,3],format:n=>n+' m'},api=>{
  const fx=particleKit(135);
  let backdrop,route=0,position=1,lane=1,meters=0,score=0,totalCoins=0,near=0,charge=0,nitro=0,trafficList=[],clock=0,spawnAt=.7,travel=0,origin=null,impact=0,crashed=false,tip=true,flash=0,daily=null;
  const horizon=()=>api.h*.32;
  function project(l,z){
    const far=1/(1+132/17),depth=(1/(1+Math.max(-8,z)/17)-far)/(1-far),t=clamp(depth,0,1.5);
    const hw=lerp(12,api.w*.57,t);
    return {x:api.w/2+(l-1)*hw*.59,y:lerp(horizon(),api.h*.84,t),w:hw,s:lerp(.065,1.02,t)};
  }
  function cachedArt(){
    backdrop=document.createElement('canvas');backdrop.width=api.w;backdrop.height=api.h;
    art.backdrop(backdrop.getContext('2d'),api.w,api.h,route,horizon());
  }
  function start(mode){
    route=api.state.route;position=lane=1;meters=score=totalCoins=near=0;charge=.43;nitro=0;trafficList=[];clock=0;spawnAt=.64;travel=0;origin=null;impact=0;crashed=false;tip=true;flash=0;
    daily=mode==='Daily'?objective():null;fx.clear();cachedArt();
    api.controls([{label:'◀ Lane',action:()=>change(-1)},{label:'Nitro',action:boost,id:'nitro'},{label:'Lane ▶',action:()=>change(1)}]);hud();
  }
  function change(direction){if(!crashed){lane=clamp(lane+direction,0,2);tip=false;}}
  function boost(){
    if(crashed||nitro>0||charge<.32)return;
    charge-=.32;nitro=1.9+upgrade()*.31;flash=.35;tip=false;api.tone('nitro');api.buzz();
  }
  function upgrade(){return api.state.upgrades[api.state.car]||0;}
  function trafficRow(){
    const a=Math.floor(rnd(0,3)), b=(a+1+Math.floor(rnd(0,2)))%3;
    const place=(l,z)=>{
      const type=traffic[Math.floor(rnd(0,traffic.length))];
      trafficList.push({kind:'car',lane:l,z,type,checked:false,speed:rnd(.74,1)});
    };
    place(a,132);
    if(clock>16&&Math.random()<Math.min(.58,.2+clock*.004))place(b,137);
    const openLane=[0,1,2].find(l=>l!==a&&l!==b);
    for(let i=0;i<3;i++)trafficList.push({kind:'coin',lane:openLane,z:128+i*8,speed:1});
    if(clock>29&&Math.random()<.27)trafficList.push({kind:'cone',lane:b,z:118,speed:1});
  }
  function hud(){
    api.hud([['Distance',Math.floor(meters)+' m'],['Gold',totalCoins],['Nitro',Math.floor(charge*100)+'%']]);
    const nitroButton=document.getElementById('nitro');
    if(nitroButton)nitroButton.disabled=charge<.32||nitro>0||crashed;
  }
  function finish(){
    api.state.dist=Math.max(api.state.dist,Math.floor(meters));api.save();
    api.end(Math.floor(meters),'Run complete',Math.floor(meters)+' m · '+score+' score · '+totalCoins+' coins · '+near+' near misses.');
  }
  function update(dt){
    clock+=dt;flash=Math.max(0,flash-dt);fx.update(dt);
    if(crashed){impact-=dt;if(impact<=0)finish();return;}
    nitro=Math.max(0,nitro-dt);charge=clamp(charge+dt*.019,0,1);
    position=lerp(position,lane,1-Math.exp(-dt*(10.8+upgrade()*1.35)));
    const rate=29+Math.min(clock*.92,36)+upgrade()*1.8+(nitro>0?23:0);
    meters+=rate*dt*2.3;score=Math.floor(meters)+near*45+totalCoins*10;travel+=rate*dt;
    if(clock>spawnAt){trafficRow();spawnAt=clock+Math.max(1.00,1.92-clock*.010)*rnd(.92,1.12);}
    for(let i=trafficList.length-1;i>=0;i--){
      const p=trafficList[i],old=p.z;p.z-=rate*dt*p.speed;
      const delta=Math.abs(position-p.lane);
      if(p.kind==='coin'&&p.z<3&&old>=-3&&delta<.48){
        totalCoins++;api.state.coins++;charge=Math.min(1,charge+.081);
        const point=project(p.lane,0);fx.burst(point.x,point.y-35,'#ffe06b',12,119,-75);
        api.tone('coin');api.buzz();api.save();trafficList.splice(i,1);continue;
      }
      if(p.kind!=='coin'&&p.z<3&&p.z> -3&&delta<(p.kind==='car'?.42:.32)){
        crashed=true;impact=.76;flash=.65;api.tone('fail');api.buzz('heavy');
        const point=project(position,0);fx.burst(point.x,point.y-40,'#ff8248',34,280,300);hud();break;
      }
      if(p.kind==='car'&&!p.checked&&p.z< -2){
        p.checked=true;
        if(delta<1.19){near++;charge=Math.min(1,charge+.045);api.notice('Near miss · +45');api.tone('combo');}
      }
      if(p.z< -13)trafficList.splice(i,1);
    }
    if(daily&&api.state.claimed!==day()){
      const progress={coins:totalCoins,distance:meters,near}[daily[3]];
      if(progress>=daily[1]){
        api.state.claimed=day();api.state.coins+=daily[2];api.save();
        api.notice('Daily complete · +'+daily[2]+' gold');api.tone('level');api.buzz();
      }
    }
    hud();
  }
  const isNight=()=>route===2;
  function road(g){
    const {w,h}=api, n=horizon(),bottom=project(1,0),end=project(1,-8);
    const asphalt=gradient(g,0,n,0,h,isNight()?['#45506d','#171a29']:['#5d4c5a','#242835']);
    polygon(g,[[w/2-13,n],[w/2+13,n],[w/2+end.w*1.16,h],[w/2-end.w*1.16,h]],asphalt);
    for(const s of [-1,1]){
      g.strokeStyle=isNight()?'#95a3cf':'#f5ded3';g.lineWidth=2;
      g.beginPath();g.moveTo(w/2+s*14,n);g.lineTo(w/2+s*end.w,h);g.stroke();
    }
    const dash=travel%13;
    for(let z=5-dash;z<132;z+=13){
      const a=project(1,z),b=project(1,z+5);
      for(const laneSign of [-1,1]){
        const aX=a.x+laneSign*a.w*.302,bX=b.x+laneSign*b.w*.302;
        polygon(g,[[aX-3*a.s,a.y],[aX+3*a.s,a.y],[bX+3*b.s,b.y],[bX-3*b.s,b.y]],'#fff4d3c4');
      }
    }
    for(let z=4-(travel*.95%15);z<115;z+=15){
      const p=project(1,z);
      for(const s of [-1,1]){
        const x=p.x+s*(p.w+6*p.s);
        g.fillStyle='#cdd2da74';g.fillRect(x-p.s,p.y-13*p.s,2*p.s,14*p.s);
        ellipse(g,x,p.y-12*p.s,2.7*p.s,1.9*p.s,isNight()?'#f4c46e':'#fff5df');
      }
    }
    const sign=project(1,125-travel%177);
    if(sign.y<h*.76){
      const spread=sign.w*.96,high=95*sign.s,base=sign.y-high;
      for(const side of [-1,1])box(g,sign.x+side*spread-2*sign.s,base,4*sign.s,high+5*sign.s,sign.s,'#a4a4ad');
      box(g,sign.x-spread,base,spread*2,6*sign.s,sign.s,'#909299');
      const signWidth=91*sign.s;
      box(g,sign.x-signWidth/2,base-9*sign.s,signWidth,22*sign.s,3*sign.s,'#175850');
      box(g,sign.x-signWidth/2+4*sign.s,base-6*sign.s,signWidth-8*sign.s,1.1*sign.s,0,'#b6ead5');
      label(g,route===0?'CITY CENTER':'KEEP RIGHT',sign.x,base+3*sign.s,Math.max(1.3,10*sign.s),'#f4f8dd');
    }
    if(nitro>0){
      for(let i=0;i<22;i++){
        const x=(i*113)%w,y=(clock*800+i*107)%h, dx=x-w/2;
        if(Math.abs(dx)<45)continue;
        g.strokeStyle=i%2?'#e5ffff67':'#3d91ff77';g.lineWidth=i%3+1;g.beginPath();
        g.moveTo(x,y);g.lineTo(x+dx*.18,y+h*.14);g.stroke();
      }
      const color=gradient(g,0,bottom.y-5,0,bottom.y+70,['#edffff','#54b8ef','#694cff05']);
      const p=project(position,0);
      for(const s of [-1,1])polygon(g,[[p.x+s*28-7,p.y-7],[p.x+s*28+7,p.y-7],[p.x+s*39,p.y+60],[p.x+s*28,p.y+71]],color);
    }
  }
  function carColor(i){return api.state.paints[i]||vehicles[i][2];}
  function draw(g,now,screen){
    if(!backdrop||route!==api.state.route){route=api.state.route;cachedArt();}
    g.drawImage(backdrop,0,0);
    if(screen==='menu')travel=now*24;
    road(g);
    for(const item of [...trafficList].sort((a,b)=>b.z-a.z)){
      const p=project(item.lane,item.z);
      if(item.kind==='coin')art.coin(g,p.x,p.y-22*p.s,12*p.s,now*4+item.z);
      if(item.kind==='car')art.drawCar(g,p.x,p.y,p.s*.73,item.type[1],item.type[0]);
      if(item.kind==='cone'){
        polygon(g,[[p.x-15*p.s,p.y],[p.x+15*p.s,p.y],[p.x+10*p.s,p.y-6*p.s],[p.x-9*p.s,p.y-6*p.s]],'#542f2d');
        polygon(g,[[p.x-10*p.s,p.y-5*p.s],[p.x+10*p.s,p.y-5*p.s],[p.x+3*p.s,p.y-25*p.s],[p.x-3*p.s,p.y-25*p.s]],'#ff822f');
        g.fillStyle='#fff7d5';g.fillRect(p.x-6*p.s,p.y-13*p.s,12*p.s,3*p.s);
      }
    }
    const p=project(position,0), i=api.state.car;
    g.save();
    if(crashed){g.translate(p.x,p.y);g.rotate((.76-impact)*2.7);g.translate(-p.x,-p.y);}
    art.drawCar(g,p.x,p.y,p.s*1.07,carColor(i),vehicles[i][1],true);g.restore();fx.draw(g);
    if(flash>0){
      g.fillStyle=crashed?'rgba(255,71,63,'+flash*.35+')':'rgba(68,161,255,'+flash*.32+')';g.fillRect(0,0,api.w,api.h);
    }
    if(screen==='play'&&tip&&clock<6)label(g,'Swipe to change lanes',api.w/2,api.h*.57,22,'#fff2da');
  }
  function garage(){
    const i=api.state.car,up=upgrade(),cost=60+up*65;
    const [task,,bonus]=objective();
    api.showChoices('Garage & routes',api.state.coins+' gold · '+vehicles[i][0]+' equipped',[
      {label:'Daily challenge',detail:task+' · '+(api.state.claimed===day()?'claimed':bonus+' gold reward')},
      {label:'Paint shop',detail:'Choose a finish for '+vehicles[i][0],action:paints},
      {label:'Performance · '+up+'/3',detail:up>=3?'Fully upgraded':cost+' gold · handling and nitro',disabled:up>=3||api.state.coins<cost,action(){api.state.coins-=cost;api.state.upgrades[i]=up+1;api.save();garage();}},
      ...routes.map((name,n)=>({label:name,detail:n*400>api.state.dist?'Reach '+n*400+' m to unlock':n===api.state.route?'Selected route':'Drive here',disabled:n*400>api.state.dist,selected:n===api.state.route,action(){api.state.route=n;api.save();garage();}})),
      ...vehicles.map(([name,body,,price],n)=>{
        const owned=api.state.owned.includes(n);
        return {label:name,detail:(body==='super'?'Supercar':body==='suv'?'SUV':body)+' · '+(owned?n===i?'equipped':'owned':price+' gold'),disabled:!owned&&api.state.coins<price,selected:n===i,
          action(){if(!owned){api.state.coins-=price;api.state.owned.push(n);api.tone('level');}api.state.car=n;api.save();garage();}};
      })
    ]);
  }
  function paints(){
    const i=api.state.car;
    api.showChoices('Paint shop',vehicles[i][0],paint.map((color,n)=>({label:['Crimson','Marigold','Glacier','Jade','Pearl','Ultraviolet','Graphite'][n],detail:color===carColor(i)?'Equipped':'Apply finish',selected:color===carColor(i),action(){api.state.paints[i]=color;api.save();paints();}})),garage);
  }
  return {start,update,draw,unlocks:garage,resize(){backdrop=null;},recordText:()=>api.state.dist+' m lifetime best · '+api.state.coins+' gold in garage',
    down(p){origin=p;},move(p){if(!origin)return;const dx=p.x-origin.x,dy=p.y-origin.y;if(Math.abs(dx)>28&&Math.abs(dx)>Math.abs(dy)){change(Math.sign(dx));origin=null;}else if(dy< -34&&-dy>Math.abs(dx)){boost();origin=null;}},
    up(){origin=null;},cancel(){origin=null;}
  };
});
})();
