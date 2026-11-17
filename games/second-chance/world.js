import {designFor} from './designs.js';
import {applyArtDirection} from './art-direction.js';
import {makeDistantVehicle,disposeDistantVehicle,batchStaticMeshes} from './vehicle-lod.js';
import * as T from './vendor/three.module.js';
import {PARTS,MODELS,model,wheelFor,condition,vehicleLiftHeight} from './engine.js';
export {T};
const materials=new Map(),geometries=new Map();
export function mat(color,rough=.72,metal=.05){const k=color+':'+rough+':'+metal;if(!materials.has(k))materials.set(k,(rough<=.43&&metal>=.22?new T.MeshPhysicalMaterial({color,roughness:Math.min(rough,.30),metalness:metal,clearcoat:.82,clearcoatRoughness:.22,envMapIntensity:.7}):new T.MeshStandardMaterial({color,roughness:rough,metalness:metal})));return materials.get(k);}
function torusGeo(r,t,rs,ts,arc=Math.PI*2){const key=['torus',r,t,rs,ts,arc].join();if(!geometries.has(key))geometries.set(key,new T.TorusGeometry(r,t,rs,ts,arc));return geometries.get(key);}
function glassPanel(parent,points,color='#7eabc6'){const key='glass'+points.flat().join(',');if(!geometries.has(key)){const shape=new T.Shape();shape.moveTo(...points[0]);points.slice(1).forEach(p=>shape.lineTo(...p));shape.closePath();const geo=new T.ExtrudeGeometry(shape,{depth:.04,bevelEnabled:false,curveSegments:1});geo.translate(0,0,-.02);geo.rotateY(-Math.PI/2);geometries.set(key,geo);}const mesh=new T.Mesh(geometries.get(key),mat(color,.25,.2));parent.add(mesh);return mesh;}
export function roundGeo(w,h,d,r=.06){r=Math.min(r,w/3,h/3,d/3);const k=[w,h,d,r].join();if(geometries.has(k))return geometries.get(k);const x=-w/2+r,y=-h/2+r,W=w-2*r,H=h-2*r,s=new T.Shape();s.moveTo(x,y+r);s.lineTo(x,y+H-r);s.quadraticCurveTo(x,y+H,x+r,y+H);s.lineTo(x+W-r,y+H);s.quadraticCurveTo(x+W,y+H,x+W,y+H-r);s.lineTo(x+W,y+r);s.quadraticCurveTo(x+W,y,x+W-r,y);s.lineTo(x+r,y);s.quadraticCurveTo(x,y,x,y+r);const g=new T.ExtrudeGeometry(s,{depth:d-2*r,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:r,bevelThickness:r,curveSegments:2});g.translate(0,0,-d/2+r);g.computeVertexNormals();geometries.set(k,g);return g;}
export function box(parent,w,h,d,color,x=0,y=0,z=0,r=.045){const o=new T.Mesh(roundGeo(w,h,d,r),typeof color==='string'||typeof color==='number'?mat(color):color);o.position.set(x,y,z);parent.add(o);return o;}
function cylinder(parent,r1,r2,h,color,x=0,y=0,z=0,n=12){const key=['c',r1,r2,h,n].join();if(!geometries.has(key))geometries.set(key,new T.CylinderGeometry(r1,r2,h,n));const o=new T.Mesh(geometries.get(key),typeof color==='string'?mat(color):color);o.position.set(x,y,z);parent.add(o);return o;}
function sphere(parent,r,color,x,y,z,sx=1,sy=1,sz=1){const k='s'+r;if(!geometries.has(k))geometries.set(k,new T.IcosahedronGeometry(r,2));const o=new T.Mesh(geometries.get(k),mat(color));o.position.set(x,y,z);o.scale.set(sx,sy,sz);parent.add(o);return o;}
export function label(parent,text,w,h,x,y,z,bg='#254d44',fg='#f4e8c5',fontSize=70){const c=document.createElement('canvas');c.width=1024;c.height=Math.round(1024*h/w);const a=c.getContext('2d');a.fillStyle=bg;a.fillRect(0,0,c.width,c.height);a.fillStyle=fg;a.font='800 '+fontSize+'px Arial';a.textAlign='center';a.textBaseline='middle';text.split('\n').forEach((s,i,arr)=>a.fillText(s,512,c.height/2+(i-(arr.length-1)/2)*fontSize*1.35));const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const o=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex,side:T.DoubleSide}));o.position.set(x,y,z);o.rotation.y=Math.PI;parent.add(o);return o;}
export function makePart(key,color='#76aaa1',condition=100){const p=PARTS[key],g=new T.Group(),c=condition<60?'#8a7667':'#768686',dark='#354944',silver='#c3d2df';
 switch(p.shape){
 case 'wheel':{const t=cylinder(g,.49,.49,.27,'#242d30',0,0,0,24);t.rotation.z=Math.PI/2;const rim=cylinder(g,.34,.34,.28,mat('#354047',.35,.6),0,0,0,24);rim.rotation.z=Math.PI/2;const spokes=new T.InstancedMesh(roundGeo(.028,.28,.048,.01),mat('#e6edf0'),10),dummy=new T.Object3D();for(let i=0;i<10;i++){const a=(i%5)*Math.PI*2/5;dummy.position.set(i<5?-.157:.157,Math.cos(a)*.15,Math.sin(a)*.15);dummy.rotation.x=a;dummy.updateMatrix();spokes.setMatrixAt(i,dummy.matrix);}g.add(spokes);const hub=cylinder(g,.09,.09,.31,'#b4c5b9');hub.rotation.z=Math.PI/2;const ring=new T.Mesh(torusGeo(.354,.012,5,24),mat('#7e8585',.3,.8));ring.rotation.y=Math.PI/2;ring.position.x=-.145;g.add(ring);break;}
 case 'battery':box(g,.39,.33,.3,'#263943',0,0,0);box(g,.4,.04,.32,'#c6b55e',0,.17,0,.01);cylinder(g,.025,.025,.05,'#b66852',-.12,.215,0,6);cylinder(g,.025,.025,.05,silver,.12,.215,0,6);break;
 case 'motor':{let m=cylinder(g,.14,.14,.32,silver,0,0,0,10);m.rotation.x=Math.PI/2;box(g,.2,.13,.23,dark,0,.15,0);cylinder(g,.09,.09,.05,dark,0,0,-.19,8).rotation.x=Math.PI/2;break;}
 case 'radiator':box(g,1.14,.42,.1,dark);box(g,1.03,.35,.12,silver);for(let i=0;i<7;i++)box(g,.022,.34,.135,'#7e9995',-.45+i*.15,0,0,.002);break;
 case 'fan':{const m=cylinder(g,.22,.22,.06,dark,0,0,0,12);m.rotation.x=Math.PI/2;for(let i=0;i<4;i++){const b=box(g,.07,.38,.05,silver);b.rotation.z=i*Math.PI/2+.3;}break;}
 case 'pads':box(g,.12,.14,.21,'#b9a28b');box(g,.14,.055,.23,'#384642',0,.07,0);break;
 case 'rotor':{const m=cylinder(g,.23,.23,.09,'#9baaa5',0,0,0,16);m.rotation.z=Math.PI/2;const h=cylinder(g,.085,.085,.12,'#617870');h.rotation.z=Math.PI/2;break;}
 case 'caliper':box(g,.16,.19,.3,'#c08765');box(g,.19,.06,.3,silver,0,.1,0);break;
 case 'light':box(g,.44,.19,.1,'#f4f1c8',0,0,0,.04);box(g,.46,.04,.11,'#cfb381',0,-.10,0,.015);break;
 case 'tail':box(g,.33,.17,.11,'#e3755a');box(g,.13,.16,.12,'#e7bd79',-.08,0,0);break;
 case 'mirror':box(g,.16,.11,.27,color);box(g,.17,.1,.22,'#b6d3d0',-.012,0,-.025);break;
 case 'door':box(g,.115,.605,1.105,color,0,-.057,.005,.05);glassPanel(g,[[-.52,.23],[-.21,.54],[.42,.54],[.46,.23]],'#86b7cf');box(g,.11,.035,.12,silver,-.02,.12,.25,.01);break;
 case 'hood':{const panel=new T.Mesh(sculptedPanelGeo(1.88,1.49),mat(color,.43,.22));g.add(panel);break;}
 case 'fender':{const panel=new T.Mesh(sidePanelGeo(true),mat(color,.43,.22));panel.position.set(-.04,-1.02,1.55);g.add(panel);break;}
 case 'bumper':box(g,2.02,.24,.19,color,0,0,0,.07);box(g,.78,.11,.21,'#415650',0,.02,0,.025);break;
 case 'seat':box(g,.48,.13,.48,'#526c80',0,-.22,0,.06);const b=box(g,.48,.52,.13,'#526c80',0,.04,.21,.06);b.rotation.x=-.1;box(g,.26,.15,.11,'#526c80',0,.38,.24,.04);break;
 case 'steering':{const column=cylinder(g,.035,.045,.34,'#455d69',0,-.18,-.08,10);column.rotation.x=.40;const m=new T.Mesh(torusGeo(.19,.027,5,12),mat(dark));m.rotation.x=-.4;g.add(m);box(g,.06,.34,.06,dark);box(g,.34,.04,.06,dark);break;}
 case 'strut':cylinder(g,.08,.08,.54,silver,0,0,0,8);for(let i=0;i<5;i++){let t=new T.Mesh(torusGeo(.105,.018,4,10),mat(dark));t.rotation.x=Math.PI/2;t.position.y=-.18+i*.085;g.add(t);}break;
 case 'exhaust':box(g,.3,.16,.55,silver);const pipe=cylinder(g,.055,.055,.44,dark,0,0,.35,8);pipe.rotation.x=Math.PI/2;break;
 case 'filter':box(g,.36,.21,.3,'#384a43');box(g,.34,.02,.28,'#b4b9aa',0,.12,0);break;
 }
 if(p.route==='panel'&&g.children[0]?.isMesh)g.children[0].material=mat(color,.43,.22);
 const detail=new T.Group();g.add(detail);g.userData.detailGroup=detail;
 if(p.shape==='battery'){
  box(detail,.18,.025,.04,'#d0dae0',0,.225,0,.012);for(const x of [-.085,.085])box(detail,.025,.06,.04,'#d0dae0',x,.195,0,.008);
  box(detail,.21,.12,.014,'#ece9d9',0,0,-.16,.015);box(detail,.12,.028,.018,'#41a9b8',0,.015,-.17,.004);
  for(const x of [-.14,.14])box(detail,.025,.23,.31,'#3b5362',x,-.01,0,.01);
 }
 if(p.shape==='motor'){
  for(let i=0;i<6;i++){const angle=i*Math.PI/3;box(detail,.025,.055,.23,'#536e7c',Math.sin(angle)*.135,Math.cos(angle)*.135,.025,.006);}
  cylinder(detail,.04,.04,.07,'#c5d8e2',0,0,-.225,8).rotation.x=Math.PI/2;
 }
 if(p.shape==='light'){
  for(let i=0;i<4;i++)box(detail,.015,.15,.008,'#c5dce4',-.155+i*.10,0,-.056,.003);
  box(detail,.37,.012,.01,'#fffef4',0,.052,-.065,.003);
 }
 if(p.shape==='pads'){
  box(detail,.14,.025,.21,'#c2d1d9',0,-.085,0,.009);box(detail,.14,.04,.025,'#7b909b',0,-.04,-.118,.009);
 }
 if(p.shape==='rotor'){
  for(let i=0;i<8;i++){const a=i*Math.PI/4;const hole=cylinder(detail,.013,.013,.094,'#627783',0,Math.cos(a)*.17,Math.sin(a)*.17,6);hole.rotation.z=Math.PI/2;}
 }
 if(p.shape==='seat')for(const x of [-.13,.13]){box(detail,.018,.018,.37,'#9bb3bd',x,-.145,-.015,.003);box(detail,.018,.32,.012,'#9bb3bd',x,.065,.135,.003);}
 if(p.shape==='mirror')box(detail,.17,.016,.13,'#e6eff3',-.018,.035,-.04,.003);
 g.userData.part=key;return g;
}
// Closed shell sections leave real door, wheel and service openings.
// Coordinates are shared by the body, glass and moving door assemblies.
function sidePanelGeo(front=true){
 const cacheKey='coach-quarter-'+front;if(geometries.has(cacheKey))return geometries.get(cacheKey);
 const s=new T.Shape(),center=front?-1.36:1.35;
 if(front){s.moveTo(-2.17,.60);s.lineTo(-2.17,1.16);s.quadraticCurveTo(-2.10,1.33,-1.93,1.36);s.lineTo(-.53,1.40);s.lineTo(-.53,.64);s.lineTo(center+.565,.60);s.absarc(center,.60,.565,0,Math.PI,false);s.lineTo(-2.17,.60);}
 else{s.moveTo(.54,.64);s.lineTo(.54,1.40);s.lineTo(1.63,1.37);s.quadraticCurveTo(2.17,1.35,2.17,1.14);s.lineTo(2.17,.60);s.lineTo(center+.565,.60);s.absarc(center,.60,.565,0,Math.PI,false);s.lineTo(.54,.64);}
 s.closePath();const geo=new T.ExtrudeGeometry(s,{depth:.12,bevelEnabled:true,bevelSize:.025,bevelThickness:.023,bevelSegments:2,curveSegments:8});geo.translate(0,0,-.06);geo.rotateY(-Math.PI/2);geo.computeVertexNormals();geometries.set(cacheKey,geo);return geo;
}
function sculptedPanelGeo(width,length,crown=.035,taper=.06){
 const key=['sculpted-panel',width,length,crown,taper].join();if(geometries.has(key))return geometries.get(key);
 const positions=[],indices=[],nx=6,nz=8,stride=nx+1,count=(nx+1)*(nz+1);
 for(let side=0;side<2;side++)for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
  const u=i/nx*2-1,v=j/nz,half=width/2-taper*(1-v);
  positions.push(u*half,crown*(1-u*u)+Math.sin(v*Math.PI)*.025+(v-.5)*.022-(side?.06:0),(v-.5)*length);
 }
 const quad=(a,b,c,d)=>indices.push(a,b,c,a,c,d);
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*stride+i;quad(a,a+stride,a+stride+1,a+1);quad(a+count,a+1+count,a+stride+1+count,a+stride+count);}
 for(let j=0;j<nz;j++){const a=j*stride,b=a+nx;quad(a,a+count,a+stride+count,a+stride);quad(b,b+stride,b+stride+count,b+count);}
 for(let i=0;i<nx;i++){const b=nz*stride+i;quad(i,i+1,i+1+count,i+count);quad(b,b+count,b+1+count,b+1);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();geometries.set(key,geo);return geo;
}
function beamBetween(parent,a,b,width,depth,color){const av=new T.Vector3(...a),bv=new T.Vector3(...b),direction=bv.clone().sub(av);const beam=box(parent,width,direction.length(),depth,color,0,0,0,.012);beam.position.copy(av.add(bv).multiplyScalar(.5));beam.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),direction.normalize());return beam;}
function cabinSpec(type,design){const sport=['Muscle','Sports'].includes(type);return {h:(['SUV','Pickup'].includes(type)?1.99:sport?1.66:type==='Luxury'?1.82:1.77)+(design.roofOffset||0),back:type==='Pickup'?.95:type==='SUV'?1.59:['Hatchback','Compact'].includes(type)?1.48:.92,front:design.roofFront??-.22};}
function glazing(parent,points){const key='coach-glass'+points.flat().join();let geo=geometries.get(key);if(!geo){geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(points.flat(),3));geo.setIndex([0,1,2,0,2,3]);geo.computeVertexNormals();geometries.set(key,geo);}let material=materials.get('coach-glass');if(!material){material=new T.MeshPhysicalMaterial({color:'#567078',roughness:.16,metalness:.12,transparent:true,opacity:.42,envMapIntensity:.35,side:T.DoubleSide,depthWrite:false,clearcoat:.65});materials.set('coach-glass',material);}const glass=new T.Mesh(geo,material);glass.renderOrder=2;glass.userData.glazing=true;parent.add(glass);return glass;}
function fitDoor(part,key,type,design){
 const {h,front}=cabinSpec(type,design),sign=key==='doorL'?-1:1,glass=part.children[1];
 glass.geometry=new T.BufferGeometry();const bottomY=.235,topY=h-1.17-.035,topX=-sign*.22;
 glass.geometry.setAttribute('position',new T.Float32BufferAttribute([0,bottomY,-.53,topX,topY,front+.045,topX,topY,.49,0,bottomY,.535],3));glass.geometry.setIndex([0,1,2,0,2,3]);glass.geometry.computeVertexNormals();glass.rotation.set(0,0,0);glass.scale.set(1,1,1);glass.position.set(0,0,0);glass.material=glazing(new T.Group(),[[0,0,0],[1,0,0],[1,1,0],[0,1,0]]).material;glass.renderOrder=2;glass.userData.glazing=true;part.children[2].position.x=sign*.083;
 const frame=new T.Group();part.add(frame);part.userData.windowFrame=frame;
 beamBetween(frame,[0,bottomY,-.54],[topX,topY+.015,front+.03],.034,.045,'#293f4a');
 beamBetween(frame,[topX,topY+.015,front+.03],[topX,topY+.015,.53],.034,.045,'#293f4a');
 beamBetween(frame,[topX,topY+.015,.53],[0,bottomY,.55],.038,.045,'#293f4a');
 box(frame,.035,.034,1.07,'#293f4a',-sign*.017,bottomY,.005,.005);
}
function buildCoachwork(parent,m,bodymat,parts,hood,trunk){
 const design=designFor(m),{h,back,front}=cabinSpec(m.type,design),shell=new T.Group();shell.name='Closed coachwork';parent.add(shell);
 for(const sign of [-1,1]){
  const rear=new T.Mesh(sidePanelGeo(false),bodymat);rear.position.x=sign*.99;shell.add(rear);
  if(sign===1){const frontQuarter=new T.Mesh(sidePanelGeo(true),bodymat);frontQuarter.position.x=.99;shell.add(frontQuarter);}
  box(shell,.16,.19,1.15,bodymat,sign*.98,.73,.025,.035);
  box(shell,.12,.56,.05,bodymat,sign*.96,1.075,-.555,.012);
  box(shell,.14,.63,.055,bodymat,sign*.96,1.10,.565,.012);
  box(shell,.12,.08,1.17,bodymat,sign*.935,1.395,1.13,.025);
  // Wheel tubs curve around the tire; no flat wall masks the brake assembly.
  for(const z of [-1.36,1.35]){const tub=new T.Mesh(torusGeo(.575,.055,5,20,Math.PI),mat('#263c46'));tub.rotation.y=Math.PI/2;tub.position.set(sign*.86,.60,z);shell.add(tub);}
  box(shell,.055,.36,1.28,'#344b56',sign*.79,1.05,-1.18,.018);
 }
 box(shell,1.70,.05,1.58,'#344b56',0,.60,-1.33,.02);
 box(shell,1.91,.39,.16,bodymat,0,.885,-2.095,.055);
 box(shell,1.91,.65,.15,bodymat,0,1.02,2.075,.055);const noseLip=new T.Mesh(sculptedPanelGeo(1.93,.21,.035,0),bodymat);noseLip.position.set(0,1.351,-2.055);shell.add(noseLip);
 box(shell,1.71,.47,.10,'#384d58',0,1.10,back+.04,.015);
 if(m.type!=='Pickup'&&back<1.35)box(shell,1.82,.08,1.38-back,bodymat,0,1.335,(back+1.38)/2,.025);
 if(m.type==='Pickup'){box(shell,1.73,.08,1.04,'#3d5661',0,1.24,1.53,.025);for(const sign of [-1,1])box(shell,.12,.22,1.22,bodymat,sign*.91,1.37,1.53,.035);}
 // A finished nose and tail surround the service parts instead of leaving gaps.
 for(const x of [-.67,.67]){box(shell,.52,.25,.085,'#2c4351',x,1.03,-2.13,.045);box(shell,.38,.23,.06,'#344b56',x,1.05,2.185,.035);}
 for(const x of [-.98,.98])box(shell,.095,.036,1.10,design.accent,x,1.395,1.07,.012);
 hood.children[0].geometry=sculptedPanelGeo(1.88,1.49,.035,.055);
 const deck=trunk.children.find(o=>o.isMesh);if(deck&&m.type!=='Pickup'){deck.geometry=sculptedPanelGeo(1.87,.79,.025,.025);deck.position.set(0,.015,.38);}
 for(const sign of [-1,1]){
  beamBetween(shell,[sign*.975,1.405,.585],[sign*.80,h+.02,.535],.09,.10,bodymat);
  // Shoulder line and a small fuel flap provide scale without extra seams.
  box(shell,.018,.021,.62,design.accent,sign*1.068,1.185,1.93,.006);
 }
 box(shell,.026,.16,.18,bodymat,1.09,1.21,1.84,.025);box(shell,.22,.035,.018,design.accent,0,1.10,2.165,.012);box(shell,1.45,.010,.012,'#617e8c',0,1.287,2.165,.003);label(shell,'SC '+String(design.seed*37%9999).padStart(4,'0'),.59,.135,0,.70,2.282,'#ebe8cf','#3b5464',98).rotation.y=0;
 return shell;
}

