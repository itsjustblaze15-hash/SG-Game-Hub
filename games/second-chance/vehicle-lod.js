import * as T from './vendor/three.module.js';

// Keep the same shaped panels and missing parts at distance, but batch the
// exterior into two draw calls. The full interactive model remains intact.
const bodyMaterial=new T.MeshStandardMaterial({vertexColors:true,roughness:.58,metalness:.08,envMapIntensity:.22});
const glassMaterial=new T.MeshStandardMaterial({vertexColors:true,roughness:.28,metalness:.08,transparent:true,opacity:.43,depthWrite:false,side:T.DoubleSide});
export function makeDistantVehicle(inner){
 const group=new T.Group(),batches=[{p:[],n:[],c:[]},{p:[],n:[],c:[]}];
 inner.updateWorldMatrix(true,true);const inverse=inner.matrixWorld.clone().invert(),position=new T.Vector3(),normal=new T.Vector3(),instanceMatrix=new T.Matrix4();
 function append(mesh,matrix){
  const material=mesh.material;if(Array.isArray(material)||material.isMeshBasicMaterial)return;
  if(material.transparent&&!mesh.userData.glazing)return;
  const batch=batches[mesh.userData.glazing?1:0],geometry=mesh.geometry,attr=geometry.attributes.position,normals=geometry.attributes.normal,index=geometry.index?.array;
  const count=index?.length||attr.count,normalMatrix=new T.Matrix3().getNormalMatrix(matrix),color=material.color||new T.Color('#ffffff');
  for(let i=0;i<count;i++){
   const j=index?index[i]:i;position.fromBufferAttribute(attr,j).applyMatrix4(matrix);batch.p.push(position.x,position.y,position.z);
   if(normals)normal.fromBufferAttribute(normals,j).applyMatrix3(normalMatrix).normalize();else normal.set(0,1,0);
   batch.n.push(normal.x,normal.y,normal.z);batch.c.push(color.r,color.g,color.b);
  }
 }
 function visit(object){
  if(!object.visible)return;
  if(object.isMesh){const matrix=inverse.clone().multiply(object.matrixWorld);if(object.isInstancedMesh){for(let i=0;i<object.count;i++){object.getMatrixAt(i,instanceMatrix);append(object,matrix.clone().multiply(instanceMatrix));}}else append(object,matrix);}
  object.children.forEach(visit);
 }
 visit(inner);
 batches.forEach((batch,i)=>{if(!batch.p.length)return;const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(batch.p,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(batch.n,3));geometry.setAttribute('color',new T.Float32BufferAttribute(batch.c,3));geometry.computeBoundingSphere();const mesh=new T.Mesh(geometry,i?glassMaterial:bodyMaterial);mesh.receiveShadow=true;group.add(mesh);});
 group.scale.copy(inner.scale);group.name='Batched distant donor';return group;
}
export function disposeDistantVehicle(group){group?.children.forEach(mesh=>mesh.geometry.dispose());}

// Batch fixed scenery by its existing material. Interactive meshes, textured
// surfaces, transparent effects and existing GPU instances stay separate.
export function batchStaticMeshes(root){
 root.updateWorldMatrix(true,true);const inverse=root.matrixWorld.clone().invert(),batches=new Map();
 root.traverse(mesh=>{
  if(!mesh.isMesh||mesh.isInstancedMesh||mesh.userData.target)return;
  const material=mesh.material;if(Array.isArray(material)||!material.color||material.map||material.transparent||material.isMeshBasicMaterial)return;
  if(!batches.has(material))batches.set(material,[]);batches.get(material).push(mesh);
 });
 const position=new T.Vector3(),normal=new T.Vector3();
 for(const [material,meshes] of batches){
  if(meshes.length<2)continue;const p=[],n=[],uv=[];let cast=false,receive=false;
  for(const mesh of meshes){
   const matrix=inverse.clone().multiply(mesh.matrixWorld),normalMatrix=new T.Matrix3().getNormalMatrix(matrix),geometry=mesh.geometry,attr=geometry.attributes.position,normals=geometry.attributes.normal,tex=geometry.attributes.uv,index=geometry.index?.array,count=index?.length||attr.count;
   for(let i=0;i<count;i++){const j=index?index[i]:i;position.fromBufferAttribute(attr,j).applyMatrix4(matrix);p.push(position.x,position.y,position.z);if(normals)normal.fromBufferAttribute(normals,j).applyMatrix3(normalMatrix).normalize();else normal.set(0,1,0);n.push(normal.x,normal.y,normal.z);uv.push(tex?.getX(j)||0,tex?.getY(j)||0);}
   cast ||= mesh.castShadow;receive ||= mesh.receiveShadow;mesh.removeFromParent();
  }
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(p,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(n,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.computeBoundingSphere();const merged=new T.Mesh(geometry,material);merged.castShadow=cast;merged.receiveShadow=receive;merged.name='Batched fixed scenery';root.add(merged);
 }
}
