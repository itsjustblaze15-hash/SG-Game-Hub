(() => {
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!ios) return;
  const game = location.pathname.split('/').filter(Boolean).pop();
  const key = 'sg-touch-layout-' + game;
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(key)) || {}; } catch {}
  if (game === 'second-chance') {
    const install = window.installTouchControls;
    window.installTouchControls = options => {
      const update = install(options);
      const arrows = document.querySelector('.sg-touch-movement');
      const stick = document.createElement('div');
      stick.id = 'sg-workshop-stick';
      stick.setAttribute('aria-label','Movement joystick');
      stick.innerHTML = '<div></div>';
      arrows.after(stick);
      let pointer = null;
      const keys = ['KeyW','KeyS','KeyA','KeyD'];
      function release() {
        pointer = null;
        options.direction?.(0,0);
        keys.forEach(key => options.hold(key,false));
        stick.firstChild.style.transform = '';
      }
      stick.onpointerdown = event => {
        if (!options.enabled() || pointer !== null) return;
        event.preventDefault();pointer=event.pointerId;stick.setPointerCapture(pointer);
      };
      stick.onpointermove = event => {
        if (pointer!==event.pointerId) return;
        const rect=stick.getBoundingClientRect(), radius=rect.width*.32;
        const x=(event.clientX-rect.x-rect.width/2)/radius;
        const y=(event.clientY-rect.y-rect.height/2)/radius;
        const divisor=Math.max(1,Math.hypot(x,y));
        stick.firstChild.style.transform='translate('+x/divisor*radius+'px,'+y/divisor*radius+'px)';
        options.direction?.(Math.abs(x)<.12?0:x/divisor,Math.abs(y)<.12?0:y/divisor);
      };
      for(const type of ['pointerup','pointercancel','lostpointercapture']) stick.addEventListener(type,release);
      window.sgWorkshopMovement = mode => {
        release();arrows.hidden=mode==='stick';stick.hidden=mode!=='stick';
        saved.movement=mode;
      };
      window.sgWorkshopMovement(saved.movement || 'arrows');
      return () => {update();if(!options.enabled())release();};
    };
  }
  const style = document.createElement('style');
  style.textContent = `
    #sg-workshop-stick{pointer-events:auto;touch-action:none;display:grid;place-items:center;border:2px solid #c5ddd0;border-radius:50%;background:#193a32cc;width:140px;height:140px}
    #sg-workshop-stick[hidden],.sg-touch-movement[hidden]{display:none!important}
    #sg-workshop-stick>div{width:36%;height:36%;border-radius:50%;background:#d6e6d3;pointer-events:none}
    body{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
    #sg-layout-open{position:fixed;right:12px;top:65px;z-index:9999;font:600 13px system-ui;padding:10px;border:1px solid #ffffff70;border-radius:10px;background:#142b37ed;color:white}
    #sg-layout-editor{position:fixed;inset:0;z-index:10000;background:#10202ce8;touch-action:none;color:white;font:14px system-ui}
    #sg-layout-editor[hidden]{display:none}
    #sg-layout-toolbar{position:absolute;inset:8px 8px auto;display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:10px;background:#142b37;border-radius:10px;z-index:2}
    #sg-layout-toolbar button,#sg-layout-toolbar select{padding:9px;border:1px solid #ffffff60;border-radius:7px;background:#294752;color:white;font:600 13px system-ui}
    #sg-layout-toolbar label{display:flex;align-items:center;gap:5px}
    #sg-layout-toolbar input{width:100px}
    .sg-layout-copy{position:absolute;display:flex;align-items:center;justify-content:center;box-sizing:border-box;border:2px solid #a8cad6;border-radius:50%;background:#284c60e6;color:white;font:700 13px system-ui;touch-action:none}
    .sg-layout-copy[aria-pressed=true]{border-color:#ffe599;background:#5b6046}
    #sg-layout-note{position:absolute;top:130px;left:12px;right:12px;pointer-events:none;text-align:center}
  `;
  document.head.append(style);
  const open = document.createElement('button');
  open.id = 'sg-layout-open';
  open.type = 'button';
  open.textContent = 'Touch layout';
  open.hidden = true;
  const editor = document.createElement('div');
  editor.id = 'sg-layout-editor';
  editor.hidden = true;
  editor.setAttribute('role', 'dialog');
  editor.setAttribute('aria-label', 'Touch control layout');
  editor.innerHTML = '<div id="sg-layout-toolbar"><label>Control <select aria-label="Control"></select></label><label>Size <input aria-label="Control size" type="range" min="44" max="160" step="2"><output></output></label><button type="button" data-reset>Reset</button><button type="button" data-done>Done</button></div><p id="sg-layout-note">Drag each circle to position it. Choose a control to change its size. Preview is actual screen size.</p>';
  document.body.append(open, editor);
  let controls = [];
  let baseline = {};
  let selected = 0;
  let draft = [];
  let restoreFocus;
  function discover() {
    if (game === 'apex-circuit') return [...document.querySelectorAll('#touch-controls .tbtn')];
    if (game === 'blacktide') return [...document.querySelectorAll('#stick, #mobileUI .mobileBtn')].filter(el => el.id !== 'sgPhoneSettings');
    return [...document.querySelectorAll('.sg-touch-movement, #sg-workshop-stick, .sg-touch-actions button')];
  }
  function identify(el, i) { return el.id || el.textContent.trim() || 'movement-' + i; }
  function bounds(item) {
    const size = Math.min(item.size, innerWidth * .42, innerHeight * .42);
    return { size, x: Math.max(0, Math.min(innerWidth - size, item.x * innerWidth)),
      y: Math.max(0, Math.min(innerHeight - size, item.y * innerHeight)) };
  }
  function apply() {
    controls.forEach((el, i) => {
      const item = saved[identify(el, i)];
      if (!item) return;
      const b = bounds(item);
      for (const [name, value] of Object.entries({position:'fixed',left:b.x+'px',top:b.y+'px',right:'auto',bottom:'auto',width:b.size+'px',height:b.size+'px',minWidth:'0',minHeight:'0',margin:'0'})) el.style.setProperty(name.replace(/[A-Z]/g, c => '-'+c.toLowerCase()), value, 'important');
      if (el.classList.contains('sg-touch-movement')) {
        el.style.gridTemplateColumns = 'repeat(3,1fr)';
        el.style.gridTemplateRows = 'repeat(2,1fr)';
        el.querySelectorAll('button').forEach(button => { button.style.minWidth='0';button.style.minHeight='0';button.style.width='100%';button.style.height='100%'; });
      }
    });
  }
  function defaults() {
    const result = {};
    controls.forEach((el,i) => {
      const r = el.getBoundingClientRect();
      let size = Math.max(56, r.width);
      let x = r.x / innerWidth, y = r.y / innerHeight;
      if (game === 'second-chance') {
        const move = el.classList.contains('sg-touch-movement') || el.id==='sg-workshop-stick';
        size=move ? Math.min(146,innerWidth*.38) : Math.min(64,innerHeight*.19);
        x=move ? .04 : (innerWidth - (i%2+1)*(size+8)-12)/innerWidth;
        y=move ? (innerHeight-size-18)/innerHeight : (innerHeight-(Math.floor((i-2)/2)+1)*(size+8)-18)/innerHeight;
      }
      if (game === 'blacktide' && (!r.width || !r.height)) {
        size=el.id==='stick'?140:58;
        x=el.id==='stick'?.04:(innerWidth-size-16-(i%3)*(size+8))/innerWidth;
        y=(innerHeight-size-20-Math.floor(i/3)*(size+8))/innerHeight;
      }
      if (game === 'apex-circuit') {
        size = Math.min(76,innerHeight*.2);
        const positions = {'t-left':[16,innerHeight-size-20],'t-right':[28+size,innerHeight-size-20],
          't-brake':[innerWidth-size*2-28,innerHeight-size-20],'t-gas':[innerWidth-size-16,innerHeight-size-20]};
        [x,y] = positions[el.id].map((v,index) => v/(index ? innerHeight : innerWidth));
      }
      result[identify(el,i)] = {x,y,size};
    });
    return result;
  }
  function save() { try { localStorage.setItem(key,JSON.stringify(saved)); } catch {} }
  const select = editor.querySelector('select');
  const slider = editor.querySelector('input');
  function selectControl(index) {
    selected = index; select.value = index;
    slider.value = draft[index].size;
    editor.querySelector('output').textContent = Math.round(draft[index].size)+' px';
    editor.querySelectorAll('.sg-layout-copy').forEach((el,i) => el.setAttribute('aria-pressed',String(i===index)));
  }
  function render() {
    editor.querySelectorAll('.sg-layout-copy').forEach(el => el.remove());
    draft.forEach((item,i) => {
      const b = bounds(item);
      const copy = document.createElement('button');
      copy.type = 'button';copy.className='sg-layout-copy';
      copy.textContent=controls[i].getAttribute('aria-label') || (controls[i].id==='stick' || controls[i].classList.contains('sg-touch-movement') ? 'Movement' : controls[i].textContent.trim());
      Object.assign(copy.style,{left:b.x+'px',top:b.y+'px',width:b.size+'px',height:b.size+'px'});
      let drag = null;
      copy.onpointerdown = event => {
        event.preventDefault();selectControl(i);
        drag={id:event.pointerId,x:event.clientX,y:event.clientY,left:bounds(item).x,top:bounds(item).y};
        copy.setPointerCapture(event.pointerId);
      };
      copy.onpointermove = event => {
        if (!drag || event.pointerId!==drag.id) return;
        item.x=(drag.left+event.clientX-drag.x)/innerWidth;
        item.y=(drag.top+event.clientY-drag.y)/innerHeight;
        const next=bounds(item);item.x=next.x/innerWidth;item.y=next.y/innerHeight;
        copy.style.left=next.x+'px';copy.style.top=next.y+'px';
      };
      for (const type of ['pointerup','pointercancel','lostpointercapture']) copy.addEventListener(type,()=>drag=null);
      editor.append(copy);
    });
    selectControl(selected);
  }
  select.onchange=()=>selectControl(Number(select.value));
  slider.oninput=()=>{draft[selected].size=Number(slider.value);render();};
  open.onclick=()=>{
    restoreFocus=document.activeElement;
    draft=controls.map((el,i)=>({...saved[identify(el,i)]}));
    select.replaceChildren(...controls.map((el,i)=>{const option=document.createElement('option');option.value=i;option.textContent=el.getAttribute('aria-label') || (el.id==='stick'||el.classList.contains('sg-touch-movement')?'Movement':el.textContent.trim());return option;}));
    editor.hidden=false;selected=0;render();select.focus();
  };
  editor.querySelector('[data-reset]').onclick=()=>{
    saved={...baseline};draft=controls.map((el,i)=>({...saved[identify(el,i)]}));render();
  };
  editor.querySelector('[data-done]').onclick=()=>{
    controls.forEach((el,i)=>saved[identify(el,i)]={...draft[i]});
    save();apply();editor.hidden=true;restoreFocus?.focus();
  };
  const observer = new MutationObserver(() => {
    const found = discover();
    if (!found.length || found.length===controls.length) return;
    controls=found;
    const initial=defaults();
    baseline=initial;
    for(const [id,value] of Object.entries(initial)) if(!saved[id]) saved[id]=value;
    apply();open.hidden=false;
    if(game==='second-chance' && !editor.querySelector('[data-movement]')) {
      const label=document.createElement('label');label.textContent='Movement ';
      const choice=document.createElement('select');choice.dataset.movement='';
      choice.innerHTML='<option value="arrows">Arrows</option><option value="stick">Joystick</option>';
      choice.value=saved.movement || 'arrows';
      choice.onchange=()=>{window.sgWorkshopMovement(choice.value);save();};
      label.append(choice);editor.querySelector('#sg-layout-toolbar').prepend(label);
    }
  });
  observer.observe(document.body,{childList:true,subtree:true});
  // Existing controls can be present before this script loads.
  document.body.append(document.createComment('touch layout ready'));
  addEventListener('resize',()=>{apply();if(!editor.hidden)render();});
  document.addEventListener('contextmenu',event=>event.preventDefault());
})();
