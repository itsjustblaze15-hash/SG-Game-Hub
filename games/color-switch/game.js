'use strict';
(() => {
const {mount,clamp,lerp,tau,ellipse,box,polygon,gradient,label,particleKit}=SGArcade;
const colors=['#ffe45d','#31eafa','#ff45be','#a876ff'];
const colorNames=['Yellow','Cyan','Pink','Purple'];
const skins=[['Luminous Orb',0,'orb'],['Cut Crystal',12,'gem'],['Twin Spark',28,'double'],['Nova Crown',55,'star']];
const trails=[['Light Ribbon',0,.23],['Comet Tail',15,.36],['Charged Halo',44,.53]];
const frames=['circle','shutter','diamond','double'];
const center=210, safeDistance=36, gravity=580, hopSpeed=259, gateSpacing=147;

function star(g,x,y,r,fill){
  const points=Array.from({length:10},(_,i)=>{
    const a=i*tau/10-Math.PI/2,d=r*(i%2?.48:1);
    return [x+Math.cos(a)*d,y+Math.sin(a)*d];
  });
  polygon(g,points,fill);
}
function diamond(g,x,y,r,color){
  polygon(g,[[x,y-r],[x+r*.72,y],[x,y+r],[x-r*.72,y]],color);
  polygon(g,[[x,y-r],[x,y+r],[x-r*.72,y]],'#ffffff52');
}
function mod(n,m){return (n%m+m)%m;}
function paletteAt(gate,time){
  const segment=74;
  const offset=gate.fixed ? 0 : Math.sin(time*gate.rate+gate.phase)*125;
  return {segment,first:center-segment/2+offset,base:gate.pattern};
}
function crossingColor(gate,time){
  const {segment,first,base}=paletteAt(gate,time);
  return mod(Math.floor((center-first)/segment)+base,4);
}

mount({
  title:'Color Switch',highlight:'Switch',category:'Neon arcade',
  description:'Tap to hop. Go through the bar when it matches your ball.',
  desktopHelp:'Press Space or click to hop. Pass through the middle when its color matches your ball.',
  orientation:'portrait',modes:['Endless','Level','Challenge'],unlockTitle:'Ball lab & levels',
  defaults:{diamonds:0,ball:0,trail:0,unlocked:1,level:1,gates:0},root:50,tune:[0,12,7,10,0,12,7,15]
},api=>{
  const fx=particleKit(108), keys=new Set();
  let altitude,velocity,camera,time,active,points,diamonds,cleared,course,trail,color,level,limit,lastGate,
    pressed,repeatAt,nextGate,problem,deadTime,guideTip,resting;

  function makeGate(index){
    const difficulty=api.mode==='Level'?level-1:api.mode==='Challenge'?2:0;
    const wanted=(index+Math.floor(index/3))%4;
    return {index,y:88+index*gateSpacing,wanted,fixed:index<2,
      kind:frames[(index+difficulty)%frames.length],phase:index*1.83,
      rate:.93+Math.min(15,index+difficulty)*.068,
      pattern:mod(wanted+(index>=2?index%3-1:0),4),passed:false,picked:false};
  }
  function start(){
    altitude=0;velocity=0;camera=0;time=0;active=false;points=0;diamonds=0;cleared=0;
    trail=[];color=0;pressed=false;repeatAt=0;nextGate=0;problem=null;deadTime=0;
    level=api.state.level;limit=api.mode==='Level'?4+level:api.mode==='Challenge'?7:0;
    course=Array.from({length:8},(_,i)=>makeGate(i));lastGate=7;
    guideTip=api.desktop?'Press Space or click to hop':'Tap anywhere to hop';resting=false;keys.clear();fx.clear();hud();
  }
  function hud(){
    const values=[['Ball',colorNames[color],{color:colors[color]}],['Score',points],['Diamonds',diamonds]];
    if(api.mode==='Level')values.push(['Level',level]);
    if(api.mode==='Challenge')values.push(['Time',Math.max(0,Math.ceil(48-time))]);
    api.hud(values);
  }
  function hop(){
    if(problem)return;
    active=true;velocity=hopSpeed;resting=false;
    repeatAt=time+.205;
    api.tone('button');
  }
  function fail(actual){
    problem={actual,needed:color};pressed=false;deadTime=.52;
    fx.burst(center,altitude,colors[color],28,196,-100);
    api.tone('fail');api.buzz('heavy');
  }
  function success(){
    if(api.mode==='Level'){
      api.state.unlocked=Math.max(api.state.unlocked,Math.min(10,level+1));api.save();
      api.end(points,'Level '+level+' cleared',cleared+' gates · '+diamonds+' diamonds.',
        level<10?{label:'Next level',action(){api.state.level=level+1;api.save();}}:null);
    }else api.end(points,'Challenge cleared',cleared+' gates · '+diamonds+' diamonds.');
  }
  function pickup(gate){
    gate.picked=true;color=course.find(item=>item.index===gate.index+1)?.wanted??mod(color+1,4);
    fx.burst(center,gate.y+31,colors[color],16,141,-70);
    api.tone('good');
    if(gate.index%2===1){
      awardDiamond();
      fx.burst(center,gate.y+31,'#fff096',10,113,-74);
    }
    if(gate.index<2)api.notice(colorNames[color]+' ball');
  }
  function awardDiamond(){
    diamonds++;points+=5;api.state.diamonds++;api.save();api.tone('coin');api.buzz();
  }
  function readyToHop(gate){
    const d=gate.y-altitude,discriminant=hopSpeed**2-2*gravity*d;
    if(d<0||discriminant<0)return false;
    const arrival=(hopSpeed-Math.sqrt(discriminant))/gravity;
    return crossingColor(gate,time)===color&&crossingColor(gate,time+arrival)===color;
  }
  function update(dt){
    fx.update(dt);
    if(problem){
      deadTime-=dt;
      if(deadTime<=0)api.end(points,'Wrong color',colorNames[problem.actual]+' was in the middle. Wait for '+colorNames[problem.needed]+' before you hop through.');
      return;
    }
    if(!active)return;
    time+=dt;
    if((pressed||keys.size)&&time>=repeatAt)hop();
    const gate=course.find(item=>item.index===nextGate);
    const before=altitude;
    altitude=Math.max(0,altitude+velocity*dt);
    velocity-=gravity*dt;
    const floor=gate.y-safeDistance;
    if(before>=floor&&altitude<=floor){
      altitude=floor;velocity=0;resting=true;
    }else if(altitude===0&&velocity<0)velocity=0;
    for(const item of course){
      if(item.passed&&!item.picked&&altitude>=item.y+31)pickup(item);
    }
    if(!gate.passed&&before<gate.y&&altitude>=gate.y){
      const matching=crossingColor(gate,time);
      if(matching!==color){altitude=gate.y;fail(matching);return;}
      gate.passed=true;cleared++;nextGate++;points+=10+Math.min(cleared,7);
      api.state.gates++;api.save();fx.burst(center,gate.y,colors[color],13,115,-78);api.tone('good');
      if(cleared%4===0)api.notice(cleared+' gates in a row');
    }
    if(limit&&cleared>=limit){success();return;}
    if(api.mode==='Challenge'&&time>48){api.end(points,'Time is up',cleared+' of '+limit+' gates cleared.');return;}
    if(lastGate<nextGate+7)course.push(makeGate(++lastGate));
    course=course.filter(item=>item.index>nextGate-4);
    camera=Math.max(camera,altitude-74);
    const target=course.find(item=>item.index===nextGate);
    if(resting||target.y-altitude<58)
      guideTip=readyToHop(target)?(api.desktop?'Matching color · hop now':'Matching color · tap to pass'):'Wait for '+colorNames[color];
    else if(cleared===0)guideTip=api.desktop?'Hold Space to reach the yellow bar':'Keep tapping to reach the yellow bar';
    else if(!course.find(item=>item.index===nextGate-1)?.picked)guideTip='Climb to the prism to switch colors';
    else guideTip=cleared<3?'The platform catches you while you wait':'';
    const length=trails[api.state.trail][2];
    if(!trail.length||Math.abs(altitude-trail[0].y)>3)trail.unshift({y:altitude,c:color,life:1});
    trail=trail.filter(p=>(p.life-=dt/length)>0).slice(0,32);
    hud();
  }
  function scene(g,now){
    const {w,h}=api;
    g.fillStyle=gradient(g,0,0,w,h,['#2b1656','#171d50','#120c2d']);g.fillRect(0,0,w,h);
    const bloom=g.createRadialGradient(w*.51,h*.41,9,w*.51,h*.41,h*.71);
    bloom.addColorStop(0,'#6246c385');bloom.addColorStop(.48,'#43257939');bloom.addColorStop(1,'#18123100');
    g.fillStyle=bloom;g.fillRect(0,0,w,h);
    for(let i=0;i<42;i++){
      const x=(i*183+67)%w,y=(i*103+(camera||0)*.24+now*(i%3+3))%h,r=1.2+i%4*.55;
      diamond(g,x,y,r,colors[i%4]+'4d');
    }
  }
  function ornaments(g,gate,y,now){
    g.save();g.translate(center,y);
    if(gate.kind==='diamond'){
      g.rotate(now*.31+gate.index);
      polygon(g,[[0,-72],[72,0],[0,72],[-72,0]],'#7650b756');
      polygon(g,[[0,-63],[63,0],[0,63],[-63,0]],'#1b164e');
    }else if(gate.kind!=='shutter'){
      const r=gate.kind==='double'?70:59;
      for(let j=0;j<4;j++){
        const d=now*.30+j*tau/4+gate.index;
        g.beginPath();g.arc(0,0,r,d,d+tau/4-.07);g.lineWidth=5;
        g.strokeStyle=colors[j]+'55';g.stroke();
      }
      if(gate.kind==='double'){
        g.beginPath();g.arc(0,0,r-9,0,tau);g.lineWidth=2;g.strokeStyle='#ab87ed79';g.stroke();
      }
    }else{
      box(g,-148,-29,296,58,13,'#382564a8');
      box(g,-140,-24,280,48,10,'#171541');
    }
    g.restore();
  }
  function drawGate(g,gate,y,now,activeGate){
    ornaments(g,gate,y,now);
    const {segment,first,base}=paletteAt(gate,time||0);
    const left=58,right=362;
    g.save();g.beginPath();g.roundRect(left,y-10,right-left,20,9);g.clip();
    for(let n=-5;n<=5;n++){
      const x=first+n*segment;
      if(x+segment<left||x>right)continue;
      const c=colors[mod(base+n,4)];
      g.fillStyle=gradient(g,x,y-10,x,y+10,[[0,c],[.26,c],[1,c+'85']]);
      g.fillRect(x,y-10,segment,20);
      g.fillStyle='#fff8';g.fillRect(x+2,y-8,Math.max(1,segment-4),2);
      g.fillStyle='#160a2e80';g.fillRect(x,y-10,2,20);
    }
    g.restore();
    if(activeGate){
      const c=colors[crossingColor(gate,time||0)];
      box(g,center-13,y-16,26,32,5,'#ffffff');
      box(g,center-10,y-13,20,26,3,c);
      polygon(g,[[center-10,y+22],[center+10,y+22],[center,y+31]],c);
      polygon(g,[[center-8,y-22],[center+8,y-22],[center,y-30]],c);
    }
  }
  function orb(g,y,now){
    const hue=colors[color],glow=g.createRadialGradient(center,y,3,center,y,27);
    glow.addColorStop(0,hue);glow.addColorStop(.49,hue+'6a');glow.addColorStop(1,hue+'00');
    ellipse(g,center,y,27,27,glow);
    const form=skins[api.state.ball][2];
    if(form==='gem')diamond(g,center,y,13,hue);
    else if(form==='star')star(g,center,y,14,hue);
    else{
      ellipse(g,center,y,11,11,hue);ellipse(g,center-3,y-3,4,4,'#fffbe5');
      if(form==='double')ellipse(g,center+9*Math.cos(now*7),y+9*Math.sin(now*7),4,4,'#fff');
    }
  }
  function draw(g,now,screen){
    scene(g,now);
    const {w,h}=api,sy=y=>h*.73-(y-camera);
    if(screen==='menu'){
      drawGate(g,{kind:'double',index:0,fixed:false,rate:1.3,phase:now,pattern:1},h*.71,now,true);
      for(let i=0;i<6;i++)diamond(g,44+i*68,h*.81+Math.sin(now*2+i)*24,8,colors[i%4]);
      return;
    }
    if(!course)return;
    const gate=course.find(item=>item.index===nextGate);
    const from=sy(altitude),to=gate?Math.max(0,sy(gate.y)):0;
    g.save();g.setLineDash([3,8]);g.strokeStyle='#ede3ff61';g.lineWidth=2;
    g.beginPath();g.moveTo(center,from);g.lineTo(center,to);g.stroke();g.restore();
    for(const item of course){
      const y=sy(item.y);
      if(y< -110||y>h+110)continue;
      drawGate(g,item,y,now,item===gate&&!problem);
      if(item===gate&&!problem){
        const shelfY=sy(item.y-safeDistance)+12;
        box(g,center-33,shelfY,66,4,2,'#d4bfff88');
      }
      if(!item.picked){
        const y2=sy(item.y+31),target=course.find(gate=>gate.index===item.index+1)?.wanted??0;
        g.save();g.translate(center,y2);g.rotate(Math.sin(now*6)*.13);diamond(g,0,0,9,colors[target]);g.restore();
        if(item.index%2===1)star(g,center+23,y2,8,'#ffe47e');
      }
    }
    g.save();g.translate(0,h*.73+camera);g.scale(1,-1);fx.draw(g);g.restore();
    for(const p of [...trail].reverse()){
      g.globalAlpha=p.life*.7;ellipse(g,center,sy(p.y),4+5*p.life,4+5*p.life,colors[p.c]);
    }
    g.globalAlpha=1;
    if(!problem)orb(g,sy(altitude),now);
    if(guideTip&&screen==='play'&&!problem){
      const end=h*.90, c=gate&&readyToHop(gate)?colors[color]:'#e8e1ff';
      box(g,25,end-25,w-50,52,15,'#15112ddd');
      label(g,guideTip,w/2,end-1,16,c);
      if(!active)label(g,'Only the color in the white frame matters.',w/2,end+16,11,'#d3c4f4');
    }
  }
  function unlocks(){
    api.showChoices('Ball lab & levels',api.state.diamonds+' lifetime diamonds · '+api.state.gates+' gates cleared',[
      ...skins.map(([name,min],n)=>({label:name,detail:min>api.state.diamonds?min+' diamonds required':'Ball design',selected:api.state.ball===n,disabled:min>api.state.diamonds,action(){api.state.ball=n;api.save();unlocks();}})),
      ...trails.map(([name,min],n)=>({label:name,detail:min>api.state.diamonds?min+' diamonds required':'Trail effect',selected:api.state.trail===n,disabled:min>api.state.diamonds,action(){api.state.trail=n;api.save();unlocks();}})),
      ...Array.from({length:10},(_,i)=>({label:'Level '+(i+1),detail:i<api.state.unlocked?'Select for Level mode':'Clear the previous level',selected:api.state.level===i+1,disabled:i>=api.state.unlocked,action(){api.state.level=i+1;api.save();unlocks();}}))
    ]);
  }
  function guide(){
    api.showChoices('How to play','The ball climbs straight up the middle.',[
      {label:'1. Hop upward',detail:api.desktop?'Use Space, the up arrow, or click. Hold to keep hopping.':'Tap anywhere. Hold to keep hopping.'},
      {label:'2. Match the middle color',detail:'Hop through the white frame when it shows the color of your ball.'},
      {label:'3. Land and wait',detail:'The little platform catches you below the bar. Pick up a prism above the bar to swap colors.'}
    ]);
  }
  function key(key,down){
    if(key!==' '&&key!=='ArrowUp')return false;
    if(down&&!keys.has(key)){keys.add(key);hop();}
    if(!down)keys.delete(key);
    return true;
  }
  function stop(){pressed=false;}
  return {start,update,draw,unlocks,guide,key,down(){pressed=true;hop();},up:stop,cancel(){stop();keys.clear();},
    recordText:()=>api.state.gates+' lifetime gates · '+api.state.diamonds+' diamonds'};
});
})();
