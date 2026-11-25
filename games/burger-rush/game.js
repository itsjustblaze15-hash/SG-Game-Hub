'use strict';
(() => {
const {mount,clamp,rnd,tau,ellipse,box,polygon,gradient,label,particleKit}=SGArcade;
const art=window.SGBurgerArt;
const recipes=[
  ['Classic Stack',1,['bun-bottom','beef','cheese','bun-top'],[]],
  ['Garden Burger',2,['bun-bottom','beef','lettuce','tomato','bun-top'],['soda']],
  ['Drive-Thru Combo',3,['bun-bottom','beef','cheese','ketchup','bun-top'],['fries','soda']],
  ['Crispy Chicken',4,['bun-bottom','chicken','lettuce','pickle','bun-top'],['fries']],
  ['Double Stack',5,['bun-bottom','beef','cheese','beef','mustard','bun-top'],['rings']],
  ['Golden Lunch',6,['bun-bottom','chicken','tomato','onion','special','bun-top'],['nuggets','soda']],
  ['Diner Deluxe',7,['bun-bottom','beef','lettuce','onion','pickle','special','bun-top'],['rings','shake']],
  ['Beach Basket',8,['bun-bottom','chicken','cheese','lettuce','mustard','bun-top'],['fries','shake']],
  ['SG Signature',10,['bun-bottom','beef','cheese','tomato','pickle','onion','special','bun-top'],['nuggets','shake']]
];
const names={
  'bun-bottom':'Bottom bun','bun-top':'Top bun',beef:'Beef',chicken:'Chicken',cheese:'Cheese',lettuce:'Lettuce',
  tomato:'Tomato',onion:'Onion',pickle:'Pickle',ketchup:'Ketchup',mustard:'Mustard',special:'SG sauce',
  fries:'Fries',rings:'Onion rings',soda:'Soft drink',shake:'Milkshake',nuggets:'Nuggets'
};
const groups={
  'Grill':['bun-bottom','beef','chicken','bun-top','cheese'],
  'Produce':['lettuce','tomato','onion','pickle','cheese'],
  'Sauces':['ketchup','mustard','special'],
  'Sides':['fries','rings','soda','shake','nuggets']
};
const thresholds={chicken:4,lettuce:2,tomato:2,onion:6,pickle:4,ketchup:3,mustard:5,special:6,fries:3,rings:5,soda:2,shake:7,nuggets:6};
const locations=[['SG Corner Diner',1],['Boardwalk Kitchen',4],['Uptown Lunch Bar',7],['Sunset Grill',10]];
const themes=[['Classic Red','#ff773a',0],['Golden Counter','#ffc75d',85],['Cherry Chrome','#fa548b',165],['Seafoam Special','#6ff6ce',260]];
const cookItems=new Set(['beef','chicken','fries','rings','nuggets']);
const isSide=key=>groups.Sides.includes(key);
const steps=({
  'bun-bottom':'Bun','bun-top':'Top','beef':'Beef','chicken':'Chicken','cheese':'Cheese','lettuce':'Lettuce','tomato':'Tomato','onion':'Onion','pickle':'Pickle',
  'ketchup':'Ketchup','mustard':'Mustard','special':'SG sauce','fries':'Fries','rings':'Rings','soda':'Soda','shake':'Shake','nuggets':'Nuggets'
});
mount({title:'Burger Rush',highlight:'Rush',category:'Restaurant arcade',description:'Read the ticket, work the grill and serve each order before your customers lose patience.',orientation:'landscape',modes:['Shift'],unlockTitle:'Restaurant & recipes',defaults:{cash:0,shift:1,unlocked:1,grill:0,patience:0,location:0,theme:0,decor:[0],served:0},root:55,tune:[0,4,7,9,7,4,2,7]},api=>{
  const fx=particleKit(116);
  let bg,station='Grill',queue=[],stack=[],sides=[],cooking={},clock=0,next=0,sid=0,selected=0,served=0,skipped=0,cash=0,tips=0,goal=3,duration=110,level=1,sizeCode='',streak=0,finished=false;
  function createBg(){
    bg=document.createElement('canvas');bg.width=api.w;bg.height=api.h;
    art.backdrop(bg.getContext('2d'),api.w,api.h,api.state.location);
    sizeCode=[api.w,api.h,api.state.location].join('/');
  }
  function start(){
    level=api.state.shift;station='Grill';queue=[];stack=[];sides=[];cooking={};clock=0;next=3;sid=0;selected=0;served=skipped=cash=tips=streak=0;finished=false;
    goal=Math.min(9,3+Math.floor(level*.63));duration=Math.min(182,104+(goal-3)*12);
    fx.clear();createBg();order(true);refresh();hud();
  }
  function choice(){return queue.find(c=>c.id===selected)||queue[0];}
  function order(first=false){
    const valid=recipes.filter(r=>r[1]<=level);
    const recent=valid.filter(r=>r[1]>=level-4);
    const pool=recent.length?recent:valid;
    const recipe=first?(valid.find(r=>r[1]===level)||pool.at(-1)):pool[Math.floor(rnd(0,pool.length))];
    const patience=43-level*1.02+api.state.patience*8+recipe[2].length*2.6+recipe[3].length*5;
    const customer={id:sid++,look:Math.floor(rnd(0,6)),recipe,patience,max:patience,arrive:clock,bad:0};
    queue.push(customer);if(queue.length===1)selected=customer.id;
    api.tone('button');
  }
  function hud(){
    api.hud([['Served',served+'/'+goal],['Shift',level],['Time',Math.max(0,Math.ceil(duration-clock))],['Earned','$'+cash]]);
  }
  function refresh(){
    const tabs=Object.keys(groups).map(group=>({label:group===station?'• '+group:group,action(){station=group;refresh();}}));
    const keys=groups[station].filter(key=>(thresholds[key]??1)<=level);
    api.controls([
      ...tabs,{label:'Clear tray',action(){stack=[];sides=[];api.notice('Tray cleared');}},
      {label:'Serve',action:serve,id:'serve-order'},
      ...keys.map(key=>({label:names[key],action:()=>operate(key),id:'station-'+key}))
    ]);
    document.getElementById('serve-order')?.classList.add('main-action');
    syncButtons();
  }
  function syncButtons(){
    for(const key of groups[station]){
      const btn=document.getElementById('station-'+key);if(!btn)continue;
      const item=cooking[key];
      const text=names[key]+(item?(item.burnt?' · burnt':clock>=item.cooked?' · ready':' · cooking'):'');
      if(btn.textContent!==text)btn.textContent=text;
      btn.classList.toggle('active',!!item&&clock>=item.cooked&&!item.burnt);
    }
  }
  function add(key){
    if(isSide(key)){
      if(sides.includes(key)){api.notice('That side is already on the tray');return;}
      if(sides.length>=3){api.notice('Clear the tray to start over');return;}
      sides.push(key);
    }else{
      if(stack.length>=9){api.notice('Clear the tray to start over');return;}
      stack.push(key);
    }
    api.tone('good');api.buzz();
  }
  function operate(key){
    if(!cookItems.has(key)){add(key);return;}
    const existing=cooking[key];
    if(existing){
      if(existing.burnt){delete cooking[key];api.notice('Discarded burnt '+names[key].toLowerCase());}
      else if(clock>=existing.cooked){delete cooking[key];add(key);}
      else api.notice('Let the '+names[key].toLowerCase()+' finish');
      syncButtons();return;
    }
    const length=(isSide(key)?2.9:4.5)-api.state.grill*.56;
    cooking[key]={since:clock,cooked:clock+length,burn:clock+length+7+api.state.grill*2};
    api.notice((isSide(key)?'Frying ':'Cooking ')+names[key].toLowerCase());syncButtons();
  }
  function complete(title,won){
    if(finished)return;finished=true;
    if(won){api.state.unlocked=Math.max(api.state.unlocked,Math.min(12,level+1));api.tone('level');}
    api.save();
    const next=won&&level<12?{label:'Next shift',action(){api.state.shift=level+1;api.save();}}:null;
    api.end(cash,title,served+' served · '+skipped+' walked out · $'+tips+' tips.',next);
  }
  function serve(){
    const c=choice();if(!c){api.notice('Wait for a customer');return;}
    const expected=c.recipe[2],wantedSides=c.recipe[3];
    const burgerOk=stack.length===expected.length&&stack.every((key,i)=>key===expected[i]);
    const sidesOk=sides.length===wantedSides.length&&sides.every(key=>wantedSides.includes(key));
    if(!burgerOk||!sidesOk){
      c.patience=Math.max(.01,c.patience-6);c.bad=clock+.55;streak=0;api.tone('fail');api.buzz('heavy');
      api.notice(burgerOk?'Check the sides':'Stack the burger in ticket order');return;
    }
    const tip=Math.max(0,Math.floor(c.patience/c.max*13))+Math.min(8,streak*2);
    const earn=10+expected.length*2+wantedSides.length*4+tip;
    served++;streak++;cash+=earn;tips+=tip;api.state.cash+=earn;api.state.served++;
    queue=queue.filter(row=>row!==c);selected=queue[0]?.id??0;stack=[];sides=[];
    fx.burst(api.w*.57,api.h*.42,'#ffe56d',17,166,100);api.tone('coin');api.buzz();api.save();
    api.notice('Order served · +$'+earn+' ($'+tip+' tip)');
    if(served>=goal)complete('Shift complete',true);else next=Math.min(next,clock+3);
  }
  function update(dt){
    clock+=dt;if(clock>=duration){complete('Closing time',false);return;}
    const max=level>=7?3:level>=3?2:1;
    if(clock>=next&&queue.length<max){order();next=clock+Math.max(5.4,17.4-level*1.1);}
    for(const customer of queue)customer.patience-=dt;
    const gone=queue.filter(c=>c.patience<=0);
    if(gone.length){
      skipped+=gone.length;streak=0;queue=queue.filter(c=>c.patience>0);
      api.notice('A customer left');api.tone('fail');if(!queue.length)next=clock+2;
    }
    for(const item of Object.values(cooking)){
      if(!item.chime&&clock>=item.cooked){item.chime=true;api.tone('good');}
      if(!item.burnt&&clock>=item.burn){item.burnt=true;api.tone('fail');}
    }
    fx.update(dt);syncButtons();hud();
  }
  function wrapText(g,text,x,y,maxWidth,size,color){
    g.font='800 '+size+'px system-ui';
    let line='',height=y;
    for(const word of text.split(' ')){
      if(line&&g.measureText(line+' '+word).width>maxWidth){label(g,line,x,height,size,color);line='';height+=size*1.22;}
      line+=(line?' ':'')+word;
    }
    if(line)label(g,line,x,height,size,color);
  }
  function orders(g,now){
    const w=api.w,h=api.h,current=choice(),slot=w/Math.max(queue.length+1,2);
    queue.forEach((c,i)=>{
      const x=slot*(i+1), grow=clamp((clock-c.arrive)*2.4,0,1);g.save();g.globalAlpha=grow*.6+.4;
      art.customer(g,x,h*.65,.44*grow+.67,c.look,clamp(c.patience/c.max,0,1),now*3+i);
      g.globalAlpha=1;
      const ww=Math.min(200,slot*.91),top=h*.135;
      box(g,x-ww/2,top,ww,86,13,c===current?'#fff2d2':'#efc6ac');
      if(c.bad>clock)box(g,x-ww/2,top,ww,86,13,'#ff8180');
      label(g,c.recipe[0],x,top+18,Math.min(16,ww/10.4),'#5d2430');
      if(c===current){
        const burger=c.recipe[2].map(k=>steps[k]).join(' › '),side=c.recipe[3].map(k=>steps[k]).join(' + ');
        wrapText(g,burger+(side?' / '+side:''),x,top+37,ww-16,Math.min(12,ww/13),'#61414a');
      }else label(g,'Tap ticket',x,top+46,13,'#61414a');
      box(g,x-ww*.43,top+76,ww*.86,5,2,'#d4a792');
      box(g,x-ww*.43,top+76,Math.max(.01,ww*.86*clamp(c.patience/c.max,0,1)),5,2,c.patience<c.max*.31?'#de4351':'#65bc5c');
      g.restore();
    });
  }
  function tray(g){
    const {w,h}=api,x=w*.56,y=h*.714;
    ellipse(g,x,y+11,112,27,'#190e1b52');
    ellipse(g,x,y,107,24,'#cadce1');
    ellipse(g,x,y-1,89,18,'#748e9c');
    g.save();g.beginPath();g.rect(x-120,y-125,240,148);g.clip();
    if(!stack.length)label(g,'ORDER TRAY',x,y,13,'#e4f2ef');
    stack.forEach((k,i)=>{
      const bump=['beef','chicken'].includes(k)?26:k.startsWith('bun')?28:12;
      const offset= i===0?0:Math.min(121,i*14.6);
      art.food(g,k,x-24,y-8-offset,120,bump);
    });
    sides.forEach((k,i)=>art.food(g,k,x+48+i*26,y-28-i*4,43,61));
    g.restore();
    let i=0;
    for(const [k,p] of Object.entries(cooking)){
      const xs=w*.14+(i%3)*57,ys=h*.712+Math.floor(i/3)*48;
      box(g,xs-25,ys-22,50,43,9,p.burnt?'#512533':clock>=p.cooked?'#275d47':'#653737');
      art.food(g,k,xs,ys-1,34,27);
      const fraction=clamp((clock-p.since)/(p.cooked-p.since),0,1);
      box(g,xs-18,ys+15,Math.max(1,36*fraction),3,1,p.burnt?'#ff7770':'#ffe358');
      if(!p.burnt&&clock<p.cooked){
        for(let j=0;j<3;j++){
          const y=ys-20-((clock*34+j*10)%29);
          ellipse(g,xs-9+j*8+Math.sin(clock*7+j)*4,y,3.7,7,'#fff1d844');
        }
      }
      i++;
    }
  }
  function draw(g,now,screen){
    if(sizeCode!==[api.w,api.h,api.state.location].join('/'))createBg();
    g.drawImage(bg,0,0);
    const {w,h}=api;
    box(g,0,h*.64,w,7,2,themes[api.state.theme][1]);
    if(screen==='menu'){
      art.customer(g,w*.72,h*.65,1.19,4,1,now*3);
      art.customer(g,w*.87,h*.65,.96,1,1,now*3+2);
      for(const [i,k] of ['bun-bottom','beef','cheese','tomato','lettuce','bun-top'].entries())art.food(g,k,w*.77,h*.77-i*14,152,k.startsWith('bun')?48:25);
      art.food(g,'fries',w*.92,h*.77,70,82);
      return;
    }
    orders(g,now);tray(g);fx.draw(g);
    if(!queue.length&&screen==='play')label(g,'Next customer is on the way',w/2,h*.43,23,'#fff2cf');
  }
  function catalog(){
    const upgrade=(key,label,description)=>{
      const value=api.state[key],cost=60+value*75;
      return {label:label+' '+value+'/3',detail:value>=3?'Fully upgraded':'$'+cost+' · '+description,disabled:value>=3||api.state.cash<cost,
        action(){api.state.cash-=cost;api.state[key]++;api.save();api.tone('level');catalog();}};
    };
    api.showChoices('Restaurant & recipes','$'+api.state.cash+' banked · shift '+api.state.shift,[
      upgrade('grill','Grill equipment','Faster cooking and a longer ready window'),
      upgrade('patience','Dining service','Customers wait longer'),
      {label:'Décor shop',detail:'Customize your restaurant counter',action:decor},
      {label:'Recipe book',detail:'See all unlocked ingredients and orders',action:recipeBook},
      ...locations.map(([name,need],i)=>({label:name,detail:need>api.state.unlocked?'Reach shift '+need:'Select location',disabled:need>api.state.unlocked,selected:i===api.state.location,
        action(){api.state.location=i;api.save();catalog();}})),
      ...Array.from({length:12},(_,i)=>({label:'Shift '+(i+1),detail:i<api.state.unlocked?'Select shift':'Complete the previous shift',disabled:i>=api.state.unlocked,selected:api.state.shift===i+1,
        action(){api.state.shift=i+1;api.save();catalog();}}))
    ]);
  }
  function recipeBook(){
    api.showChoices('Recipe book','Build ingredients in the order shown. Sides can go on the tray in any order.',recipes.map(([name,need,burger,sides])=>({
      label:name,detail:need>api.state.unlocked?'Unlock in shift '+need:[...burger.map(k=>steps[k]),...sides.map(k=>'+'+steps[k])].join(' › ')
    })),catalog);
  }
  function decor(){
    api.showChoices('Décor shop','$'+api.state.cash+' banked',themes.map(([name,,price],i)=>{
      const own=api.state.decor.includes(i);
      return {label:name,detail:i===api.state.theme?'Equipped':own?'Apply counter trim':'$'+price,
        selected:i===api.state.theme,disabled:!own&&api.state.cash<price,
        action(){if(!own){api.state.cash-=price;api.state.decor.push(i);}api.state.theme=i;api.save();decor();}};
    }),catalog);
  }
  return {start,update,draw,unlocks:catalog,recordText:()=>api.state.served+' lifetime orders · $'+api.state.cash+' banked',
    down(p){
      const slot=api.w/Math.max(queue.length+1,2);
      const i=Math.round(p.x/slot)-1;
      if(p.y>api.h*.11&&p.y<api.h*.64&&queue[i]){selected=queue[i].id;api.tone('button');}
    }
  };
});
})();
