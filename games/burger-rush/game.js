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
const stationNames=Object.keys(groups), ingredientKeys='zxcvb';
const stationIcons={Grill:'🔥',Produce:'🥬',Sauces:'🫙',Sides:'🍟'};
const thumbnails=new Map();
function ingredientArt(key){
  if(!thumbnails.has(key)){
    const image=document.createElement('canvas');image.width=96;image.height=76;
    const ctx=image.getContext('2d'),tall=['soda','shake','fries','ketchup','mustard','special'].includes(key);
    art.food(ctx,key,48,37,tall?48:78,tall?62:46);
    thumbnails.set(key,image);
  }
  return thumbnails.get(key);
}
const thresholds={chicken:4,lettuce:2,tomato:2,onion:6,pickle:4,ketchup:3,mustard:5,special:6,fries:3,rings:5,soda:2,shake:7,nuggets:6};
const locations=[['SG Corner Diner',1],['Boardwalk Kitchen',4],['Uptown Lunch Bar',7],['Sunset Grill',10]];
const themes=[['Classic Red','#ff773a',0],['Golden Counter','#ffc75d',85],['Cherry Chrome','#fa548b',165],['Seafoam Special','#6ff6ce',260]];
const cookItems=new Set(['beef','chicken','fries','rings','nuggets']);
const isSide=key=>groups.Sides.includes(key);
const steps=({
  'bun-bottom':'Bun','bun-top':'Top','beef':'Beef','chicken':'Chicken','cheese':'Cheese','lettuce':'Lettuce','tomato':'Tomato','onion':'Onion','pickle':'Pickle',
  'ketchup':'Ketchup','mustard':'Mustard','special':'SG sauce','fries':'Fries','rings':'Rings','soda':'Soda','shake':'Shake','nuggets':'Nuggets'
});
mount({title:'Burger Rush',highlight:'Rush',category:'Restaurant arcade',description:'Follow the pictures, stack the burger and serve it while it’s hot.',desktopHelp:'Click the kitchen controls or use 1–4 for stations, Z–B for ingredients, and Return to serve.',orientation:'landscape',modes:['Shift'],unlockTitle:'Restaurant & recipes',defaults:{cash:0,shift:1,unlocked:1,grill:0,patience:0,location:0,theme:0,decor:[0],served:0},root:55,tune:[0,4,7,9,7,4,2,7]},api=>{
  const fx=particleKit(116);
  const orderStatus=document.createElement('p');orderStatus.className='arcade-sr';orderStatus.setAttribute('role','status');
  document.getElementById('arcade').append(orderStatus);
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
  function chooseStation(name){station=name;refresh();}
  function availableIngredients(){return groups[station].filter(key=>(thresholds[key]??1)<=level);}
  function clearTray(){stack=[];sides=[];api.notice('Tray cleared');}
  function refresh(){
    const tabs=stationNames.map((name,i)=>({label:name,icon:stationIcons[name],group:'stations',shortcut:String(i+1),active:name===station,action:()=>chooseStation(name)}));
    const keys=availableIngredients();
    api.controls([
      ...tabs,{label:'Clear tray',icon:'🧹',group:'actions',action:clearTray,shortcut:'⌫'},
      {label:'Serve',icon:'🍽️',group:'actions',action:serve,id:'serve-order',shortcut:'Return'},
      ...keys.map((key,i)=>({label:names[key],icon:ingredientArt(key).cloneNode(),group:'ingredients',shortcut:ingredientKeys[i].toUpperCase(),action:()=>operate(key),id:'station-'+key}))
    ]);
    document.getElementById('serve-order')?.classList.add('main-action');
    for(const key of keys){
      const icon=document.querySelector('#station-'+key+' canvas');
      icon?.getContext('2d').drawImage(ingredientArt(key),0,0);
    }
    syncButtons();
  }
  function syncButtons(){
    for(const key of groups[station]){
      const btn=document.getElementById('station-'+key);if(!btn)continue;
      const item=cooking[key];
      const text=names[key]+(item?(item.burnt?' · burnt':clock>=item.cooked?' · ready':' · cooking'):'');
      const words=btn.querySelector('.control-label');
      if(words.textContent!==text)words.textContent=text;
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
  function ticket(g,customer){
    const {w,h}=api,[name,,burger,side]=customer.recipe;
    const x=w/2,y=h*.113,width=Math.min(460,w*.69),height=side.length?181:115;
    const left=x-width/2;
    box(g,left+5,y+8,width,height,11,'#45233383');
    box(g,left,y,width,height,11,clock<customer.bad?'#ffd0bb':'#fff6dd');
    box(g,left+10,y+10,width-20,26,7,'#972932');
    label(g,name,x,y+23,16,'#fff5d8');
    label(g,'BUILD BOTTOM TO TOP',left+17,y+45,10,'#733a39','left');
    const stamps=(keys,orderY,placed,inOrder)=>{
      const gap=5,tile=Math.min(48,(width-28-gap*(keys.length-1))/keys.length);
      const first=x-(tile+gap)*(keys.length-1)/2;
      for(const [i,key] of keys.entries()){
        const sx=first+(tile+gap)*i;
        const chosen=inOrder?placed[i]:placed.includes(key)?key:null;
        const color=chosen===key?'#386b4f':chosen?'#ad3d3a':'#c7ab86';
        box(g,sx-tile/2,orderY,tile,39,7,color);
        box(g,sx-tile/2+1.5,orderY+1.5,tile-3,36,6,chosen===key?'#e1f6d7':'#fff9ec');
        g.drawImage(ingredientArt(key),sx-tile*.46,orderY+1,tile*.92,33);
        if(chosen)label(g,chosen===key?'✓':'×',sx+tile*.32,orderY+33,13,color);
        if(inOrder&&i<keys.length-1)label(g,'›',sx+(tile+gap)/2,orderY+20,12,'#935a58');
      }
    };
    stamps(burger,y+52,stack,true);
    if(side.length){
      label(g,'ADD SIDES',left+17,y+112,10,'#733a39','left');
      stamps(side,y+121,sides,false);
    }
    box(g,left+13,y+height-12,width-26,5,2,'#e1c6a7');
    const patience=clamp(customer.patience/customer.max,0,1);
    box(g,left+13,y+height-12,Math.max(.02,(width-26)*patience),5,2,patience<.31?'#de4351':'#55a865');
  }
  function orders(g,now){
    const {w,h}=api,current=choice(),slot=w/Math.max(queue.length+1,2);
    const spoken=current?current.recipe[0]+'. From bottom to top: '+current.recipe[2].map(k=>names[k]).join(', ')+
      (current.recipe[3].length?'. Sides: '+current.recipe[3].map(k=>names[k]).join(', '):''):'';
    if(orderStatus.textContent!==spoken)orderStatus.textContent=spoken;
    queue.forEach((customer,index)=>{
      const x=slot*(index+1), grow=clamp((clock-customer.arrive)*2.4,0,1);
      g.save();g.globalAlpha=grow*.6+.4;
      art.customer(g,x,h*.65,.44*grow+.67,customer.look,clamp(customer.patience/customer.max,0,1),now*3+index);
      g.restore();
      if(queue.length<2)return;
      const selected=customer===current;
      box(g,x-34,h*.604,68,26,7,selected?'#a22f38':'#551e32');
      label(g,'Order '+(index+1),x,h*.627,13,selected?'#fff4d8':'#f1c9ae');
    });
    if(current)ticket(g,current);
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
  function key(key,down,repeat){
    const stationIndex='1234'.indexOf(key),ingredientIndex=ingredientKeys.indexOf(key);
    if(key!=='Enter'&&key!=='Backspace'&&stationIndex<0&&ingredientIndex<0)return false;
    if(!down||repeat)return true;
    if(key==='Enter')serve();
    else if(key==='Backspace')clearTray();
    else if(stationIndex>=0)chooseStation(stationNames[stationIndex]);
    else{
      const ingredient=availableIngredients()[ingredientIndex];
      if(ingredient)operate(ingredient);
    }
    return true;
  }
  return {start,update,draw,key,unlocks:catalog,recordText:()=>api.state.served+' lifetime orders · $'+api.state.cash+' banked',
    guide(){api.showChoices('Making a burger','Match the pictures on the ticket, in order.',[
      {label:'1. Start with the bottom bun',detail:'Add each pictured ingredient from left to right.'},
      {label:'2. Tap the grill twice',detail:api.desktop?'Choose Beef to start cooking. Choose it again when it says ready.':'Tap Beef to start cooking. Tap it again when it says ready.'},
      {label:'3. Match the sides and serve',detail:'Green ticks on the ticket show what’s already on your tray.'}
    ]);},
    down(p){
      const slot=api.w/Math.max(queue.length+1,2);
      const i=Math.round(p.x/slot)-1;
      if(p.y>api.h*.435&&p.y<api.h*.67&&queue[i]){selected=queue[i].id;api.tone('button');}
    }
  };
});
})();
