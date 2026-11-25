'use strict';
(() => {
const {mount,clamp,lerp,rnd,tau,ellipse,box,polygon,gradient,label,particleKit}=SGArcade;
const hues=['#ffe45d','#31eafa','#ff45be','#a876ff'];
const skins=[['Luminous Orb',0,'orb'],['Cut Crystal',12,'gem'],['Twin Spark',28,'double'],['Nova Crown',55,'star']];
const trails=[['Light Ribbon',0,.23],['Comet Tail',15,.36],['Charged Halo',44,.53]];
const types=['ring','rail','cross','pulse','double','geometry'];
const point=(x,y,a,r)=>({x:x+Math.cos(a)*r,y:y+Math.sin(a)*r});
function dist(p,a,b){
  const dx=b.x-a.x,dy=b.y-a.y,t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);
  return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);
}
function star(g,x,y,r,fill){
  const points=Array.from({length:10},(_,i)=>{const p=point(x,y,i*tau/10-Math.PI/2,r*(i%2?.48:1));return [p.x,p.y];});
  polygon(g,points,fill);
}
function diamond(g,x,y,r,color){
  polygon(g,[[x,y-r],[x+r*.72,y],[x,y+r],[x-r*.72,y]],color);
  polygon(g,[[x,y-r],[x,y+r],[x-r*.72,y]],'#ffffff52');
}
function strokes(g,color,width=13){
  g.lineCap='round';g.lineJoin='round';g.strokeStyle=color+'72';g.lineWidth=width+6;g.stroke();
  g.strokeStyle=color;g.lineWidth=width;g.stroke();g.strokeStyle='#ffffff65';g.lineWidth=1.8;g.stroke();
}
mount({title:'Color Switch',highlight:'Switch',category:'Neon arcade',description:'Tap to climb. Lean with side taps, slip through matching colors and collect prisms.',orientation:'portrait',modes:['Endless','Level','Challenge'],unlockTitle:'Ball lab & levels',defaults:{diamonds:0,ball:0,trail:0,unlocked:1,level:1,gates:0},root:50,tune:[0,12,7,10,0,12,7,15]},api=>{
  const fx=particleKit(132);
  let altitude=0,velocity=0,x=210,xGoal=210,camera=0,t=0,active=false,points=0,diamonds=0,cleared=0,gates=[],trail=[],color=0,alive=true,death=0,lastSpawn=0,level=1,limit=0,streak=0,rotate=0;
  function create(index){
    const pack=api.mode==='Level'?api.state.level-1:api.mode==='Challenge'?2:0;
    const type=index===0?'ring':types[(index+pack)%types.length],y=index===0?208:lastSpawn+231;
    const offset=type==='rail'||type==='cross'?0:index%2?14:-14;
    const item={id:index,y,type,x:210+offset,spin:(index%2?1:-1)*(.44+Math.min(index+pack,14)*.057),phase:1.9+index*1.48,match:index%4,passed:false,pickup:false,prism:false,star:false,diamond:false,contact:false};
    if(index===0){item.phase=-Math.PI*.70;item.spin=.31;}
    gates.push(item);lastSpawn=y;
  }
  function start(){
    altitude=0;velocity=0;x=xGoal=210;camera=0;t=0;active=false;points=diamonds=cleared=0;gates=[];trail=[];color=0;alive=true;death=0;lastSpawn=0;streak=0;rotate=0;
    level=api.state.level;limit=api.mode==='Level'?4+level:api.mode==='Challenge'?7:0;
    for(let i=0;i<6;i++)create(i);
    fx.clear();hud();
  }
  function hud(){
    const values=[['Score',points],['Diamonds',diamonds]];
    if(api.mode==='Level')values.push(['Level',level]);
    if(api.mode==='Challenge')values.push(['Time',Math.max(0,Math.ceil(42-t))]);
    api.hud(values);
  }
  function tap(p){
    if(!alive)return;
    active=true;velocity=248;
    xGoal=p.x<156?151:p.x>264?269:210;api.tone('button');
  }
  function geometry(item,time){
    const a=item.phase+item.spin*time, out=[];
    const line=(from,to,c,w=12)=>out.push({from,to,c:((c+item.match)%4+4)%4,w});
    if(['ring','double'].includes(item.type)){
      for(const r of item.type==='double'?[86,60]:[82]){
        const shift=r===60?a+.12:a;
        for(let c=0;c<4;c++){
          const from=shift+c*tau/4+.025,to=shift+(c+1)*tau/4-.025;
          out.push({arc:true,x:item.x,y:item.y,r,from,to,c:(c+item.match)%4,w:r===60?10:13});
        }
      }
    }else if(item.type==='rail'||item.type==='pulse'){
      const pulse=item.type==='pulse',slide=Math.sin(time*(pulse?1.1:1)+item.phase)*43, width=pulse?238:258;
      const shift=pulse?Math.floor(time/2.7+item.id)%4:0;
      for(let c=0;c<4;c++){
        const left=item.x-width/2+c*width/4+slide;
        line({x:left+4,y:item.y},{x:left+width/4-4,y:item.y},c+shift,14);
      }
    }else if(item.type==='cross'){
      for(let i=0;i<4;i++)line(point(item.x,item.y,a+i*tau/4,21),point(item.x,item.y,a+i*tau/4,99),i,15);
    }else{
      for(let i=0;i<4;i++){
        const radius=84+Math.sin(time*.8+item.id)*12;
        line(point(item.x,item.y,a+i*tau/4,radius),point(item.x,item.y,a+(i+1)*tau/4,radius),i,13);
      }
    }
    return out;
  }
  function contact(p,s){
    if(!s.arc)return dist(p,s.from,s.to)<s.w/2+10;
    const a=((Math.atan2(p.y-s.y,p.x-s.x)-s.from)%tau+tau)%tau;
    if(a<=s.to-s.from)return Math.abs(Math.hypot(p.x-s.x,p.y-s.y)-s.r)<s.w/2+10;
    const a0=point(s.x,s.y,s.from,s.r),a1=point(s.x,s.y,s.to,s.r);
    return Math.min(Math.hypot(p.x-a0.x,p.y-a0.y),Math.hypot(p.x-a1.x,p.y-a1.y))<s.w/2+10;
  }
  function lose(){
    alive=false;death=.47;streak=0;fx.burst(x,altitude,hues[color],30,205,-120);api.tone('fail');api.buzz('heavy');
  }
  function success(){
    if(api.mode==='Level'){
      api.state.unlocked=Math.max(api.state.unlocked,Math.min(10,level+1));api.save();
      api.end(points,'Level '+level+' cleared',cleared+' gates · '+diamonds+' diamonds.',level<10?{label:'Next level',action(){api.state.level=level+1;api.save();}}:null);
    }else api.end(points,'Challenge cleared',cleared+' gates · '+diamonds+' diamonds.');
  }
  function update(dt){
    fx.update(dt);rotate+=dt;
    if(!alive){death-=dt;if(death<=0)api.end(points,'Prism shattered',cleared+' gates · '+diamonds+' diamonds.');return;}
    t+=active?dt:0;
    if(active){
      x=lerp(x,xGoal,1-Math.exp(-dt*10));altitude+=velocity*dt;velocity-=dt*554;
      if(altitude<0&&camera<7){altitude=0;velocity=0;}
      if(altitude<camera-api.h*.29){lose();return;}
      camera=Math.max(camera,altitude-76);
      if(!trail.length||Math.abs(altitude-trail[0].y)>3||Math.abs(x-trail[0].x)>4)trail.unshift({x,y:altitude,c:color,life:1});
    }
    const ball={x,y:altitude},duration=trails[api.state.trail][2];
    trail=trail.filter(p=>(p.life-=dt/duration)>0).slice(0,36);
    for(const gate of gates){
      if(Math.abs(gate.y-altitude)<119){
        const hit=geometry(gate,t).filter(shape=>contact(ball,shape));
        if(!gate.contact&&hit.length&&!hit.some(s=>s.c===color)){lose();return;}
        gate.contact=hit.length>0;
      }else gate.contact=false;
      if(!gate.prism&&['ring','double'].includes(gate.type)&&Math.hypot(x-210,altitude-(gate.y+11))<36){
        gate.prism=true;
        const upper=geometry(gate,t+.31).find(s=>contact({x:210,y:gate.y+80},s));
        if(upper)color=upper.c;
        fx.burst(210,gate.y+11,hues[color],12,116,-70);api.tone('good');
      }
      const pickupY=gate.y+117;
      if(!gate.pickup&&Math.hypot(x-210,altitude-pickupY)<36){
        gate.pickup=true;
        const next=gates.find(g=>g.id===gate.id+1);
        if(next){
          const radius=next.type==='geometry'?47:(next.type==='ring'||next.type==='double')?76:0;
          const future=t+Math.max(.13,(next.y-radius-pickupY)/196);
          const candidate={x:210,y:next.y-radius};
          const desired=geometry(next,future).find(s=>contact(candidate,s));
          color=desired?.c??(color+1+gate.id%3)%4;
        }else color=(color+1)%4;
        fx.burst(210,pickupY,hues[color],16,145,-90);api.tone('good');
      }
      if(!gate.star&&Math.hypot(x-210,altitude-gate.y)<27){
        gate.star=true;points+=3;fx.burst(210,gate.y,'#fff377',10,105,-55);api.tone('coin');
      }
      const side=gate.id%2?151:269;
      if(!gate.diamond&&Math.hypot(x-side,altitude-(gate.y+39))<30){
        gate.diamond=true;diamonds++;points+=5;api.state.diamonds++;api.save();
        fx.burst(side,gate.y+39,'#fff096',13,125,-45);api.tone('coin');api.buzz();
      }
      if(!gate.passed&&altitude>gate.y+103){
        gate.passed=true;cleared++;streak++;points+=10+Math.min(streak,7);
        api.state.gates++;api.save();fx.burst(x,altitude,hues[color],12,85,-85);
        if(streak%4===0){api.notice('Spectrum streak ×'+streak);api.tone('combo');}
      }
    }
    if(limit&&cleared>=limit){success();return;}
    if(api.mode==='Challenge'&&t>42){api.end(points,'Time is up',cleared+' of '+limit+' gates cleared.');return;}
    while(lastSpawn<camera+api.h*1.1)create(gates.at(-1).id+1);
    gates=gates.filter(g=>g.y>camera-api.h*.8);
    hud();
  }
  function scene(g,now){
    const {w,h}=api;
    g.fillStyle=gradient(g,0,0,w,h,['#26134c','#15174f','#110d28']);g.fillRect(0,0,w,h);
    const bloom=g.createRadialGradient(w*.51,h*.39,9,w*.51,h*.39,h*.67);
    bloom.addColorStop(0,'#453ba57d');bloom.addColorStop(.46,'#43257935');bloom.addColorStop(1,'#18123100');
    g.fillStyle=bloom;g.fillRect(0,0,w,h);
    for(let i=0;i<54;i++){
      const a=(i*183+67)%w,b=(i*103+camera*.24+now*(i%3+3))%h,r=1.3+i%4*.48;
      diamond(g,a,b,r,hues[i%4]+'55');
    }
    for(let i=0;i<8;i++){
      const a=.3+i*1.04+Math.sin(now*.23)*.2;
      const p=point(w/2,h*.45,a,h),q=point(w/2,h*.45,a+.12,h);
      polygon(g,[[w/2,h*.45],[p.x,p.y],[q.x,q.y]],i%2?'#664cb31e':'#4d54b41c');
    }
  }
  function drawGate(g,gate,time,sy){
    for(const s of geometry(gate,time)){
      g.beginPath();
      if(s.arc)g.arc(s.x,sy(s.y),s.r,-s.to,-s.from);
      else{g.moveTo(s.from.x,sy(s.from.y));g.lineTo(s.to.x,sy(s.to.y));}
      strokes(g,hues[s.c],s.w);
    }
  }
  function draw(g,now,screen){
    scene(g,now);
    const {w,h}=api, sy=y=>h*.76-(y-camera);
    if(screen==='menu'){
      const ring={x:w/2,y:0,type:'double',phase:0,spin:.66,match:0};
      drawGate(g,ring,now,v=>h*.71-v);
      for(let i=0;i<6;i++)diamond(g,44+i*68,h*.78+Math.sin(now*2+i)*26,9,hues[i%4]);
      return;
    }
    for(const gate of gates){
      if(sy(gate.y)<-125||sy(gate.y)>h+125)continue;
      drawGate(g,gate,t,sy);
      if(!gate.star)star(g,210,sy(gate.y),13+1.5*Math.sin(now*5),'#ffe389');
      if(!gate.prism&&['ring','double'].includes(gate.type))diamond(g,210,sy(gate.y+30),7,'#ecb6ff');
      if(!gate.diamond)diamond(g,gate.id%2?151:269,sy(gate.y+39),11,'#ffd54f');
      if(!gate.pickup){
        const y=sy(gate.y+117);
        for(let i=0;i<4;i++){g.beginPath();g.moveTo(210,y);g.arc(210,y,11,i*tau/4+now*2,(i+1)*tau/4+now*2);g.closePath();g.fillStyle=hues[i];g.fill();}
        ellipse(g,210,y,3,3,'#ffffed');
      }
    }
    g.save();g.translate(0,h*.76+camera);g.scale(1,-1);fx.draw(g);g.restore();
    for(const p of [...trail].reverse()){
      g.globalAlpha=p.life*.78;ellipse(g,p.x,sy(p.y),5+5*p.life,5+5*p.life,hues[p.c]);
    }
    g.globalAlpha=1;
    if(alive){
      const y=sy(altitude), glow=g.createRadialGradient(x,y,3,x,y,27);
      glow.addColorStop(0,hues[color]);glow.addColorStop(.48,hues[color]+'6a');glow.addColorStop(1,hues[color]+'00');
      ellipse(g,x,y,27,27,glow);
      const form=skins[api.state.ball][2];
      if(form==='gem')diamond(g,x,y,13,hues[color]);
      else if(form==='star')star(g,x,y,14,hues[color]);
      else{
        ellipse(g,x,y,11,11,hues[color]);ellipse(g,x-3,y-3,4,4,'#fffbe5');
        if(form==='double')ellipse(g,x+9*Math.cos(rotate*7),y+9*Math.sin(rotate*7),4,4,'#fff');
      }
    }
    if(!active&&screen==='play')label(g,'Tap to climb',w/2,h*.87,24,'#fff7ce');
  }
  function unlocks(){
    api.showChoices('Ball lab & levels',api.state.diamonds+' lifetime diamonds · '+api.state.gates+' gates cleared',[
      ...skins.map(([name,min],n)=>({label:name,detail:min>api.state.diamonds?min+' diamonds required':'Ball design',selected:api.state.ball===n,disabled:min>api.state.diamonds,action(){api.state.ball=n;api.save();unlocks();}})),
      ...trails.map(([name,min],n)=>({label:name,detail:min>api.state.diamonds?min+' diamonds required':'Trail effect',selected:api.state.trail===n,disabled:min>api.state.diamonds,action(){api.state.trail=n;api.save();unlocks();}})),
      ...Array.from({length:10},(_,i)=>({label:'Level '+(i+1),detail:i<api.state.unlocked?'Select for Level mode':'Clear the previous level',selected:api.state.level===i+1,disabled:i>=api.state.unlocked,action(){api.state.level=i+1;api.save();unlocks();}}))
    ]);
  }
  return {start,update,draw,unlocks,down:tap,recordText:()=>api.state.gates+' lifetime gates · '+api.state.diamonds+' diamonds'};
});
})();
