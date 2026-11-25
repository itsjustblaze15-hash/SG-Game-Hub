'use strict';
window.SGArcade = (() => {
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const lerp=(a,b,t)=>a+(b-a)*t;
  const rnd=(a,b)=>a+Math.random()*(b-a);
  const tau=Math.PI*2;
  const ellipse=(g,x,y,rx,ry,fill)=>{g.beginPath();g.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),0,0,tau);g.fillStyle=fill;g.fill();};
  const box=(g,x,y,w,h,r,fill)=>{g.beginPath();g.roundRect(x,y,w,h,r);g.fillStyle=fill;g.fill();};
  const polygon=(g,points,fill)=>{g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fillStyle=fill;g.fill();};
  function gradient(g,x,y,x2,y2,colors) {
    const fill=g.createLinearGradient(x,y,x2,y2);
    colors.forEach((item,i)=>Array.isArray(item)?fill.addColorStop(...item):fill.addColorStop(i/Math.max(1,colors.length-1),item));
    return fill;
  }
  function label(g,str,x,y,size=22,color='white',align='center'){
    g.textAlign=align;g.textBaseline='middle';g.font='900 '+size+'px system-ui';g.fillStyle=color;g.fillText(str,x,y);
  }
  function particleKit(max=145){
    let items=[];
    return {
      burst(x,y,color,count=12,power=135,gravity=155){
        for(let i=0;i<count&&items.length<max;i++){
          const a=rnd(0,tau),v=power*rnd(.2,1.1),life=rnd(.25,.66);
          items.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,r:rnd(1.7,5),color,life,max:life,gravity});
        }
      },
      clear(){items=[];},
      update(dt){items=items.filter(p=>(p.life-=dt)>0);for(const p of items){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=dt*p.gravity;}},
      draw(g){g.save();for(const p of items){g.globalAlpha=p.life/p.max;ellipse(g,p.x,p.y,p.r,p.r*.72,p.color);}g.restore();}
    };
  }
  const $=id=>document.getElementById(id);
  function mount(config,makeGame){
    const c=$('board'), g=c.getContext('2d',{alpha:false});
    const deep=getComputedStyle(document.documentElement).getPropertyValue('--deep');
    const layer=$('menu-layer'), panel=$('menu-panel'), chrome=$('chrome'), stats=$('stats'), toolbar=$('toolbar'), note=$('game-note');
    const id=document.documentElement.dataset.game;
    const key='sg-arcade-v1:'+id;
    const native=window.SGNative;
    const bridge=()=>window.webkit?.messageHandlers?.sgMobile;
    const send=payload=>bridge()?.postMessage(payload);
    function exit(){
      if(native?.appleMobile)send({type:'exit'});
      else if(window.parent!==window)window.parent.postMessage({type:'sg-mobile-exit'},location.origin);
      else location.href='../../';
    }
    function button(text,cb,primary=false){
      const el=document.createElement('button');el.type='button';el.textContent=text;
      if(primary)el.className='main-action';
      el.onclick=()=>{unlockSound();tone('button');cb();};return el;
    }
    if(!window.SGAppleMobile()){
      const title=document.createElement('h2');title.textContent='Mobile Exclusive';
      const text=document.createElement('p');text.className='desc';text.textContent='Exclusively available on iPhone and iPad.';
      panel.replaceChildren(title,text);
      const back=document.createElement('button');back.type='button';back.textContent='Return to SG';back.onclick=exit;panel.append(back);
      return;
    }
    let stored={};
    try { stored=(native?.initialSave ?? JSON.parse(localStorage.getItem(key)))||{}; } catch {}
    const state={...config.defaults,...stored,settings:{music:true,effects:true,haptics:true,...stored.settings},best:{...stored.best}};
    function save(){
      if(native?.appleMobile){send({type:'save',payload:JSON.stringify(state)});return;}
      try {localStorage.setItem(key,JSON.stringify(state));}catch {}
    }
    let mode=config.modes?.[0]??'',screen='menu',scale=1,width=420,height=720,ox=0,oy=0,px=1,renderW=0,renderH=0,dirty=true;
    let game,last=0,elapsed=0,lastNote=0,noticeTime=0,statline='',pointer=null;
    let audio, musicAt=0, noteIndex=0;
    const clips={button:[520,.065,'triangle'],good:[720,.12,'sine'],fail:[132,.22,'triangle'],coin:[1175,.10,'sine'],combo:[940,.18,'triangle'],level:[1046,.24,'sine'],nitro:[192,.19,'sawtooth']};
    const tune=config.tune??[0,7,12,7,3,7,10,7];
    function sound(frequency,duration,wave,volume){
      if(!audio||audio.state!=='running')return;
      const now=audio.currentTime,osc=audio.createOscillator(),gain=audio.createGain();
      osc.type=wave;osc.frequency.value=frequency;gain.gain.setValueAtTime(.0001,now);
      gain.gain.exponentialRampToValueAtTime(volume,now+.014);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
      osc.connect(gain);gain.connect(audio.destination);osc.start(now);osc.stop(now+duration+.02);
    }
    function tone(what){if(!state.settings.effects||!clips[what])return;sound(...clips[what],what==='nitro'?.037:.063);}
    function unlockSound(){
      try {const AC=window.AudioContext||window.webkitAudioContext;if(!audio&&AC)audio=new AC();if(audio?.state==='suspended')audio.resume().catch(()=>{});}catch {}
    }
    function music(now){
      if(!state.settings.music||!audio||document.hidden||now<musicAt||!['menu','play'].includes(screen))return;
      musicAt=now+.31;const index=noteIndex++;
      const pitch=tune[index%tune.length]+(config.root??48);
      sound(440*2**((pitch-69)/12),.27,'triangle',.027);
      if(index%4===0)sound(440*2**((pitch-81)/12),.29,'sine',.036);
    }
    function buzz(strength='light'){
      if(!state.settings.haptics)return;
      if(native?.appleMobile)send({type:'haptic',strength});else navigator.vibrate?.(strength==='heavy'?30:12);
    }
    const context={
      get w(){return width;},get h(){return height;},get mode(){return mode;},get age(){return elapsed;},
      id,state,save,tone,buzz,notice(text){
        note.textContent=text;note.hidden=false;noticeTime=lastNote+2.25;
      },
      hud(entries){
        const joined=JSON.stringify(entries);if(joined===statline)return;statline=joined;
        stats.replaceChildren(...entries.map(([name,value])=>{
          const item=document.createElement('span');item.className='stat';item.textContent=name;
          const val=document.createElement('b');val.textContent=value;item.append(val);return item;
        }));
      },
      controls(entries=[]){
        toolbar.replaceChildren(...entries.map(({label,action,id})=>{
          const b=button(label,()=>{if(screen==='play')action();});if(id)b.id=id;return b;
        }));
      },
      end(score,headline,detail,action=null){
        if(screen!=='play')return;
        const record=score>(state.best[mode]??0);
        if(record){state.best[mode]=score;tone('level');}
        else tone('fail');
        save();display('end');
        title(headline,detail+(record?' New personal best.':''),'Run complete');
        actions([action?[action.label,()=>{action.action();start();},true]:['Play again',start,true],...(action?[['Replay',start]]:[]),['Main menu',menu],['Return to SG',exit]]);
      },
      showChoices,menu
    };
    game=makeGame(context);
    function display(name){
      screen=name;layer.hidden=name==='play';layer.dataset.screen=name;
      chrome.hidden=name!=='play';toolbar.hidden=name!=='play';note.hidden=true;pointer=null;
      if(name!=='play')panel.replaceChildren();
      dirty=true;
    }
    function title(heading,description,tag,main=false){
      if(tag){const eyebrow=document.createElement('p');eyebrow.className='eyebrow';eyebrow.textContent=tag;panel.append(eyebrow);}
      const text=document.createElement(main?'h1':'h2');
      if(main&&config.highlight){
        text.append(heading.slice(0,heading.length-config.highlight.length));const emphasis=document.createElement('em');
        emphasis.textContent=config.highlight;text.append(emphasis);
      }else text.textContent=heading;
      panel.append(text);
      if(description){const desc=document.createElement('p');desc.className='desc';desc.textContent=description;panel.append(desc);}
    }
    function actions(entries){
      const row=document.createElement('div');row.className='menu-actions';
      entries.forEach(([label,cb,primary])=>row.append(button(label,cb,primary)));
      panel.append(row);
    }
    function showChoices(heading,description,entries,back=menu){
      display('options');title(heading,description,config.title);
      const cards=document.createElement('div');cards.className='cards';
      for(const item of entries){
        const el=button('',()=>item.action?.());el.className='choice'+(item.selected?' active':'');
        el.disabled=!!item.disabled||!item.action;
        const strong=document.createElement('strong');strong.textContent=item.label;
        const detail=document.createElement('small');detail.textContent=item.detail??'';el.append(strong,detail);
        cards.append(el);
      }
      panel.append(cards);actions([['Back',back]]);
    }
    function settings(back){
      const open=()=>showChoices('Settings','Change audio and feedback any time.',
        [['music','Music'],['effects','Sound effects'],['haptics','Haptics']].map(([key,label])=>({
          label:label+' '+(state.settings[key]?'on':'off'),
          selected:state.settings[key],action(){state.settings[key]=!state.settings[key];save();open();}
        })),back);
      open();
    }
    function records(){
      showChoices('High scores',game.recordText?.()||'Personal records are saved on this device.',
        (config.modes??['']).map(m=>({label:m||'Best run',detail:config.format?.(state.best[m]??0)??String(state.best[m]??0)})));
    }
    function menu(){
      display('menu');
      title(config.title,config.description,config.category,true);
      if(config.modes?.length>1){
        const modes=document.createElement('div');modes.className='mode-list';modes.setAttribute('aria-label','Game mode');
        for(const m of config.modes){
          const b=button(m,()=>{mode=m;menu();});b.classList.toggle('active',m===mode);
          b.setAttribute('aria-pressed',String(m===mode));modes.append(b);
        }
        panel.append(modes);
      }
      actions([['Play',start,true],[config.unlockTitle??'Unlockables',()=>game.unlocks()],['High scores',records]]);
      actions([['Settings',()=>settings(menu)],['Return to SG',exit]]);
    }
    function start(){
      display('play');elapsed=0;statline='';stats.replaceChildren();context.controls();
      game.start(mode);save();
    }
    function pause(){
      if(screen!=='play')return;
      game.cancel?.();save();display('pause');title('Paused',config.pauseTip??'',config.title);
      actions([['Resume',()=>{display('play');last=0;},true],['Restart',start],['Settings',()=>settings(()=>{
        screen='play';pause();
      })]]);
      actions([['Main menu',menu],['Return to SG',exit]]);
    }
    function size(){
      const rect=c.getBoundingClientRect();if(!rect.width||!rect.height)return;
      const ratio=rect.width/rect.height;
      if(config.orientation==='portrait'){width=420;height=Math.round(clamp(width/ratio,540,940));}
      else{height=560;width=Math.round(clamp(height*ratio,640,1210));}
      scale=Math.min(rect.width/width,rect.height/height);
      ox=(rect.width-width*scale)/2;oy=(rect.height-height*scale)/2;
      px=Math.min(devicePixelRatio||1,1.8,Math.sqrt(1850000/(rect.width*rect.height)));
      c.width=Math.max(1,Math.round(rect.width*px));c.height=Math.max(1,Math.round(rect.height*px));
      if(renderW!==width||renderH!==height){renderW=width;renderH=height;game.resize?.();}
      dirty=true;
    }
    function point(ev){
      const rect=c.getBoundingClientRect();return {x:(ev.clientX-rect.x-ox)/scale,y:(ev.clientY-rect.y-oy)/scale};
    }
    c.addEventListener('pointerdown',ev=>{
      if(screen!=='play'||pointer!==null)return;
      ev.preventDefault();unlockSound();pointer=ev.pointerId;c.setPointerCapture(pointer);game.down?.(point(ev));
    });
    c.addEventListener('pointermove',ev=>{
      if(ev.pointerId!==pointer||screen!=='play')return;
      const samples=ev.getCoalescedEvents?.()||[];
      if(samples.length)for(const sample of samples)game.move?.(point(sample));
      else game.move?.(point(ev));
    });
    c.addEventListener('pointerup',ev=>{
      if(ev.pointerId!==pointer)return;
      pointer=null;if(screen==='play')game.up?.(point(ev));
    });
    for(const type of ['pointercancel','lostpointercapture'])c.addEventListener(type,ev=>{
      if(ev.pointerId===pointer){pointer=null;game.cancel?.();}
    });
    document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();audio?.suspend();}else last=0;});
    addEventListener('pagehide',()=>{pause();save();});
    addEventListener('message',ev=>{
      if(ev.origin===location.origin&&ev.source===window.parent&&ev.data?.type==='sg-mobile-pause')pause();
    });
    addEventListener('sg-native-background',pause);
    $('pause').onclick=()=>{tone('button');pause();};
    $('back-to-sg').onclick=exit;
    const watcher=new ResizeObserver(size);watcher.observe(c);
    function frame(ms){
      const now=ms/1000,dt=last?clamp(now-last,0,.035):0;last=now;lastNote=now;
      if(!document.hidden){
        if(!note.hidden&&now>=noticeTime)note.hidden=true;
        if(screen==='play'){elapsed+=dt;game.update(dt);}
        if(screen==='play'||(screen==='menu'&&Math.floor(now*30)!==Math.floor((now-dt)*30))||dirty){
          dirty=false;g.setTransform(1,0,0,1,0,0);
          g.fillStyle=deep;g.fillRect(0,0,c.width,c.height);
          g.setTransform(scale*px,0,0,scale*px,ox*px,oy*px);g.save();
          g.beginPath();g.rect(0,0,width,height);g.clip();game.draw(g,now,screen);g.restore();
        }
        music(now);
      }
      requestAnimationFrame(frame);
    }
    size();menu();requestAnimationFrame(frame);
  }
  return {mount,clamp,lerp,rnd,tau,ellipse,box,polygon,gradient,label,particleKit};
})();
