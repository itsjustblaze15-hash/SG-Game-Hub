/* Transform only the hosted iPhone build. The original Mac game is a separate file. */
window.sgPrepareBlacktide = function (source) {
  function replaceOnce(before, after) {
    if (source.split(before).length !== 2) throw new Error('BLACKTIDE phone patch no longer matches');
    source = source.replace(before, after);
  }

  replaceOnce('m={rig:{ready:false,dispose(){}},used:0}',
    'm={rig:{ready:false,queue:[],draw(){},dispose(){}},used:0}');
  replaceOnce('Object.assign(pending,ready);',
    'Object.assign(pending.rig,ready.rig);ready.rig=pending.rig;Object.assign(pending,ready);');

  replaceOnce("const isTouch=('ontouchstart' in window)||matchMedia('(pointer:coarse)').matches;",
    "const isTouch=('ontouchstart' in window)||matchMedia('(pointer:coarse), (max-height:550px) and (max-width:1100px)').matches;");
  replaceOnce('const settings={quality:', `
const sgPhonePreferences = {moveSpeed:1.35,recoil:.35,aimMode:'toggle',detailedHUD:false};
try {
 const saved=JSON.parse(localStorage.getItem('sg-blacktide-phone-controls'));
 if(saved){
  sgPhonePreferences.moveSpeed=clamp(Number(saved.moveSpeed)||1.35,1,1.8);
  sgPhonePreferences.recoil=clamp(Number(saved.recoil)||.35,.1,1);
  sgPhonePreferences.aimMode=saved.aimMode==='hold'?'hold':'toggle';
  sgPhonePreferences.detailedHUD=!!saved.detailedHUD;
 }
}catch(_){}
const settings={quality:`);

  replaceOnce('function bindCombatButton(id,held,action){', `
function sgSavePhonePreferences(){
 try{localStorage.setItem('sg-blacktide-phone-controls',JSON.stringify(sgPhonePreferences));}catch(_){}
 document.body.classList.toggle('sg-compact-hud',isTouch&&!sgPhonePreferences.detailedHUD);
}
function sgSyncPhoneAim(){
 if(!isTouch)return;
 const button=document.getElementById('aimBtn'),pressed=combatInput.aim;
 if(button.getAttribute('aria-pressed')!==String(pressed)){
  button.setAttribute('aria-pressed',String(pressed));
  button.classList.toggle('pressed',pressed);
  button.textContent=pressed?'AIM ON':'AIM';
 }
}
function sgSetupPhoneAim(){
 if(!isTouch){bindCombatButton('aimBtn','aim');return;}
 const button=document.getElementById('aimBtn');let pointer=null,x=0,y=0;
 button.setAttribute('aria-label','Toggle aim. Drag to look while aiming.');
 button.addEventListener('pointerdown',event=>{
  event.preventDefault();if(!active||pointer!==null)return;
  pointer=event.pointerId;x=event.clientX;y=event.clientY;
  button.setPointerCapture(pointer);
  combatInput.aim=sgPhonePreferences.aimMode==='hold'||!combatInput.aim;
  sgSyncPhoneAim();
 });
 button.addEventListener('pointermove',event=>{
  if(event.pointerId!==pointer||!active)return;
  lookInput(event.clientX-x,event.clientY-y,settings.touch*1.3);
  x=event.clientX;y=event.clientY;
 });
 function release(event){
  if(event.pointerId!==pointer)return;
  pointer=null;
  if(sgPhonePreferences.aimMode==='hold')combatInput.aim=false;
  sgSyncPhoneAim();
 }
 for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,release);
}
function sgSetupPhoneOptions(){
 if(!isTouch)return;
 document.documentElement.dataset.sgPhoneGame='blacktide';
 const options=document.createElement('section');
 options.id='sg-phone-options';
 options.innerHTML='<h3>iPhone controls</h3>'+
  '<div class="settingRow"><label for="sg-aim-mode">Aiming</label><select id="sg-aim-mode"><option value="toggle">Tap to lock aim</option><option value="hold">Hold to aim</option></select></div>'+
  '<div class="settingRow"><label for="sg-move-speed">Movement speed</label><output id="sg-move-value"></output><input id="sg-move-speed" type="range" min="1" max="1.8" step=".05"></div>'+
  '<div class="settingRow"><label for="sg-recoil">Recoil strength</label><output id="sg-recoil-value"></output><input id="sg-recoil" type="range" min=".1" max="1" step=".05"></div>'+
  '<div class="settingRow"><label for="sg-detailed-hud">Detailed combat HUD</label><input id="sg-detailed-hud" type="checkbox"></div>';
 settingsPanel.querySelector('.settingsFooter').before(options);
 const aim=document.getElementById('sg-aim-mode');
 aim.value=sgPhonePreferences.aimMode;
 aim.addEventListener('change',()=>{sgPhonePreferences.aimMode=aim.value;combatInput.aim=false;sgSyncPhoneAim();sgSavePhonePreferences();});
 for(const [id,key,out] of [['sg-move-speed','moveSpeed','sg-move-value'],['sg-recoil','recoil','sg-recoil-value']]){
  const input=document.getElementById(id),output=document.getElementById(out);
  input.value=sgPhonePreferences[key];
  function update(){sgPhonePreferences[key]=Number(input.value);output.textContent=key==='recoil'?Math.round(Number(input.value)*100)+'%':Number(input.value).toFixed(2)+'×';}
  update();input.addEventListener('input',()=>{update();sgSavePhonePreferences();});
 }
 const details=document.getElementById('sg-detailed-hud');
 details.checked=sgPhonePreferences.detailedHUD;
 details.addEventListener('change',()=>{sgPhonePreferences.detailedHUD=details.checked;sgSavePhonePreferences();});
 const settingsButton=document.createElement('button');
 settingsButton.id='sgPhoneSettings';settingsButton.className='mobileBtn';settingsButton.type='button';
 settingsButton.textContent='SETTINGS';settingsButton.onclick=()=>{pause();showSettings(true);};
 document.getElementById('mobileUI').append(settingsButton);
 sgSavePhonePreferences();
}
function bindCombatButton(id,held,action){`);
  replaceOnce("bindCombatButton('aimBtn','aim');bindCombatButton('interactBtn'",
    "sgSetupPhoneAim();sgSetupPhoneOptions();bindCombatButton('interactBtn'");

  replaceOnce("if(WORLD_MAP==='br'){const wl=brWaterLevel(player.x,player.z);",
    "if(isTouch)speed*=sgPhonePreferences.moveSpeed;\n if(WORLD_MAP==='br'){const wl=brWaterLevel(player.x,player.z);");
  replaceOnce('combat.kick+w.recoil)', 'combat.kick+w.recoil*(isTouch?sgPhonePreferences.recoil:1))');
  replaceOnce('player.pitch+w.recoil*.26', 'player.pitch+w.recoil*.26*(isTouch?sgPhonePreferences.recoil:1)');
  replaceOnce('(Math.random()-.5)*w.recoil*.22', '(Math.random()-.5)*w.recoil*.22*(isTouch?sgPhonePreferences.recoil:1)');
  replaceOnce('function frame(now){', 'function frame(now){sgSyncPhoneAim();');
  replaceOnce("isTouch?.75:.85", "isTouch?1:.85");
  replaceOnce("isTouch?1.:1.0", "isTouch?1.25:1.0");
  replaceOnce("isTouch?1.25:Math.min", "isTouch?1.6:Math.min");

  replaceOnce("const picture=new Image();picture.src='sg-asset-003.png';await picture.decode();",
    `const [picture,sgGearImage,sgFoliageImage]=await Promise.all(['sg-asset-003.png','sg-asset-004.png','sg-asset-005.png'].map(async src=>{const image=new Image();image.src=src;await image.decode();return image;}));`);
  replaceOnce('const image=new Image();image.src=data;await image.decode();',
    "const image=data==='sg-asset-004.png'?sgGearImage:sgFoliageImage;");
  replaceOnce('await v9LoadAtlas();await prepareNavigation();',
    'await Promise.all([v9LoadAtlas(),prepareNavigation()]);');
  // Phone matches can start while optional cosmetic outfits finish streaming.
  replaceOnce('for(let i=0;i<320&&rigs.some(r=>!r.ready);i++)',
    'for(let i=0;i<(isTouch?120:320)&&rigs.some(r=>!r.ready);i++)');
  for (const delay of [1200,1300,1800]) {
    replaceOnce('await v36Delay('+delay+');if(token!==br.matchToken)return;',
      'await v36Delay(isTouch?100:'+delay+');if(token!==br.matchToken)return;');
  }
  replaceOnce('for(let n=3;n>0;n--)',
    'for(let n=isTouch?1:3;n>0;n--)');
  replaceOnce('await v36Delay(1000);if(token!==br.matchToken)return;',
    'await v36Delay(isTouch?300:1000);if(token!==br.matchToken)return;');
  replaceOnce('</head>', '<link rel="stylesheet" href="phone.css?v=20261121-1"></head>');
  source = source.replace('</body>', '<script src="../mobile-layout.js?v=1"></script></body>');
  return source;
};