function cabin(parent,color,type,design={}){
 const {h,back,front}=cabinSpec(type,design),roofColor=mat(color,.43,.22);
 glazing(parent,[[-.935,1.39,-.73],[.935,1.39,-.73],[.775,h-.015,front],[ -.775,h-.015,front]]);
 glazing(parent,[[-.96,1.37,back],[ -.775,h-.015,back-.32],[.775,h-.015,back-.32],[.96,1.37,back]]);
 box(parent,1.68,.10,back-.32-front+.09,roofColor,0,h+.027,(front+back-.32)/2,.035);
 for(const sign of [-1,1]){
  beamBetween(parent,[sign*.985,1.36,-.735],[sign*.803,h+.016,front-.015],.09,.10,roofColor);
  glazing(parent,[[sign*.985,1.405,-.71],[sign*1.015,1.405,-.535],[sign*.80,h-.035,front+.045],[sign*.80,h-.035,front+.045]]);
  beamBetween(parent,[sign*.985,1.355,back+.015],[sign*.803,h+.016,back-.31],.12,.11,roofColor);
  beamBetween(parent,[sign*.803,h+.026,front],[sign*.803,h+.026,back-.31],.065,.075,roofColor);
  if(back>.68)glazing(parent,[[sign*1.015,1.405,.61],[sign*.80,h-.035,.59],[sign*.80,h-.035,back-.355],[sign*.985,1.38,back-.025]]);
  box(parent,.055,.085,back-.56,roofColor,sign*.976,1.355,(back+.56)/2,.013);
 }
 beamBetween(parent,[-.94,1.385,-.74],[.94,1.385,-.74],.065,.07,roofColor);
 for(const sign of [-1,1]){const wiper=box(parent,.47,.012,.018,'#293c42',sign*.45,1.432,-.725,.004);wiper.rotation.y=sign*.16;}
 beamBetween(parent,[-.96,1.36,back],[.96,1.36,back],.065,.07,roofColor);
 return h;
}
function dressInterior(parent,type,parts,design){
 const interior=new T.Group();parent.add(interior);parent=interior;
 const lower=['Muscle','Sports'].includes(type)?.15:0,upholstery=design.seat,trim=design.trim;
 // The cabin is hollow: floor, dashboard, and trim do not cover the seat cushions.
 box(parent,1.68,.045,1.86,trim,0,.775,.42,.02);
 for(const x of [-.46,.46]){
  box(parent,.48,.015,.45,'#20333e',x,.807,-.13,.04);
  box(parent,.32,.025,.18,'#344e60',x,.824,.02,.025);
 }
 box(parent,1.65,.17,.22,trim,0,1.22-lower,-.46,.04);
 box(parent,1.48,.045,.25,'#6c8393',0,1.325-lower,-.46,.015);
 box(parent,.37,.14,.055,'#1b303e',-.46,1.33-lower,-.315,.025);
 for(const x of [-.55,-.38])box(parent,.085,.032,.015,'#abd9db',x,1.345-lower,-.277,.008);
 box(parent,.25,.13,.05,'#233e4e',0,1.235-lower,-.321,.02);
 box(parent,design.dash==='wide'?.51:design.dash==='minimal'?.31:.17,design.dash==='wide'?.13:.07,.012,'#91cbd1',design.dash==='wide'?.08:0,1.26-lower,-.290,.01);if(design.dash==='sport'||design.dash==='analog'){for(const x of [-.56,-.39]){const dial=cylinder(parent,.055,.055,.012,'#d1e7e4',x,1.32-lower,-.275,12);dial.rotation.x=Math.PI/2;box(parent,.008,.038,.016,design.accent,x,1.33-lower,-.263,.002);}}
 for(const x of [-.71,.65])for(let i=0;i<3;i++)box(parent,.09,.012,.02,'#172d38',x,1.22-lower+i*.027,-.337,.002);
 box(parent,.20,.23,.69,trim,0,.95-lower,.18,.035);
 cylinder(parent,.025,.025,.15,'#bacbd2',0,1.115-lower,.10,8);
 sphere(parent,.048,'#223946',0,1.205-lower,.10,1,.7,1);
 for(const z of [.34,.46]){const cup=cylinder(parent,.046,.046,.01,'#162b36',0,1.071-lower,z,10);}
 if(type!=='Pickup'){
  const back=type==='SUV'||type==='Hatchback'||type==='Compact'?1.06:.63;
  box(parent,1.39,.14,.42,upholstery,0,.985-lower,back,.065);
  const bench=box(parent,1.39,.42,.13,upholstery,0,1.23-lower,back+.20,.06);bench.rotation.x=-.10;
  for(const x of [-.48,.48]){
   box(parent,.28,.15,.12,upholstery,x,1.53-lower,back+.235,.04);
   box(parent,.018,.30,.014,'#9bb1c0',x,1.245-lower,back+.12,.004);
  }
 }
 for(const [key,sign] of [['doorL',1],['doorR',-1]]){
  const door=parts.get(key),lining=new T.Group();door.add(lining);door.userData.innerTrim=lining;
  box(lining,.023,.39,.90,trim,sign*.064,-.09,0,.025);
  box(lining,.058,.07,.46,upholstery,sign*.09,.015,.08,.02);
  box(lining,.035,.028,.15,'#cfdae0',sign*.098,.13,-.19,.01);
  box(lining,.028,.10,.40,'#1b323f',sign*.08,-.20,.06,.02);
 }
 return interior;
}
function styleVehicle(parent,m,parts,hood,trunk){
 const design=designFor(m),chrome='#aab4b5',dark='#283b40';
 for(const x of [-1.01,1.01])for(const z of [-1.36,1.35]){
  const arch=new T.Mesh(torusGeo(.535,.037,4,18,Math.PI),mat(m.type==='SUV'||m.type==='Pickup'?dark:chrome,.35,.25));
  arch.rotation.y=Math.PI/2;arch.position.set(x,.59,z);parent.add(arch);
 }
 for(const x of [-.99,.99])box(parent,.035,.10,2.5,dark,x,.52,.04,.015);
 
 const grille=new T.Group();parent.add(grille);box(grille,design.grilleWidth+.18,.23,.035,dark,0,.99,-2.17,.03);
 if(design.grille==='split'){for(const x of [-.23,.23]){box(grille,.42,.19,.045,chrome,x,.99,-2.20,.025);box(grille,.38,.15,.05,dark,x,.99,-2.23,.02);}for(const x of [-.33,-.23,-.13,.13,.23,.33])box(grille,.009,.13,.02,chrome,x,.99,-2.26,.004);}
 else if(design.grille==='vertical'){for(let i=0;i<9;i++)box(grille,.018,.24,.02,chrome,(i-4)*design.grilleWidth/10,.99,-2.20,.005);}
 else if(design.grille==='mesh'){for(let i=0;i<7;i++)for(let j=0;j<3;j++)box(grille,.04,.024,.014,chrome,(i-3)*.095,.91+j*.065,-2.20,.003);}
 else if(design.grille==='smile'){const smile=box(grille,design.grilleWidth*.8,.04,.025,chrome,0,.89,-2.20,.018);for(const x of [-1,1]){const corner=box(grille,.04,.09,.025,chrome,x*design.grilleWidth*.38,.915,-2.20,.015);corner.rotation.z=x*.4;}}
 else {for(let i=0;i<(design.grille==='bars'?2:3);i++)box(grille,design.grilleWidth-.08,.027,.025,chrome,0,.92+i*.07,-2.20,.009);}
 for(const k of ['headlightL','headlightR']){const lamp=parts.get(k),lens=lamp.children[0];lamp.userData.lampStyle=design.lamps;lens.scale.y=design.lampHeight/.19;
  if(['round','quad','jewel'].includes(design.lamps)){lens.scale.set(.93,.93,1);lens.material=mat(dark);const count=design.lamps==='quad'?2:1;for(let j=0;j<count;j++){const lensMesh=cylinder(lamp,design.lamps==='jewel'?.095:.075,design.lamps==='jewel'?.095:.075,.025,'#fff3ce',(j-(count-1)/2)*.19,0,-.067,design.lamps==='jewel'?4:12);lensMesh.rotation.x=Math.PI/2;lensMesh.userData.designedLens=true;}}
  else {lens.scale.y=design.lamps==='blade'?.48:.65;const strip=box(lamp,.41,.022,.02,'#f7ffff',0,.064,-.065,.008);strip.rotation.z=design.lamps==='sweep'?(k==='headlightL'?-.12:.12):0;strip.userData.designedLens=true;}
 }
 for(const k of ['wheelFL','wheelFR','wheelRL','wheelRR']){const wheel=parts.get(k);wheel.children[2].visible=false;wheel.children[1].material=mat('#29353b',.36,.6);const spokes=new T.InstancedMesh(roundGeo(.024,.32,design.spokes>8?.024:.047,.006),mat(design.rimDark?'#56616a':'#929b9f',.26,.8),design.spokes*2),dummy=new T.Object3D();for(let i=0;i<design.spokes*2;i++){const a=(i%design.spokes)*Math.PI*2/design.spokes;dummy.position.set(i<design.spokes?-.157:.157,Math.cos(a)*.16,Math.sin(a)*.16);dummy.rotation.x=a;dummy.updateMatrix();spokes.setMatrixAt(i,dummy.matrix);}wheel.add(spokes);}
 const seat=parts.get('seat');seat.children.slice(0,3).forEach(o=>o.material=mat(design.seat));for(const x of [-.17,.17])box(seat,.013,.40,.015,chrome,x,.03,.132,.003);
 if(['Sports','Muscle'].includes(m.type))for(const x of [-.24,.24])box(seat,.08,.40,.18,design.trim,x,-.015,.16,.035);
 
 for(const key of ['doorL','doorR']){
  const door=parts.get(key);box(door,.014,.023,.93,chrome,key==='doorL'?-.066:.066,.185,.01,.006);
 }
 if(m.type==='Muscle'||m.type==='Sports'){
  for(const x of [-.25,.25])box(hood,.14,.012,1.35,'#f9ebd7',x,.055,0,.008);
  box(parent,1.82,.065,.22,dark,0,.58,-2.22,.02);
 }
 if(m.type==='SUV'){
  for(const z of [.1,.8])box(parent,1.53,.08,.10,chrome,0,2.10,z,.02);
  const spare=makePart('wheelRR');spare.rotation.y=Math.PI/2;spare.scale.setScalar(.78);spare.position.set(0,.06,.71);trunk.add(spare);
 }
 if(m.type==='Pickup'){
  box(parent,1.74,.055,.11,chrome,0,2.09,.32,.02);
  for(const x of [-.94,.94])box(parent,.07,.06,1.1,chrome,x,1.55,1.5,.02);
 }
 if(m.type==='Compact')box(parent,.58,.06,.03,'#ffa264',0,.91,-2.19,.015);
 if(m.type==='Hatchback')box(trunk,1.57,.065,.18,dark,0,.42,.67,.025);
 if(m.type==='Luxury'){
  for(const x of [-.45,.45])box(parent,.3,.04,.028,'#f4d48b',x,1.16,-2.18,.015);
  box(parent,.09,.18,.03,chrome,0,1.10,-2.18,.01);
 }
}
export const BAY_POS=[{x:0,z:1},{x:7,z:1},{x:-7,z:1}];
function supportRig(scene){const root=new T.Group(),legs=[];scene.add(root);root.visible=false;for(const x of [-.72,.72])for(const z of [-1.1,1.1]){cylinder(root,.11,.19,.12,'#405c6d',x,.06,z,8);const pole=cylinder(root,.055,.065,1,'#dab666',x,.5,z,8),cap=box(root,.27,.065,.28,'#9db2be',x,1,z,.025);legs.push({pole,cap});}return {root,legs};}
export class World{
 constructor(canvas,state){this.state=state;this.scene=new T.Scene();this.scene.background=new T.Color('#a8dffd');this.scene.fog=new T.Fog('#cbe7f4',75,170);this.camera=new T.PerspectiveCamera(67,innerWidth/innerHeight,.08,230);this.camera.rotation.order='YXZ';this.scene.add(this.camera);this.renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});this.renderer.setSize(innerWidth,innerHeight);this.renderer.setPixelRatio(Math.min(devicePixelRatio,state.settings.quality==='low'?1:1.65));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.shadowMap.autoUpdate=false;this.shadowClock=1;this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.18;this.scene.add(new T.HemisphereLight('#ffffff','#a6bad0',2.1));const sun=new T.DirectionalLight('#fff2db',2.8);sun.position.set(-18,30,-14);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-28;sun.shadow.camera.right=28;sun.shadow.camera.top=28;sun.shadow.camera.bottom=-28;sun.shadow.camera.far=90;sun.shadow.normalBias=.05;sun.shadow.bias=-.0003;this.scene.add(sun);this.sun=sun;const shadowCanvas=document.createElement('canvas');shadowCanvas.width=64;shadowCanvas.height=64;const shadowCtx=shadowCanvas.getContext('2d'),gradient=shadowCtx.createRadialGradient(32,32,5,32,32,31);gradient.addColorStop(0,'rgba(24,32,32,.48)');gradient.addColorStop(1,'rgba(22,48,27,0)');shadowCtx.fillStyle=gradient;shadowCtx.fillRect(0,0,64,64);this.contactMaterial=new T.MeshBasicMaterial({map:new T.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false});this.contactGeometry=new T.PlaneGeometry(3.1,5.6);this.targets=[];this.colliders=[];this.cars=new Map();this.departures=[];this.donors=new Map();this.dynamic=new T.Group();this.scene.add(this.dynamic);this.upgradeGroup=new T.Group();this.scene.add(this.upgradeGroup);this.toolGroup=new T.Group();this.camera.add(this.toolGroup);this.carryGroup=new T.Group();this.camera.add(this.carryGroup);this.mark=new T.Group();this.scene.add(this.mark);this.buildEnvironment();this.buildShop();this.dressShop();this.buildYard();applyArtDirection(this,{box,cylinder,sphere,label,mat,makePart});this.scene.traverse(o=>{if(o.isMesh&&o.position.y>.1&&!(o.material instanceof T.MeshBasicMaterial)){o.castShadow=true;o.receiveShadow=true;}});batchStaticMeshes(this.scene);state.donors.forEach(d=>this.addCar(d,true));this.sync();this.buildTool('hands');this.resize=()=>{this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();this.renderer.setSize(innerWidth,innerHeight);};window.addEventListener('resize',this.resize);this.makeParticles();this.buildServiceDesk();this.syncServicePeople();}
 target(mesh,data){mesh.traverse(o=>{if(o.isMesh)o.userData.target=data;});this.targets.push(mesh);return mesh;}
 collider(x,z,w,d,vehicle=null){this.colliders.push({x,z,w:w/2,d:d/2,vehicle});}
 buildEnvironment(){const s=this.scene;box(s,230,.2,230,'#88c96d',0,-.18,30,.02).receiveShadow=true;box(s,60,.05,102,'#e8d0a0',0,-.052,29,.02).receiveShadow=true;box(s,120,.04,14,'#85908a',0,-.018,-21,.005).receiveShadow=true;for(let x=-55;x<55;x+=12)box(s,5,.015,.16,'#d7d5bd',x,.013,-21,.002);box(s,30,.05,22,'#e6d6a5',0,-.023,-3,.005).receiveShadow=true;for(const x of [-10,10])box(s,10,.15,.25,'#d7dfe0',x,.077,-13.82,.02);
 const grass=new T.InstancedMesh(new T.ConeGeometry(.14,.37,4),mat('#8ebf6f'),360),dummy=new T.Object3D();for(let i=0;i<360;i++){let x=Math.sin(i*756.7)*47,z=10+Math.cos(i*928.8)*65;if(Math.abs(x)<28&&z<78&&z>-28)x+=x<0?-30:30;dummy.position.set(x,.12,z);dummy.rotation.y=i;dummy.scale.setScalar(.6+((i*37)%100)/100);dummy.updateMatrix();grass.setMatrixAt(i,dummy.matrix);}s.add(grass);
 const trunks=new T.InstancedMesh(new T.CylinderGeometry(.18,.28,2.6,7),mat('#887c59'),48),leaves=new T.InstancedMesh(new T.IcosahedronGeometry(1.6,1),mat('#69ae73'),144);for(let i=0;i<48;i++){const x=(i%2?-1:1)*(32+Math.abs(Math.sin(i*13))*26),z=-26+(i/48)*120;dummy.position.set(x,1.3,z);dummy.scale.set(1,1,1);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);for(let j=0;j<3;j++){dummy.position.set(x+(j-1)*.75,3.2+j*.4,z+.3*Math.sin(j+i));dummy.scale.set(1.1,1.12,1);dummy.rotation.y=i;dummy.updateMatrix();leaves.setMatrixAt(i*3+j,dummy.matrix);}}trunks.castShadow=true;leaves.castShadow=true;s.add(trunks,leaves);
 for(let i=0;i<9;i++){const g=new T.Group();g.position.set(-65+i*18,26+(i%3)*5,20+Math.sin(i*13)*65);for(let j=0;j<4;j++)sphere(g,3,'#eee0d0',(j-1.5)*3.3,j%2*.7,0,1.5,.68,1);s.add(g);}for(const x of [-10,10]){box(s,1.4,.28,1.4,'#bcb8a0',x,.14,-13);sphere(s,.65,'#6e9564',x,.8,-13,1,1.2,1);}
 // Roadside sign and mailbox.
 cylinder(s,.09,.09,4.9,'#5f776b',20,2.45,-12);label(s,'SECOND CHANCE\nMOTOR CO.',5.4,1.75,20,4.3,-12,'#214e45','#f5d48e',100);label(s,'BUY · REBUILD · SELL',4.3,.5,20,3.1,-12,'#e5c98c','#284e42',52);box(s,.6,.45,.55,'#cf9470',14,.98,-13);cylinder(s,.06,.06,1,'#63756a',14,.5,-13);}
 buildShop(){const s=this.scene;box(s,28,.14,18,'#d9e2e8',0,.05,1,.02).receiveShadow=true;box(s,.3,5.2,18,'#f5f1e8',-14,2.6,1);box(s,.3,5.2,18,'#f5f1e8',14,2.6,1);this.collider(-14,1,.4,18);this.collider(14,1,.4,18);
 for(const x of [-9,9]){box(s,9.8,5.2,.3,'#fbf7ed',x,2.6,10);this.collider(x,10,9.8,.4);}for(const x of [-14,-9,-4,4,9,14]){box(s,.32,4.7,.32,'#729a70',x,2.35,-8);this.collider(x,-8,.35,.45);}box(s,28.5,.32,18.8,'#267987',0,5.4,1,.08);box(s,27.6,.06,17.8,'#faf9f1',0,5.19,1,.02);for(const z of [-6,0,6])box(s,27.7,.14,.12,'#79929d',0,5.08,z,.015);box(s,28.6,.13,.3,'#b5c9ac',0,5.15,-8.2);box(s,28,1.15,.23,'#2f7f8b',0,4.65,-8);label(s,'SECOND CHANCE MOTOR CO.',14,.78,0,4.67,-8.14,'#235d62','#fff4d9',54);label(s,'THE WORKSHOP',4,.52,-8,3.5,9.78,'#d1d9c8','#446b56',56);
 for(let i=0;i<3;i++){const p=BAY_POS[i];box(s,4.5,.01,7.4,'#eff2f4',p.x,.125,1,.01);for(const x of [-2.13,2.13])box(s,.055,.015,7.15,'#e8d49c',p.x+x,.14,1,.002);label(s,'0'+(i+1)+'  /  REPAIR BAY',3,.4,p.x,3.25,9.77,'#cdd7c3','#60816b',55);const control=new T.Group();box(control,.3,.8,.34,'#46676a',0,.45,0);box(control,.32,.17,.37,'#304c50',0,.9,0);cylinder(control,.07,.07,.03,'#da9c70',0,1.02,0);box(control,.21,.26,.012,'#203d43',0,.68,-.179,.012);box(control,.15,.075,.014,'#9cd0c9',0,.74,-.19,.005);for(const x of [-.065,.065])cylinder(control,.022,.022,.013,x<0?'#d59e5c':'#93bd89',x,.62,-.194,8).rotation.x=Math.PI/2;control.position.set(p.x-2.2,0,-2.15);s.add(control);this.target(control,{kind:'lift',bay:i});if(i===0){box(s,.47,.22,1.15,'#a98d4e',p.x,.23,.75);box(s,1.8,.08,.22,'#a8ab90',p.x,.29,.75);}}
 // Office nook, real monitor, desktop, drawers.
 box(s,3.8,.13,1.15,'#b58b60',-10,1.1,-4.6);for(const x of [-11.5,-8.5])box(s,.12,1,.12,'#627a6c',x,.5,-4.3);box(s,1.1,.89,1,'#5f8070',-11.3,.5,-4.6);box(s,.83,.47,.73,'#7b9380',-11.3,.48,-4.45);const computer=new T.Group();box(computer,1.13,.78,.11,'#2c4e45',0,1.6,0,.055);box(computer,.14,.31,.13,'#476d5c',0,1.11,0);box(computer,.56,.055,.3,'#3b5c51',0,.94,.04);label(computer,'RECLAIM\nYour next flip starts here',1.02,.64,0,1.61,-.064,'#d7e6d0','#376152',51);box(computer,.73,.045,.27,'#dadcc8',0,.93,-.5);computer.position.set(-10,0,-4.8);computer.rotation.y=Math.PI;s.add(computer);this.target(computer,{kind:'computer'});this.collider(-10,-4.6,3.8,1.15);label(s,'RECLAIM / MARKETPLACE',3,.32,-10,2.75,-7.86,'#cdd6c0','#51785e',42);
 // Workbench & pegboard with tools.
 box(s,4,.15,1.1,'#c29869',11.1,1.02,6);box(s,3.8,.84,.9,'#628675',11.1,.48,6);this.collider(11.1,6,4,1.1);box(s,4,1.3,.08,'#c8cbaa',11.1,2.08,6.5);for(let i=0;i<9;i++){box(s,.05,.34,.06,'#788b7c',9.45+i*.41,2.1,6.4);cylinder(s,.07,.07,.028,'#788b7c',9.45+i*.41,2.31,6.36,6).rotation.x=Math.PI/2;}label(s,'A GOOD DAY TO FIX SOMETHING.',3.8,.35,11.1,3.18,9.8,'#ccd6c0','#557562',42);box(s,.7,.12,.42,'#597366',12.2,1.18,5.95);box(s,.9,.17,.57,'#d6b36c',10.2,1.18,5.95);
 // Parts shelving on the west rear wall, kept physically inspectable.
 const rack=new T.Group();for(const x of [-1.8,1.8])box(rack,.09,2.6,.1,'#536f60',x,1.3,0);for(const y of [.3,1.05,1.8,2.55])box(rack,3.8,.08,.83,'#9fb499',0,y,0);rack.position.set(-11.6,0,5.6);s.add(rack);this.target(rack,{kind:'storage'});this.collider(-11.6,5.6,3.8,.9);label(s,'SALVAGED & SAVED',3.8,.42,-11.6,3,5.65,'#d1d9c2','#57735e',55);
 const dock=new T.Group();box(dock,2.3,.12,1.2,'#b38b60',0,.3,0);for(let i=0;i<4;i++)box(dock,.15,.3,1.15,'#b49d78',-.9+i*.6,.15,0);dock.position.set(11.3,0,-4.7);s.add(dock);this.target(dock,{kind:'delivery'});label(s,'PARTS DELIVERY',3,.34,11.3,1.6,-6.1,'#cfdbbf','#55795d',54);
 label(s,'SALVAGE YARD  ↑',5,.55,0,3.5,9.75,'#325d4d','#f0d49b',73);const body=new T.Group();box(body,.8,.9,.75,'#cd9870',0,.45,0);cylinder(body,.16,.16,.48,'#d4d7c2',-.2,1.2,0);cylinder(body,.13,.13,.45,'#98b197',.2,1.2,0);body.position.set(12,0,1);s.add(body);this.collider(12,1,.8,.75);label(s,'BODY / WASH',2,.3,12,2,1.02,'#d5d8c3','#517761',64);
 const wash=new T.Group();box(wash,.55,.78,.5,'#578775',0,.49,0);box(wash,.25,.16,.3,'#b6baa0',0,.96,0);for(const x of [-.27,.27])cylinder(wash,.12,.12,.08,'#394a40',x,.19,0).rotation.z=Math.PI/2;wash.position.set(-12,0,-1.6);s.add(wash);this.collider(-12,-1.6,.6,.5);
 // Bollards, parked cart, bins, ladder, hose, ventilation.
 for(const x of [-5,5])cylinder(s,.09,.11,.65,'#c9b17a',x,.35,10.8);this.target(box(s,.6,1,.6,'#80927a',13,.5,8.6),{kind:'trash'});box(s,.65,.1,.65,'#405f4a',13,1.06,8.6);for(let i=0;i<3;i++)box(s,3,.06,.2,'#b6c5ab',10.5,4.75,7.8+i*.4);
 }
 buildYard(){const s=this.scene;box(s,51,.045,61,'#dbbf90',0,-.03,44,.01).receiveShadow=true;box(s,6,.05,64,'#c9bb97',0,.004,44,.01);for(const x of [-27,27]){for(let z=13;z<79;z+=3){cylinder(s,.065,.065,1.8,'#83947b',x,.9,z,7);}box(s,.06,.08,66,'#8d9c85',x,.65,45);box(s,.06,.08,66,'#8d9c85',x,1.45,45);this.collider(x,45,.2,66);}for(const z of [14,77]){for(let x=-27;x<=27;x+=3){if(z===14&&Math.abs(x)<4)continue;cylinder(s,.065,.065,1.8,'#7f9277',x,.9,z,7);}for(const x of [-15,15]){box(s,23,.09,.07,'#8c9b82',x,1.45,z);box(s,23,.09,.07,'#8c9b82',x,.65,z);this.collider(x,z,23,.2);}}
 for(const x of [-3.8,3.8]){box(s,.17,3.3,.17,'#687f68',x,1.65,15);this.collider(x,15,.25,.3);}label(s,'THE BACK LOT',7.8,.9,0,3,14.95,'#355c49','#f0d594',104);label(s,'GOOD PARTS. SECOND LIVES.',6,.38,0,2.25,14.92,'#d3cbab','#4c7057',50);
 for(let row=0;row<10;row++){for(const x of [-24.5,24.5]){label(s,(row>=8?'BACK LOT':String.fromCharCode(65+row))+' / SALVAGE',2,.5,x,1.05,20+row*5.8,'#62775b','#ece7ce',100);cylinder(s,.045,.045,1.1,'#6c7e63',x,.55,20+row*5.8);}}
 for(let i=0;i<6;i++){const x=[-19,-11,11,19,-25,25][i];label(s,['MEADOW LINE','VISTA LINE','RANGE LINE','SOLSTICE LINE','MERIDIAN LINE','GARDEN LINE'][i],i<4?5:3.9,.65,x,2.4,i<4?17.7:16.4,'#ecd496','#4b7055',i<4?74:60);for(let j=0;j<3;j++){let w=makePart('wheelFL');w.rotation.z=Math.PI/2;w.position.set(x-3.3,.27+j*.27,18.5);s.add(w);}}
 box(s,3,.6,1.6,'#8f9c83',-24,.35,39);for(let i=0;i<10;i++){let w=makePart('wheelFL');w.rotation.z=Math.PI/2;w.position.set(24,.35+(i%4)*.27,41+Math.floor(i/4)*1.3);s.add(w);}box(s,1.7,.3,1.2,'#937b5d',24,.23,53);box(s,1.9,.6,1.2,'#758b74',24,.65,54.5);
 }
 addCar(data,donor=false){const m=model(data.model),g=new T.Group(),color=data.color||m.color;const w=(['SUV','Pickup'].includes(m.type)?1.12:m.type==='Compact'?.94:m.type==='Sports'?1.04:1)*(m.bodyWidth||1);const long=(m.type==='Compact'?.87:m.type==='Hatchback'?.94:m.type==='Luxury'?1.11:m.type==='Muscle'?1.08:1)*(m.bodyLength||1);const shadow=!donor;const inner=new T.Group();g.add(inner);const contact=new T.Mesh(this.contactGeometry,this.contactMaterial);contact.rotation.x=-Math.PI/2;contact.position.y=donor?.02:.153;g.add(contact);const bodymat=mat(color,.43,.22).clone();const chassis=box(inner,1.94,.20,4.17,bodymat,0,.66,0,.06);box(inner,1.71,.37,.10,'#304858',0,1.04,-.55,.025);box(inner,1.92,.29,.22,bodymat,0,1.18,-2.065,.055);chassis.castShadow=shadow;chassis.receiveShadow=true;box(inner,1.9,.15,3.9,'#415347',0,.51,0,.06);box(inner,2.01,.14,.22,'#93a79b',0,.64,2.13);box(inner,1.76,.08,.65,bodymat,0,1.18,1.77);box(inner,1.7,.18,.11,'#455b50',0,.92,-2.14);box(inner,.64,.2,.02,'#ebe8cf',0,.69,2.26,.02);label(inner,donor?'SALVAGE':({M1:'MEADOW',V4:'VISTA',H2:'RANGE',S8:'SOLSTICE',O3:'MERIDIAN',L3:'GARDEN'}[m.family]), .58,.15,0,.7,-2.315,'#e7e4cc','#597160',80).rotation.y=Math.PI;
 const cab=new T.Group();inner.add(cab);const design=designFor(m);let h=cabin(cab,m.roofColor||(design.twoTone?'#f0eadb':color),m.type,design);if(m.type==='Pickup'){box(inner,1.91,.12,1.07,'#5d756b',0,1.21,1.5);for(const x of [-.91,.91])box(inner,.12,.25,1.10,color,x,1.39,1.5);}if(m.type==='SUV')for(const x of [-.68,.68])box(inner,.07,.09,1.75,'#e2d8bb',x,h+.105,.4,.02);if(m.type==='Sports'){box(inner,1.55,.06,.1,'#e3d2a8',0,1.12,2.23,.025);for(const x of [-.62,.62])box(inner,.07,.35,.08,'#53675a',x,.99,2.17,.02);}if(m.type==='Muscle')box(inner,.52,.12,.7,'#b9bea7',0,1.38,-.95,.06);if(m.type==='Luxury')for(const x of [-.93,.93])box(inner,.035,.045,3.35,'#e4cc82',x,.99,0,.015);
 const hoodPivot=new T.Group();hoodPivot.position.set(0,1.36,-.5);inner.add(hoodPivot);const hood=makePart('hood',color);hood.position.set(0,0,-.72);hoodPivot.add(hood);
 const trunk=new T.Group();trunk.position.set(0,1.32,1.35);inner.add(trunk);if(m.type==='Pickup'){trunk.position.set(0,1.18,2.06);box(trunk,1.83,.36,.08,color,0,.18,0);}else box(trunk,1.83,.08,.76,color,0,0,.38);this.target(trunk,{kind:'access',id:data.id,donor,key:'trunk'});
 const enginebox=box(inner,.76,.35,.62,'#84968b',0,1.02,-1.18,.05);enginebox.userData.engine=true;const parts=new Map(),mounts=new Map();const otherMirror=makePart('mirror',color);otherMirror.position.set(1.16,h-.17,-.4);inner.add(otherMirror);const otherTail=makePart('taillight',color);otherTail.position.set(.73,1.05,2.215);inner.add(otherTail);const passenger=makePart('seat',color);passenger.position.set(.48,h<1.7?1.10:1.25,.32);inner.add(passenger);
 Object.entries(PARTS).forEach(([key,p])=>{if(key==='hood'){parts.set(key,hood);this.target(hood,{kind:'part',id:data.id,donor,key});return;}const part=makePart(key,color,donor?data.parts[key].condition:data.parts[key]);part.position.set(...p.loc);if(p.shape==='tail')part.position.z=2.215;if(p.shape==='mirror')part.position.y=h-.17;if(['seat','steering'].includes(p.shape)&&h<1.7)part.position.y-=.15;if(p.shape==='door')fitDoor(part,key,m.type,design);inner.add(part);parts.set(key,part);this.target(part,{kind:'part',id:data.id,donor,key});});
 const coachwork=buildCoachwork(inner,m,bodymat,parts,hood,trunk);styleVehicle(inner,m,parts,hood,trunk);const interiorDetails=dressInterior(cab,m.type,parts,design);passenger.children.slice(0,3).forEach(o=>o.material=mat(design.seat));
 if(!donor){for(const [key,p] of Object.entries(PARTS)){const ghost=makePart(key,color);ghost.position.set(...p.loc);if(p.shape==='tail')ghost.position.z=2.215;if(p.shape==='mirror')ghost.position.y=h-.17;if(['seat','steering'].includes(p.shape)&&h<1.7)ghost.position.y-=.15;if(p.shape==='door')fitDoor(ghost,key,m.type,design);ghost.traverse(o=>{if(o.isMesh){o.material=new T.MeshStandardMaterial({color:'#82b494',transparent:true,opacity:.23,depthWrite:false,wireframe:true});}});ghost.visible=false;inner.add(ghost);mounts.set(key,ghost);this.target(ghost,{kind:'part',id:data.id,donor:false,key});}}
 // Pivots allow the complete door assembly to open smoothly.
 const doors=[];for(const [key,x] of [['doorL',-1.02],['doorR',1.02]]){const p=new T.Group();p.position.set(x,1.17,-.53);inner.add(p);const door=parts.get(key);inner.remove(door);door.position.set(0,0,.53);p.add(door);doors.push(p);}
 const dirtmat=new T.MeshStandardMaterial({color:'#806e51',transparent:true,opacity:.25,roughness:1,depthWrite:false});const dirt=new T.Group();inner.add(dirt);for(let i=0;i<7;i++){box(dirt,.045,.16+Math.sin(i)*.05,.55,dirtmat,(i%2?-1:1)*.984,.78,i*.49-1.55,.035);}for(let i=0;i<3;i++)box(dirt,.35,.012,.42,dirtmat,-.5+i*.5,1.411,-1.2,.045);
 const dentColor=new T.Color(color).multiplyScalar(.66);const dent=box(inner,.037,.12,.34,mat(dentColor.getHex()).clone(),-1.09,1.27,-1.60,.025);dent.rotation.z=.13;const supports=supportRig(this.scene);supports.root.scale.set(w,1,long);
 if(donor){g.position.set([-19,-11,11,19,-25,25][data.column],0,21+data.row*5.8);g.rotation.y=data.angle;box(inner,.55,.25,.6,'#948a70',-.7,.13,-1.34);box(inner,.55,.25,.6,'#948a70',.7,.13,1.34);this.collider(g.position.x,g.position.z,2.7,4.8,data.id);const jack=new T.Group();box(jack,.23,.19,.53,'#b8a269',0,.17,0);box(jack,.04,.58,.04,'#74846c',0,.43,.12);box(jack,.20,.26,.16,'#315f69',0,.43,0,.025);for(const y of [.38,.48])cylinder(jack,.027,.027,.035,'#f1d58d',-.12,y,0,8).rotation.z=Math.PI/2;jack.position.set(-1.53,0,-.9);g.add(jack);this.target(jack,{kind:'yardJack',id:data.id,donor:true});this.donors.set(data.id,{g,inner,contact,parts,mounts,loose:new Map(),hoodPivot,doors,trunk,dirt,dirtmat,dent,bodymat,enginebox,data,m,interiorDetails,passenger,supports});this.scene.add(g);}else{const p=BAY_POS[data.bay];g.position.set(p.x,0,p.z);this.cars.set(data.id,{g,inner,contact,parts,mounts,loose:new Map(),hoodPivot,doors,trunk,dirt,dirtmat,dent,bodymat,enginebox,data,m,interiorDetails,passenger,supports});this.dynamic.add(g);}inner.scale.set(w,['SUV','Pickup'].includes(m.type)?1:m.type==='Sports'?.85:['Muscle','Sedan','Luxury'].includes(m.type)?.89:.94,long);
 inner.traverse(o=>{if(o.isMesh&&!o.material?.transparent&&!o.material?.isMeshBasicMaterial){o.castShadow=shadow;o.receiveShadow=true;}});
 this.target(chassis,{kind:'vehicle',id:data.id,donor});this.target(coachwork,{kind:'vehicle',id:data.id,donor});this.target(cab,{kind:'vehicle',id:data.id,donor});this.target(dent,donor?{kind:'part',id:data.id,donor:true,key:'fender'}:{kind:'body',id:data.id,donor:false});this.updateCar(donor?this.donors.get(data.id):this.cars.get(data.id),true);return g;
 }
 updateCar(v,immediate=false){const {data:d,parts,hoodPivot,doors,trunk}=v;let engineVisible=d.hoodOpen;const distance=v.g.position.distanceTo(this.camera.position);if(d.id.startsWith('d')&&distance<23){v.inner.visible=true;if(v.lod)v.lod.visible=false;}for(const [k,p] of parts){const def=PARTS[k],job=d.jobs?.[k];const removed=d.parts[k]?.removed??(job?.removed&&!job.installed);const engine=['battery','alternator','starter','radiator','fan','airFilter'].includes(k);const brake=['brakePads','rotor','caliper','strut','fuelPump','clutch','exhaust'].includes(k);let show=!removed;
 if(engine)show=show&&engineVisible&&distance<25;if(brake){let wi=wheelFor(k);show=show&&(d.raised||d.wheelOff===wi||(d.parts[wi]?.removed===true));}
 if(k.startsWith('wheel')&&d.wheelOff===k)show=false;if(['seat','steering'].includes(k))show=show&&distance<24;
 p.visible=show;if(p.userData.innerTrim)p.userData.innerTrim.visible=distance<24;if(p.userData.detailGroup)p.userData.detailGroup.visible=!d.id.startsWith('d')||distance<24;if(['light','tail'].includes(def.shape)){const n=job?.installed?job.replacement.condition:(d.parts[k]?.condition??d.parts[k]);if(p.userData.lensCondition!==n){p.userData.lensCondition=n;p.traverse(o=>{if(o.userData.designedLens)o.material=mat(n<60?'#66796d':'#e3e3d8',.2,.28);});p.children[0].material=mat(n<60?'#66796d':def.shape==='tail'?'#bd4439':['round','quad','jewel'].includes(p.userData.lampStyle)?'#253c43':'#bacbd2',.24,.25);}}if(v.mounts.has(k))v.mounts.get(k).visible=!!(job?.removed&&!job.installed);if(!d.id.startsWith('d')&&def.route==='panel'){const base=d.panelColors?.[k]||(job?.installed?(job.replacement?.color||'#b9c2c9'):d.color);if(!p.userData.panelMaterial)p.userData.panelMaterial=mat(base,.43,.22).clone();const material=p.userData.panelMaterial;p.children[0].material=material;material.color.set(base);const painting=this.panelPainting;if(painting?.target.id===d.id&&painting.target.key===k)material.color.lerp(v.bodymat.color,Math.min(1,painting.elapsed/painting.duration));}
 }
 v.interiorDetails.visible=distance<24;v.passenger.visible=distance<24;v.enginebox.visible=engineVisible&&distance<25;const hoodAngle=d.hoodOpen?.95:0;hoodPivot.rotation.x=immediate?hoodAngle:T.MathUtils.lerp(hoodPivot.rotation.x,hoodAngle,.14);doors.forEach((door,i)=>door.rotation.y=immediate?(d.doorOpen?(i===0?-.9:.9):0):T.MathUtils.lerp(door.rotation.y,d.doorOpen?(i===0?-.9:.9):0,.13));trunk.rotation.x=T.MathUtils.lerp(trunk.rotation.x,d.trunkOpen?(v.m.type==='Pickup'?1.35:-.85):0,.12);
 for(const k of (d.looseWheels||[])){if(!v.loose.has(k)){const wheel=makePart(k);wheel.position.set(-1.9,.22,0);wheel.rotation.z=Math.PI/2;v.g.add(wheel);v.loose.set(k,wheel);this.target(wheel,{kind:'looseWheel',id:d.id,key:k,donor:true});}}for(const [k,w] of v.loose){w.visible=d.looseWheels?.includes(k);w.position.y=.25-v.g.position.y;}
 v.contact.position.y=(d.id.startsWith('d')?.02:.153)-v.g.position.y;const targetY=vehicleLiftHeight(this.state,d),head=this.camera.position.y;if(v.g.position.y+.10>head+.15&&targetY+.10<head+.15&&Math.abs(this.camera.position.x-v.g.position.x)<1.35&&Math.abs(this.camera.position.z-v.g.position.z)<2.45){const side=v.g.position.x>23?-1:v.g.position.x<-23?1:this.camera.position.x<v.g.position.x?-1:1;this.camera.position.x=v.g.position.x+side*2.25;}v.g.position.y=immediate?targetY:T.MathUtils.lerp(v.g.position.y,targetY,.08);
 v.dirtmat.opacity=d.dirt===undefined?.28:d.dirt/100*.53;if((d.bodyStep||0)>=2){const base=new T.Color('#787865'),finish=new T.Color(d.color);v.dent.material.color.copy(base.lerp(finish,Math.min(1,(d.bodyPass||0)/3)));}v.dent.visible=(d.dent>0||d.parts.fender<60)&&!(d.parts.fender?.removed||d.jobs?.fender?.removed&&!d.jobs?.fender?.installed);v.dent.scale.set(1,Math.max(.1,(d.dent??45)/45),Math.max(.1,(d.dent??45)/45));if(d.deliveryAt){const p=BAY_POS[d.bay];const progress=T.MathUtils.clamp((this.state.clock-(d.deliveryAt-3))/3,0,1),homeZ=p.z+(d.onLift?0:-3.4);v.g.position.x=immediate?p.x:T.MathUtils.lerp(v.g.position.x,p.x,.06);v.g.position.z=progress<1?homeZ-(1-progress)*(1-progress)*19:immediate?homeZ:T.MathUtils.lerp(v.g.position.z,homeZ,.10);v.g.visible=progress>0;}
 v.supports.root.visible=d.raised&&(!d.id.startsWith('d')||distance<35)&&(!this.state.upgrades.includes('lift')||d.id.startsWith('d'));v.supports.root.position.set(v.g.position.x,0,v.g.position.z);for(const {pole,cap} of v.supports.legs){const height=Math.max(.1,v.g.position.y+.37);pole.scale.y=height;pole.position.y=height/2;cap.position.y=v.g.position.y+.40;}if(!d.id.startsWith('d'))this.upgradeGroup.traverse(o=>{if(o.userData.liftBay===d.bay)o.position.y=v.g.position.y+.32;});const roll=(v.g.position.z-(v.lastZ??v.g.position.z))/.49;for(const [k,wheel] of parts)if(k.startsWith('wheel'))wheel.rotation.x+=roll;v.lastZ=v.g.position.z;
 if(!d.deliveryAt)v.g.visible=!d.id.startsWith('d')||d.row<8||this.state.upgrades.includes('yard');if(d.waiting){const arrival=T.MathUtils.clamp((this.state.clock-(d.arrivalAt-3))/3,0,1),z=-11.2-(1-arrival)**2*10;const movement=z-v.g.position.z;v.g.position.set(12,0,z);for(const [k,wheel] of parts)if(k.startsWith('wheel'))wheel.rotation.x+=movement/.49;v.g.rotation.y=0;v.g.visible=true;}
 }
 sync(){for(const [id,v] of this.cars){if(!this.state.cars.find(c=>c.id===id)&&this.state.serviceWaiting?.id!==id){v.data.hoodOpen=false;v.data.doorOpen=false;v.data.trunkOpen=false;v.data.raised=false;v.data.waiting=false;v.data.deliveryAt=0;this.departures.push({v,time:0});this.cars.delete(id);this.targets=this.targets.filter(t=>!this.isChildOf(t,v.g));}}
 [...this.state.cars,...(this.state.serviceWaiting?[this.state.serviceWaiting]:[])].forEach(c=>{if(!this.cars.has(c.id))this.addCar(c);});for(const [id,v] of this.cars)v.data=this.state.cars.find(c=>c.id===id)||this.state.serviceWaiting;this.syncServicePeople();this.syncCarry();this.syncStorage();const key=this.state.upgrades.join(',');if(key!==this.upgradeSignature){this.upgradeSignature=key;this.buildUpgrades();}}
 buildServiceDesk(){const desk=new T.Group();box(desk,1.45,.94,.65,'#287f8b',0,.48,0,.06);box(desk,1.53,.07,.73,'#f2dcc0',0,.98,0,.035);box(desk,.42,.018,.29,'#fff9e5',.3,1.03,-.06,.005);box(desk,.45,.30,.04,'#335161',-.34,1.16,.04,.03);label(desk,'SERVICE DESK',1.28,.24,0,.64,-.34,'#287f8b','#fff7dc',78);desk.position.set(5.2,0,-9.3);this.scene.add(desk);this.target(desk,{kind:'service'});this.collider(5.2,-9.3,1.5,.75);label(this.scene,'CUSTOMER REPAIRS',3.2,.40,6.4,2.8,-8.16,'#f1d294','#214f61',65);this.servicePeople=new T.Group();this.scene.add(this.servicePeople);}
 syncServicePeople(){if(!this.servicePeople)return;const entries=[...(this.state.serviceWaiting?[this.state.serviceWaiting]:[]),...this.state.cars.filter(c=>c.customer)],signature=entries.map(c=>c.id).join();if(signature===this.peopleSignature)return;this.peopleSignature=signature;this.targets=this.targets.filter(o=>!this.isChildOf(o,this.servicePeople));this.servicePeople.clear();entries.forEach((c,i)=>{const person=new T.Group();const personSeed=[...c.customer.name].reduce((a,ch)=>a+ch.charCodeAt(0),0),shirt=['#edb76c','#79b8c0','#cc8c98','#88b184'][personSeed%4],skin=['#dbab85','#b77b5d','#f0c9a8','#94664f'][personSeed%4];box(person,.35,.14,.23,'#52687e',0,.83,0,.04);cylinder(person,.065,.065,.13,skin,0,1.40,0,8);box(person,.42,.53,.26,shirt,0,1.12,0,.07);sphere(person,.18,skin,0,1.62,0,.94,1.08,.89);sphere(person,.18,'#514b40',0,1.74,.025,1,.48,1);for(const x of [-.055,.055])sphere(person,.012,'#304550',x,1.64,-.155);for(const x of [-.105,.105]){box(person,.16,.72,.19,'#52687e',x,.45,0,.045);box(person,.18,.09,.30,'#374c5c',x,.065,-.04,.04);}for(const x of [-.29,.29]){box(person,.13,.44,.17,shirt,x,1.11,0,.04);sphere(person,.07,skin,x,.87,-.015,.8,1.15,.85);}person.position.set(5.1+i*.95,0,-8.35);label(person,c.customer.name,.8,.17,0,2.01,0,'#234b61','#ffffff',100);this.servicePeople.add(person);this.target(person,{kind:'service'});});}
 dressShop(){
 const s=this.scene,glow=new T.MeshBasicMaterial({color:'#fff6dc'});
 for(const x of [-9,0,9])for(const z of [-3,5]){box(s,2.7,.045,.23,glow,x,5.03,z,.014);box(s,2.85,.065,.29,'#758fa0',x,5.10,z,.016);}
 const fill=new T.PointLight('#edf7ff',22,25,2);fill.position.set(0,4.8,1);s.add(fill);
 for(let x=-12;x<=12;x+=4)box(s,.017,.007,17.3,'#becdd5',x,.132,1,.001);
 for(const z of [-5,-1,3,7])box(s,27.2,.007,.017,'#becdd5',0,.132,z,.001);
 for(const x of [-13.25,13.25]){
  cylinder(s,.43,.31,.69,'#e5936f',x,.48,-9.5,12);sphere(s,.5,'#74bb75',x,1.18,-9.5,1.05,1.2,1.05);
  cylinder(s,.32,.26,.08,'#f8d5a5',x,.84,-9.5,12);
 }
 for(let i=0;i<5;i++)box(s,.42,.012,1.18,'#efb951',9.8+i*.56,.027,-6.05,.003);
 for(const z of [5.8,7.5,9.2]){box(s,.07,.008,.66,'#42aab1',3.1,.15,z,.003);const a=box(s,.08,.008,.38,'#42aab1',2.98,.15,z+.15,.003);a.rotation.y=-.75;const b=box(s,.08,.008,.38,'#42aab1',3.22,.15,z+.15,.003);b.rotation.y=.75;}
 const cart=new T.Group();box(cart,.78,.7,.62,'#edab5a',0,.5,0,.05);for(let i=0;i<3;i++){box(cart,.71,.13,.025,'#ffca80',0,.33+i*.2,-.32,.02);box(cart,.19,.02,.035,'#435d70',0,.38+i*.2,-.345,.006);}box(cart,.84,.07,.66,'#435d70',0,.91,0,.035);for(const x of [-.31,.31])for(const z of [-.23,.23]){const wheel=cylinder(cart,.07,.07,.05,'#334f61',x,.13,z,10);wheel.rotation.z=Math.PI/2;}cart.position.set(9.5,0,6.5);s.add(cart);
 for(let i=0;i<5;i++){cylinder(s,.075,.075,.26,['#68bfc4','#ee8a6c','#edc063'][i%3],9.9+i*.26,1.25,6.05,8);box(s,.045,.04,.045,'#fff2df',9.9+i*.26,1.41,6.05,.009);}
 label(s,'01  /  COLLECT YOUR ORDERS',3.6,.36,11.3,2.25,-6.08,'#298c9e','#fff5dc',45);
 label(s,'02  /  REPAIR & RESTORE',4.3,.42,-7,2.55,9.75,'#298c9e','#fff5dc',50);
 }
 isChildOf(o,p){while(o){if(o===p)return true;o=o.parent;}return false;}
 syncCarry(){const signature=this.state.carry?.id||null;if(signature===this.carrySignature)return;this.carrySignature=signature;this.carryGroup.clear();if(!this.state.carry)return;const c=this.state.carry,p=PARTS[c.key];if(p.large){const cart=new T.Group();box(cart,1.2,.05,.8,'#81977e',0,-.75,-1.1);for(const x of [-.5,.5])cylinder(cart,.10,.1,.9,'#627969',x,-.36,-1.2);const part=makePart(c.key,c.color,c.condition);part.scale.setScalar(.5);part.rotation.y=.9;part.position.set(0,-.4,-1.25);cart.add(part);this.carryGroup.add(cart);}else{const part=makePart(c.key,c.color,c.condition);part.scale.setScalar(p.shape==='wheel'?.62:p.shape==='radiator'?.65:.9);part.rotation.set(.1,-.5,.06);part.position.set(.2,-.52,-.86);this.carryGroup.add(part);}
 const handmat=mat('#c49b75');for(const x of [-.24,.47]){const hand=box(this.carryGroup,.12,.1,.21,handmat,x,-.58,-.76,.035);hand.rotation.z=x<0?.3:-.3;box(this.carryGroup,.14,.13,.38,'#50746a',x,-.67,-.5,.04);}}
 syncStorage(){const signature=this.state.inventory.map(p=>p.id).join(',')+'|'+this.state.orders.filter(p=>p.arriveAt<=this.state.clock).map(p=>p.id).join(',');if(signature===this.storageSignature)return;this.storageSignature=signature;if(this.storageVisual){this.targets=this.targets.filter(t=>!this.isChildOf(t,this.storageVisual));this.scene.remove(this.storageVisual);}this.storageVisual=new T.Group();this.scene.add(this.storageVisual);this.state.inventory.slice(0,10).forEach((p,i)=>{const part=makePart(p.key,p.color,p.condition);part.scale.setScalar(.33);part.position.set(-13+i%5*.65,.5+Math.floor(i/5)*.75,5.6);this.storageVisual.add(part);this.target(part,{kind:'storage'});});if(this.ordersVisual){this.targets=this.targets.filter(t=>!this.isChildOf(t,this.ordersVisual));this.scene.remove(this.ordersVisual);}this.ordersVisual=new T.Group();this.scene.add(this.ordersVisual);this.state.orders.forEach((p,i)=>{if(p.arriveAt>this.state.clock)return;const g=new T.Group();box(g,.47,.35,.5,'#c5a779');label(g,({M1:'MEADOW',V4:'VISTA',H2:'RANGE',S8:'SOLSTICE',O3:'MERIDIAN',L3:'GARDEN'}[p.family]),.35,.12,0,.03,-.255,'#d7c095','#5a725a',120).rotation.y=Math.PI;g.position.set(10.4+(i%3)*.6,.55+Math.floor(i/3)*.37,-4.7);this.ordersVisual.add(g);this.target(g,{kind:'order',id:p.id});});}
 buildUpgrades(){this.upgradeGroup.clear();const s=this.upgradeGroup,up=this.state.upgrades;if(up.includes('lift'))for(const p of BAY_POS.slice(0,1+Number(up.includes('bay2'))+Number(up.includes('bay3')))){for(const x of [-1.9,1.9]){box(s,.32,3.15,.4,'#547e74',p.x+x,1.58,p.z+.5);box(s,.36,.12,.42,'#e0b86b',p.x+x,3.2,p.z+.5);const arm=box(s,1.8,.1,.35,'#a8b9a3',p.x+x/2,.32,p.z+.5);arm.userData.liftBay=BAY_POS.indexOf(p);}}
 if(up.includes('lighting'))for(let i=0;i<4;i++){box(s,2,.08,.25,'#f8e9b4',-10+i*6.5,5.15,0);const l=new T.PointLight('#ffe9b4',4,10,2);l.position.set(-10+i*6.5,4,0);s.add(l);}
 if(up.includes('bodyStation')){box(s,3,.14,5,'#d5e0cd',11,.16,1);for(let z=-1;z<=3;z+=4)box(s,2.9,3.7,.08,'#b5cab7',11,1.9,z);label(s,'COLOR LAB',2,.3,11,3.1,-1.05,'#b5cab7','#527663',76).rotation.y=Math.PI;}
 if(up.includes('proTools')){box(s,2,.9,.7,'#749482',11,.45,8.3);box(s,2,.12,.75,'#c9b67c',11,.98,8.3);}
 if(up.some(x=>x.startsWith('storage')))for(let i=0;i<3;i++)box(s,3.8,.08,.83,'#7e9a7a',-11.6,2.9+i*.45,5.6);
 if(up.includes('office')){box(s,7,.17,4,'#9cb09b',-9,3.4,-10.5);for(const x of [-12,-6])cylinder(s,.075,.075,3.3,'#64806c',x,1.65,-12.3);box(s,1.4,.92,.03,'#476958',-10,1.7,-4.84);for(let i=0;i<3;i++){box(s,1.2,.3,1.2,'#c2b089',-5+i*5,.2,-12);sphere(s,.6,'#709b68',-5+i*5,.85,-12,1,.9,1);}}
 if(up.includes('hoist')){box(s,1.3,.1,1.8,'#b7895b',5,.2,7);box(s,.14,2,.16,'#cd9f67',5,1.2,7.5);const arm=box(s,.14,.14,1.6,'#cd9f67',5,2.1,6.8);arm.rotation.x=-.2;cylinder(s,.025,.025,.6,'#879783',5,1.8,6.1,6);}
 if(!up.includes('bay2'))label(s,'BAY 02\nEXPANSION AVAILABLE',3,.7,7,1.65,2,'#c7cbb4','#758c72',92);if(!up.includes('bay3'))label(s,'BAY 03\nEXPANSION AVAILABLE',3,.7,-7,1.65,2,'#c7cbb4','#758c72',92);
 if(!up.includes('yard')){box(s,52,.06,.11,'#c1a164',0,.95,66);label(s,'BACK LOT · UNLOCK AT THE SHOP',6,.55,0,1.4,65.9,'#c8b07e','#536b50',58);}}
 buildTool(id){this.toolGroup.clear();this.toolId=id;if(id==='hands')return;const g=new T.Group();g.position.set(.48,-.38,-.62);g.rotation.set(.5,-.6,.2);const silver='#b8c6ba',dark='#547767';if(['wrench','torque','socket'].includes(id)){box(g,.045,.42,.045,silver,0,.06,0,.012);let ring=new T.Mesh(torusGeo(.065,.025,5,8),mat(silver));ring.position.y=.31;g.add(ring);box(g,.07,.16,.06,dark,0,-.16,0,.02);}if(id==='screwdriver'){cylinder(g,.02,.02,.33,silver,0,.12,0,7);cylinder(g,.048,.048,.2,'#d8b367',0,-.11,0,7);}if(id==='body'){box(g,.22,.1,.1,silver,0,.26,0);cylinder(g,.03,.03,.4,'#b68e58',0,0,0,8);}if(id==='paint'){box(g,.16,.13,.14,dark);cylinder(g,.09,.09,.2,'#d6d6ba',0,.22,0,10);cylinder(g,.03,.03,.17,silver,0,0,-.1,8).rotation.x=Math.PI/2;}if(id==='wash'){box(g,.09,.2,.15,dark,0,-.07,0);cylinder(g,.03,.03,.44,silver,0,.04,-.2,7).rotation.x=Math.PI/2;box(g,.15,.06,.09,'#d3b568',0,.08,.1);}if(id==='impact'){box(g,.2,.16,.25,dark);box(g,.1,.2,.1,dark,0,-.15,.05);cylinder(g,.052,.052,.15,silver,0,0,-.19,8).rotation.x=Math.PI/2;box(g,.18,.1,.13,'#e2bc74',0,-.28,.05);}box(g,.12,.1,.14,'#c59b74',0,-.13,.1,.03);box(g,.14,.14,.3,'#4d7066',0,-.23,.23,.04);this.toolGroup.add(g);}
 makeParticles(){this.particles=new T.Points(new T.BufferGeometry(),new T.PointsMaterial({color:'#e6f3e2',size:.06,transparent:true,opacity:.75,depthWrite:false}));this.particleArray=new Float32Array(90*3);this.particles.geometry.setAttribute('position',new T.BufferAttribute(this.particleArray,3));this.scene.add(this.particles);this.particles.visible=false;}
 spray(pos,amount,paint=false){this.particles.visible=amount>0;this.particles.material.color.set(paint?'#e5c783':'#e1f3ed');for(let i=0;i<90;i++){this.particleArray[i*3]=pos.x+(Math.sin(i*12.4+amount*22))*.4;this.particleArray[i*3+1]=pos.y+(Math.cos(i*7.3+amount*20))*.3;this.particleArray[i*3+2]=pos.z+Math.sin(i*3.6+amount*15)*.35;}this.particles.geometry.attributes.position.needsUpdate=true;}
 isVisible(o){while(o){if(!o.visible)return false;o=o.parent;}return true;}
 pick(){
 const ray=this.pickRay||(this.pickRay=new T.Raycaster()),center=this.pickCenter||(this.pickCenter=new T.Vector3()),candidates=this.pickCandidates||(this.pickCandidates=[]),hits=this.pickHits||(this.pickHits=[]);candidates.length=hits.length=0;
 for(const root of this.targets){if(!this.isVisible(root))continue;center.setFromMatrixPosition(root.matrixWorld);if(center.distanceToSquared(this.camera.position)<64)candidates.push(root);}
 ray.setFromCamera(new T.Vector2(),this.camera);ray.far=4.25;ray.intersectObjects(candidates,true,hits);
 for(const hit of hits)if(hit.object.userData.target&&this.isVisible(hit.object))return {data:hit.object.userData.target,point:hit.point,object:hit.object,distance:hit.distance};return null;
 }
 markPart(id,key){this.mark.clear();let v=this.cars.get(id)||this.donors.get(id);if(!v)return;const p=v.parts.get(key);if(!p)return;const sprite=label(this.mark,'↓',.4,.5,0,0,0,'#e7c878','#345647',300);sprite.material.transparent=true;sprite.material.depthTest=false;this.marker={id,key,sprite};}
 clearMark(){this.mark.clear();this.marker=null;}
 moveValid(x,z,head=1.7){if(x<-26||x>26||z<-27||z>76)return false;if(z>65&&!this.state.upgrades.includes('yard'))return false;for(const c of this.colliders){const donor=c.vehicle&&this.donors.get(c.vehicle);if(donor&&donor.g.position.y+.10>head+.15)continue;if(Math.abs(x-c.x)<c.w+.25&&Math.abs(z-c.z)<c.d+.25)return false;}for(const v of this.cars.values()){if(v.g.position.y+.10>head+.15)continue;if(Math.abs(x-v.g.position.x)<1.2&&Math.abs(z-v.g.position.z)<2.45)return false;}return true;}
 update(dt,time,walking,action){if(this.servicePeople)this.servicePeople.children.forEach((p,i)=>{p.rotation.y=Math.sin(time*.6+i)*.04;p.position.y=Math.sin(time*1.8+i)*.008;});this.panelPainting=action?.kind==='paint'&&action.target.key?action:null;for(const out of this.departures){out.time+=dt;this.updateCar(out.v);out.v.g.position.z-=dt*Math.min(7,out.time*3);if(out.time>5)this.dynamic.remove(out.v.g);if(out.time>5)this.scene.remove(out.v.supports.root);}this.departures=this.departures.filter(o=>o.time<5);for(const v of this.cars.values())this.updateCar(v);for(const v of this.donors.values()){
 const dist=this.camera.position.distanceTo(v.g.position);v.g.visible=(v.data.row<8||this.state.upgrades.includes('yard'))&&dist<89;
 if(!v.g.visible){v.supports.root.visible=false;continue;}v.supports.root.visible=v.data.raised&&dist<35;
 const detailed=dist<23;if(detailed){v.inner.visible=true;this.updateCar(v);if(v.lod)v.lod.visible=false;}
 else{
  const signature=Object.values(v.data.parts).map(p=>p.removed?1:0).join('')+'|'+v.data.color+'|'+v.data.hoodOpen+'|'+v.data.doorOpen+'|'+v.data.trunkOpen;
  if(signature!==v.lodSignature){v.inner.visible=true;this.updateCar(v,true);if(v.lod){v.g.remove(v.lod);disposeDistantVehicle(v.lod);}v.lod=makeDistantVehicle(v.inner);v.g.add(v.lod);v.lodSignature=signature;}
  v.inner.visible=false;v.lod.visible=true;
 }
 }
 if(this.marker){const v=this.cars.get(this.marker.id)||this.donors.get(this.marker.id);if(v){const pos=new T.Vector3();v.parts.get(this.marker.key).getWorldPosition(pos);pos.y+=.55+Math.sin(time*3)*.055;this.marker.sprite.position.copy(pos);this.marker.sprite.quaternion.copy(this.camera.quaternion);}}
 if(this.toolGroup.children[0]){const g=this.toolGroup.children[0];g.position.y=-.38+(walking?Math.sin(time*8)*.013:0);g.rotation.z=.2+(action?Math.sin(time*23)*.18:0);g.rotation.x=.5+(action?Math.sin(time*18)*.12:0);}this.carryGroup.position.y=walking?Math.sin(time*7)*.017:0;
 this.sky?.position.copy(this.camera.position);for(const {light,bay} of this.bayShadowLights||[]){light.castShadow=[...this.cars.values()].some(v=>v.data.bay===bay)&&light.position.distanceTo(this.camera.position)<10;}
 this.performanceFrames=(this.performanceFrames||0)+1;this.performanceStart??=time;if(time-this.performanceStart>2){const fps=this.performanceFrames/(time-this.performanceStart),ratio=this.renderer.getPixelRatio(),maximum=Math.min(devicePixelRatio,this.state.settings.quality==='low'?1:1.5);if(ratio>maximum||fps<42&&ratio>1)this.renderer.setPixelRatio(Math.max(1,Math.min(maximum,ratio-.15)));else if(fps>57&&ratio<maximum)this.renderer.setPixelRatio(Math.min(maximum,ratio+.1));this.performanceFrames=0;this.performanceStart=time;}
 this.shadowClock+=dt;if(this.shadowClock>=(action?.05:.12)){this.renderer.shadowMap.needsUpdate=true;this.shadowClock=0;}this.renderer.render(this.scene,this.camera);}
}
