import * as T from './vendor/three.module.js';

// All of the scenery is rendered geometry. Textures are generated locally;
// this art pass needs no network assets and does not touch game/save state.
export function applyArtDirection(world, {box,cylinder,sphere,label,mat,makePart}) {
 const s=world.scene, decor=new T.Group();decor.name='Golden-hour workshop';s.add(decor);
 const stone=['#b7b0a2','#bcb5a7','#c5bcab','#ada797','#c1b7a7'];
 const seeded=i=>{const n=Math.sin(i*127.1+311.7)*43758.5453;return n-Math.floor(n);};
 function surface(kind){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d');
  ctx.fillStyle=kind==='paving'?'#918b7f':'#ddd5c6';ctx.fillRect(0,0,512,512);
  const rows=kind==='paving'?4:8,cols=kind==='paving'?3:4,h=512/rows,w=512/cols;
  for(let y=0;y<rows;y++)for(let x=-1;x<=cols;x++){
   const v=seeded(y*13+x+50),ox=(y%2)*w/2;
   ctx.fillStyle=kind==='paving'?stone[Math.floor(v*stone.length)]:['#e5ddcf','#dcd4c6','#e9e1d5','#d9d1c1'][Math.floor(v*4)];
   ctx.fillRect(x*w+ox+1,y*h+1,w-2,h-2);
   ctx.fillStyle='rgba(255,255,255,.08)';ctx.fillRect(x*w+ox+2,y*h+2,w-4,2);
  }
  for(let i=0;i<12000;i++){ctx.fillStyle=i%2?'rgba(65,53,42,.04)':'rgba(255,255,255,.055)';ctx.fillRect(seeded(i+800)*512,seeded(i+19000)*512,1.5,1.5);}
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.anisotropy=Math.min(8,world.renderer.capabilities.getMaxAnisotropy());
  return texture;
 }
 // Extruded building meshes have UVs in meters, so repeats are per meter.
 const paving=surface('paving');paving.repeat.set(.17,.17);
 const masonry=surface('masonry');masonry.repeat.set(.22,.22);
 // Replace existing surfaces instead of adding overlapping planes.
 const colorIs=(o,c)=>o.material?.color?.equals(new T.Color(c));
 const original=[...s.children];
 for(const o of original){
  if(!o.isMesh)continue;
  if(colorIs(o,'#e6d6a5')){o.material=new T.MeshStandardMaterial({color:'#e6d6a5',map:paving,roughness:.87});o.material.color.set('#ffffff');o.name='Paved forecourt';}
  if(colorIs(o,'#d9e2e8')){const tex=paving.clone();tex.repeat.set(.17,.17);o.material=new T.MeshStandardMaterial({map:tex,color:'#d5d0c6',roughness:.69});}
  if(colorIs(o,'#f5f1e8')||colorIs(o,'#fbf7ed'))o.material=new T.MeshStandardMaterial({map:masonry,roughness:.9});
  if(colorIs(o,'#eff2f4'))o.material=mat('#c9c7be',.8);
  if(colorIs(o,'#88c96d'))o.material=mat('#6c8b50');
  if(colorIs(o,'#e8d0a0')){o.material=mat('#c1ad86');o.geometry=new T.BoxGeometry(60,.05,86);o.position.z=37;}
  if(colorIs(o,'#267987')||colorIs(o,'#2f7f8b'))o.material=mat('#235d62',.48,.22);
  if(colorIs(o,'#729a70'))o.material=mat('#365b5b',.47,.28);
  if(o.isInstancedMesh&&colorIs(o,'#69ae73')){o.material=mat('#58713b').clone();o.material.flatShading=true;o.scale.y=1.35;}
  if(o.isInstancedMesh&&colorIs(o,'#8ebf6f'))o.material=mat('#779154');
 }
 // A continuous sky gradient and sunset disk, including behind the player.
 const sunDirection=new T.Vector3(45,24,38).normalize();
 const sky=new T.Mesh(new T.SphereGeometry(218,32,16),new T.ShaderMaterial({
  side:T.BackSide,depthWrite:false,fog:false,toneMapped:false,
  uniforms:{sunDirection:{value:sunDirection},blue:{value:new T.Color('#5989ad')},zenith:{value:new T.Color('#345c7c')},peach:{value:new T.Color('#e8aa87')},gold:{value:new T.Color('#ffc382')}},
  vertexShader:'varying vec3 direction; void main(){direction=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`varying vec3 direction; uniform vec3 sunDirection,blue,zenith,peach,gold;
   void main(){vec3 d=normalize(direction);float warm=pow(max(dot(normalize(vec3(d.x,0.,d.z)),normalize(vec3(sunDirection.x,0.,sunDirection.z))),0.),3.);
   vec3 horizon=mix(peach,gold,warm*.85);vec3 c=mix(horizon,blue,smoothstep(-.05,.44,d.y));c=mix(c,zenith,smoothstep(.45,1.,d.y));
   float facing=max(dot(d,sunDirection),0.);c+=vec3(1.,.65,.27)*pow(facing,100.)*.3;c=mix(c,vec3(1.,.94,.69),smoothstep(.99955,.9997,facing));
   gl_FragColor=vec4(c,1.);
   #include <colorspace_fragment>
  }`
 }));sky.name='Sunset sky';sky.renderOrder=-10;s.add(sky);world.sky=sky;
 // A filtered reflection environment gives curved paint and glass highlights.
 const env=document.createElement('canvas');env.width=1024;env.height=512;const ec=env.getContext('2d'),gradient=ec.createLinearGradient(0,0,0,512);
 [[0,'#547b9b'],[.30,'#8bb6cf'],[.47,'#edbd99'],[.53,'#c1a17b'],[1,'#343e34']].forEach(([p,c])=>gradient.addColorStop(p,c));ec.fillStyle=gradient;ec.fillRect(0,0,1024,512);
 // Broad soft light sources, rather than sharp artificial chrome speckles.
 ec.fillStyle='#ffe3ae';ec.fillRect(612,130,90,55);ec.fillStyle='#e5edf0';ec.fillRect(160,175,200,24);
 const envMap=new T.CanvasTexture(env);envMap.mapping=T.EquirectangularReflectionMapping;envMap.colorSpace=T.SRGBColorSpace;
 const pmrem=new T.PMREMGenerator(world.renderer);world.reflectionTarget=pmrem.fromEquirectangular(envMap);s.environment=world.reflectionTarget.texture;envMap.dispose();pmrem.dispose();
 s.background=new T.Color('#dda77e');s.fog=new T.Fog('#d5b09c',100,205);world.renderer.toneMappingExposure=1.03;
 s.children.filter(o=>o.isHemisphereLight).forEach(o=>{o.color.set('#b7d3e5');o.groundColor.set('#b29b7d');o.intensity=1.05;});
 world.sun.color.set('#ffd5a2');world.sun.intensity=3.1;world.sun.position.set(45,24,38);world.sun.shadow.camera.left=-36;world.sun.shadow.camera.right=36;world.sun.shadow.camera.top=36;world.sun.shadow.camera.bottom=-36;world.sun.shadow.camera.far=140;world.sun.shadow.normalBias=.025;
 s.children.filter(o=>o.isPointLight).forEach(o=>{o.color.set('#ffcc91');o.intensity=24;});
 for(const x of [-8,0,8]){const light=new T.PointLight('#ffd49c',40,18,2);light.position.set(x,3.9,-3.3);decor.add(light);}
 // Three tightly bounded shadow cones give cars and tools depth inside the
 // garage without rendering the entire junkyard into point-light cube maps.
 world.bayShadowLights=[];
 for(const x of [-7,0,7]){
  const light=new T.SpotLight('#ffe0b4',38,11,.76,.5,2);light.position.set(x,4.92,0);light.target.position.set(x,0,-1);
  light.castShadow=true;light.shadow.mapSize.set(768,768);light.shadow.camera.near=.3;light.shadow.camera.far=11;light.shadow.bias=-.00015;light.shadow.normalBias=.017;
  decor.add(light,light.target);world.bayShadowLights.push({light,bay:x===0?0:x===7?1:2});
 }
 // Warm practical lamps: fittings, cables and fluorescent diffusers.
 const luminous=new T.MeshBasicMaterial({color:'#ffe1ad'});
 for(const x of [-10,-5,0,5,10]){
  box(decor,3.3,.13,.34,'#455457',x,4.93,-5.7,.035);box(decor,3.04,.025,.21,luminous,x,4.85,-5.7,.01);
  for(const dx of [-1.1,1.1])cylinder(decor,.012,.012,.29,'#4a5552',x+dx,5.11,-5.7,6);
 }
 // Architectural framing, roof edging, gutter and wall-mounted ventilation.
 for(const x of [-13.84,13.84]){
  box(decor,.08,.24,18.1,'#426565',x,4.99,1,.014);
  cylinder(decor,.06,.06,4.5,'#466264',x,2.25,-7.5,8);
 }
 box(decor,28.8,.06,.11,'#e4d8ba',0,5.19,-8.38,.01);
 box(decor,28.5,.15,.18,'#19474f',0,5.58,-8.23,.02);
 for(const x of [-11,11]){box(decor,1.25,.82,.11,'#73817a',x,4.23,9.79,.04);for(let i=0;i<6;i++)box(decor,1.10,.025,.04,'#3c4f4b',x,3.94+i*.11,9.71,.004);}
 // Rear shelves sit outside the repair lanes and leave the salvage gate clear.
 for(const x of [-8.2,8.2]){
  for(const dx of [-1.75,1.75])box(decor,.08,2.6,.08,'#465e5a',x+dx,1.43,9.28,.01);
  for(const y of [.38,1.12,1.87,2.64])box(decor,3.62,.08,.62,'#8f9b8c',x,y,9.28,.01);
  world.collider(x,9.28,3.7,.7);
  for(let i=0;i<12;i++){
   const shelf=Math.floor(i/4),cx=x-1.35+(i%4)*.86,cy=.47+shelf*.75;
   if(i%3===0){box(decor,.57,.27,.39,'#ae9066',cx,cy+.1,9.27,.025);box(decor,.07,.27,.40,'#d6c3a0',cx,cy+.1,9.27,.004);}
   else{box(decor,.20,.32,.18,['#42676c','#ceaa63','#927a65'][i%3],cx,cy+.15,9.27,.025);box(decor,.08,.045,.07,'#3a4749',cx,cy+.33,9.27,.008);box(decor,.14,.13,.01,'#e0d5b7',cx,cy+.15,8.17+1,.003);}
  }
 }
 function toolCabinet(x,z,color){
  const cabinet=new T.Group();cabinet.position.set(x,0,z);decor.add(cabinet);
  box(cabinet,1.05,.96,.64,color,0,.65,0,.04);box(cabinet,1.12,.07,.71,'#3d5052',0,1.17,0,.025);
  for(let j=0;j<5;j++){box(cabinet,.95,.135,.018,color,0,.34+j*.16,-.33,.012);box(cabinet,.58,.018,.037,'#b6b8ac',0,.38+j*.16,-.351,.005);}
  for(const a of [-.41,.41])for(const b of [-.22,.22]){const w=cylinder(cabinet,.075,.075,.045,'#293835',a,.19,b,10);w.rotation.z=Math.PI/2;}
  world.collider(x,z,1.12,.74);
 }
 toolCabinet(-4.7,7.9,'#ae5540');toolCabinet(4.7,7.9,'#c66a43');
 // Welding bottles, compressor, tool trays, wall hooks and storage drums.
 for(const x of [12.5,13.1]){cylinder(decor,.17,.17,1.14,x<13?'#416f6c':'#4d6773',x,.75,3.9,12);sphere(decor,.17,'#637b74',x,1.31,3.9,1,.6,1);box(decor,.05,.08,.06,'#c9ac72',x,1.46,3.9,.008);}
 const compressor=cylinder(decor,.24,.24,.91,'#8f4f3e',12.2,.55,7.7,12);compressor.rotation.z=Math.PI/2;box(decor,.30,.22,.31,'#465858',12.2,.91,7.7,.035);
 for(const x of [-12.65,-11.65]){cylinder(decor,.30,.30,.85,'#55716a',x,.55,8.9,12);for(const y of [.28,.81])cylinder(decor,.309,.309,.035,'#364f4b',x,y,8.9,12);}
 for(let i=0;i<4;i++){const tire=makePart('wheelFL');tire.rotation.z=Math.PI/2;tire.position.set(12.6,.33+i*.29,-1.1);decor.add(tire);}
 world.collider(12.6,-1.1,1.1,1.1);
 for(const x of [-13.77,13.77])for(let i=0;i<6;i++){box(decor,.035,.12,.53,'#929d8e',x,2.5+i*.12,2.8,.01);}
 label(decor,'SERVICE & RESTORATION',7.2,.46,0,3.89,-8.15,'#235d62','#edcc93',58);
 // Paving drains and forecourt markings have real separation from road/curb.
 for(const x of [-11,11]){
  box(decor,1.12,.018,.31,'#53615a',x,.02,-12.3,.009);
  for(let i=0;i<9;i++)box(decor,.045,.01,.27,'#263c3b',x-.46+i*.115,.032,-12.3,.004);
 }
 for(const x of [-7,0,7]){box(decor,.055,.012,4.2,'#ede4c8',x,.02,-10.9,.003);}
 for(const x of [-15.9,15.9]){
  box(decor,2.2,.75,2.0,'#b3b4a0',x,.32,-10.5,.04);box(decor,2.1,.06,1.91,'#49614b',x,.72,-10.5,.025);
  sphere(decor,.84,'#627c43',x,1.27,-10.5,1,.76,1);
  world.collider(x,-10.5,2.25,2.05);
 }
 const canopyGeo=new T.IcosahedronGeometry(1,1);
 for(const [x,z,scale] of [[-18,-5,1.15],[20,1,1.0],[-19,9,1.0]]){
  cylinder(decor,.21,.43,4.3*scale,'#6d6247',x,2.15*scale,z,8);
  const branch=box(decor,.23,2.3,.23,'#6d6247',x+.55,3.8*scale,z,.03);branch.rotation.z=-.6;
  for(let i=0;i<5;i++){
   const leaves=new T.Mesh(canopyGeo,mat(['#4e6835','#667a40','#556f39'][i%3]));
   leaves.position.set(x+Math.sin(i*2.4)*1.3*scale,(4.9+(i%3)*.65)*scale,z+Math.cos(i*2.4)*1.0*scale);
   leaves.scale.set(1.65*scale,1.6*scale,1.6*scale);leaves.rotation.y=i;decor.add(leaves);
  }
  world.collider(x,z,.85,.85);
 }
 // Distant hills/city are scenery only, well outside the playable property.
 const hills=new T.InstancedMesh(new T.ConeGeometry(1,1,5),new T.MeshBasicMaterial({color:'#9999a5'}),11),dummy=new T.Object3D();
 for(let i=0;i<11;i++){dummy.position.set(-140+i*29,0,158+seeded(i)*14);dummy.scale.set(34+seeded(i+20)*23,14+seeded(i+70)*13,24);dummy.rotation.y=i*.7;dummy.updateMatrix();hills.setMatrixAt(i,dummy.matrix);}hills.castShadow=false;decor.add(hills);
 const towers=new T.InstancedMesh(new T.BoxGeometry(1,1,1),mat('#9a9990'),24);
 for(let i=0;i<24;i++){const h=5+seeded(i+90)*19;dummy.position.set(37+i*2.5,h/2,110+seeded(i)*8);dummy.scale.set(1.6+seeded(i+14)*2.4,h,2.5);dummy.rotation.set(0,0,0);dummy.updateMatrix();towers.setMatrixAt(i,dummy.matrix);}towers.castShadow=false;decor.add(towers);
 for(const x of [42,57,72]){
  cylinder(decor,.13,.19,9.2,'#71654f',x,4.6,-28,8);box(decor,3.6,.13,.14,'#635c4b',x,8.3,-28,.012);
  for(const dx of [-1.3,0,1.3])cylinder(decor,.07,.07,.22,'#c6ba9b',x+dx,8.5,-28,6);
  if(x<72)for(const dx of [-1.3,0,1.3]){
   const curve=new T.QuadraticBezierCurve3(new T.Vector3(x+dx,8.6,-28),new T.Vector3(x+7.5+dx,7.1,-28),new T.Vector3(x+15+dx,8.6,-28));
   const wire=new T.Mesh(new T.TubeGeometry(curve,12,.013,3,false),mat('#4b4a43'));decor.add(wire);
  }
 }
 // Lighting on car exteriors is enabled separately in addCar, including wheels.
 decor.traverse(o=>{if(o.isMesh){o.receiveShadow=true;o.castShadow=!(o.isInstancedMesh||o.material.isMeshBasicMaterial);}});
 sky.castShadow=sky.receiveShadow=false;
}
