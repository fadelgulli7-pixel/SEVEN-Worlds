import * as T from 'three';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {clone} from './vendor/SkeletonUtils.js';
let promise;
export function loadHeroAssets(){
 promise??=Promise.all(['AWM','AbandonedCar'].map(async name=>{
  const response=await fetch(new URL(`./assets/${name}.glb`,import.meta.url));if(!response.ok)throw Error('Scene asset download failed');return new GLTFLoader().parseAsync(await response.arrayBuffer(),'');
 })).then(([rifle,car])=>({rifle,car})).catch(e=>{promise=null;throw e});return promise;
}
export function ownModel(source){
 const root=clone(source.scene),geometries=new Map(),materials=new Map(),textures=new Map();
 root.traverse(o=>{if(!o.isMesh)return;if(!geometries.has(o.geometry))geometries.set(o.geometry,o.geometry.clone());o.geometry=geometries.get(o.geometry);
  const copy=m=>{if(!materials.has(m)){const c=m.clone();for(const [key,value] of Object.entries(c))if(value?.isTexture){if(!textures.has(value))textures.set(value,value.clone());c[key]=textures.get(value);c[key].anisotropy=8}materials.set(m,c)}return materials.get(m)};
  o.material=Array.isArray(o.material)?o.material.map(copy):copy(o.material);o.castShadow=true;o.receiveShadow=true;
 });return root;
}
export function heroRifle(parent,asset){
 const g=new T.Group();g.name='AWM first-person model';g.userData.dynamic=true;const model=ownModel(asset);g.add(model);parent.add(g);
 model.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;o.frustumCulled=false;for(const m of Array.isArray(o.material)?o.material:[o.material]){m.envMapIntensity=.85;if(o.name.toLowerCase().includes('glass')){m.color.setHex(0x47636b);m.metalness=.65;m.roughness=.16;m.transparent=false;m.opacity=1}}}});
 const flash=new T.Group();flash.position.set(0,.04835,-1.2);flash.userData.nonSolid=true;const core=new T.Mesh(new T.ConeGeometry(.055,.23,9),new T.MeshBasicMaterial({color:0xffe5af,transparent:true,opacity:.85,depthWrite:false}));core.rotation.x=-Math.PI/2;flash.add(core);flash.visible=false;g.add(flash);g.userData.flash=flash;
 const bolt=model.getObjectByName('ChargingHandle'),magazine=model.getObjectByName('Magazine');g.userData.parts={bolt,magazine,boltPosition:bolt?.position.clone(),boltRotation:bolt?.rotation.clone(),magazinePosition:magazine?.position.clone()};return g;
}
export function animateHeroRifle(g,reload,cooldown,time,dt){
 const p=g.userData.parts;if(!p)return;
 // Cosmetic cycle only: shot/reload timing and ammunition remain authoritative in the mission.
 if(p.bolt){const u=T.MathUtils.clamp((.7-cooldown)/.7,0,1),pull=cooldown>0?Math.sin(Math.PI*u):0;p.bolt.position.copy(p.boltPosition);p.bolt.position.z+=pull*.11;p.bolt.rotation.copy(p.boltRotation);p.bolt.rotation.z-=pull*.38;}
 if(p.magazine){p.magazine.position.copy(p.magazinePosition);p.magazine.position.y-=reload>0?Math.sin((1-reload/1.45)*Math.PI)*.17:0;}
}
export function abandonedCar(parent,asset,x,z,angle){const g=ownModel(asset);g.name='Scanned abandoned car';g.position.set(x,0,z);g.rotation.y=angle;g.scale.setScalar(1.12);const b=new T.Box3().setFromObject(g);g.position.y-=b.min.y;parent.add(g);return g;}
