import {T,makePart} from './world.js';
import {PARTS} from './engine.js';

// Photograph the actual in-world component models, once, using one small renderer.
const images=new Map();
let studio;
export function partImage(key){
 if(images.has(key))return images.get(key);
 if(!studio){
  const renderer=new T.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});
  renderer.setSize(360,240);renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;
  const scene=new T.Scene();scene.background=new T.Color('#eef4f8');
  scene.add(new T.HemisphereLight('#ffffff','#a7b9d0',2.6));
  const light=new T.DirectionalLight('#fff5e4',3);light.position.set(-3,5,4);scene.add(light);
  studio={renderer,scene,camera:new T.PerspectiveCamera(32,1.5,.01,100)};
 }
 const {renderer,scene,camera}=studio;
 const part=makePart(key,'#49b7c8',100);
 const shape=PARTS[key].shape;
 if(['wheel','rotor','door','fender'].includes(shape))part.rotation.y=-Math.PI/2;
 if(shape==='hood')part.rotation.x=.45;
 part.updateMatrixWorld(true);
 const bounds=new T.Box3().setFromObject(part),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
 part.position.sub(center);scene.add(part);
 const distance=Math.max(size.y,size.x/1.5,size.z*.8)/(.50)*1.15;
 camera.position.set(distance*.65,distance*.42,distance);camera.lookAt(0,0,0);
 renderer.render(scene,camera);
 const url=renderer.domElement.toDataURL('image/png');images.set(key,url);scene.remove(part);return url;
}

export const PART_TIPS={
 wheel:'Complete wheel and tire assembly. Match the correct corner of the car.',
 battery:'Powers starting and electrical systems. Find it under the hood.',
 motor:'An electrical or mechanical accessory mounted in the engine bay.',
 radiator:'The finned heat exchanger at the front of the engine bay.',
 fan:'Sits behind the radiator and pulls air through it.',
 pads:'Friction pads inside the brake caliper. Remove the wheel to reach them.',
 rotor:'The metal brake disc behind the wheel.',
 caliper:'The clamp that squeezes brake pads against the rotor.',
 light:'Front headlamp assembly, including its lens and connector.',
 tail:'Rear lamp assembly, accessed through the trunk.',
 mirror:'Exterior side mirror, attached to the door.',
 door:'Complete replacement door panel. Large parts ride on your trolley.',
 hood:'The hinged panel covering the engine bay. Carried on a trolley.',
 fender:'The body panel around the front wheel.',
 bumper:'Front protective bumper. Paint it to match after installation.',
 seat:'Interior seat assembly. Open the door to reach its mounting bolts.',
 steering:'The steering wheel inside the cabin.',
 strut:'The spring and damper assembly behind the front wheel.',
 exhaust:'Muffler and exhaust section beneath the car. Raise it to work safely.',
 filter:'Air-filter housing in the engine bay.'
};
