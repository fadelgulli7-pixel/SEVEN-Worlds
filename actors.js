import * as T from 'three';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {clone as cloneSkeleton} from './vendor/SkeletonUtils.js';
import {box,mesh,group,mat,mergeStatic} from './visuals.js?v=field-20261125';

// The masters are decoded once. Each cast owns separate GPU resources, shared only
// among that cast's actors, so leaving/reopening a mission cannot dispose a live cast.
let libraryPromise;
export function loadActorLibrary(buffers){
 if(!libraryPromise){
  libraryPromise=Promise.all(['Tactical','Michelle'].map(async name=>{
   const data=buffers?.[name]??await fetch(new URL(`./assets/${name}.glb`,import.meta.url)).then(r=>{if(!r.ok)throw Error('Character download failed');return r.arrayBuffer()});
   return new GLTFLoader().parseAsync(data,'');
  })).then(([soldier,civilian])=>({soldier,civilian})).catch(e=>{libraryPromise=null;throw e});
 }
 return libraryPromise;
}

function fieldWeapon(p){
 const g=group(p);const metal=mat(0x252d31,.4,.75),polymer=mat(0x4a5146,.85);
 box(g,.065,.09,.32,metal,0,0,.02);box(g,.06,.075,.24,polymer,0,-.015,-.22);
 box(g,.055,.17,.08,metal,0,-.13,.05).rotation.x=-.2;
 box(g,.05,.12,.06,polymer,0,-.1,-.1).rotation.x=.15;
 const barrel=mesh(new T.CylinderGeometry(.014,.014,.42,12),metal,g,0,.025,.37);barrel.rotation.x=Math.PI/2;
 box(g,.07,.07,.18,polymer,0,0,.24);box(g,.015,.07,.02,metal,0,.08,.48);
 for(let z=-.12;z<.19;z+=.03)box(g,.07,.015,.012,metal,0,.06,z);
 mergeStatic(g);
 const flash=group(g,0,.025,.6);flash.userData.nonSolid=true;
 const glow=mesh(new T.ConeGeometry(.055,.22,8),new T.MeshBasicMaterial({color:0xffcf78,transparent:true,opacity:.9}),flash);glow.rotation.x=Math.PI/2;
 const core=mesh(new T.SphereGeometry(.035,8,6),new T.MeshBasicMaterial({color:0xfff3cf}),flash);flash.visible=false;g.userData.flash=flash;return g;
}

export class CharacterCast{
 constructor(library){this.library=library;this.geometries=new Map();this.materials=new Map();this.textures=new Map();this.actors=[]}
 create(parent,{civilian=false,position=[0,0,0],phase=0,captive=false}={}){
  const asset=civilian?this.library.civilian:this.library.soldier;
  const root=group(parent),rig=cloneSkeleton(asset.scene);root.add(rig);
  const bones={},skins=[];
  rig.traverse(o=>{
   if(o.isBone)bones[o.name.replace(/^mixamorig:?/,'').replace(/_\d+$/,'')]=o;
   if(!o.isMesh)return;
   if(!this.geometries.has(o.geometry))this.geometries.set(o.geometry,o.geometry.clone());o.geometry=this.geometries.get(o.geometry);
   const old=o.material;
   if(!this.materials.has(old)){
    const m=old.clone();for(const [k,v] of Object.entries(m))if(v?.isTexture){if(!this.textures.has(v))this.textures.set(v,v.clone());m[k]=this.textures.get(v);m[k].anisotropy=4}
    m.roughness=Math.max(.7,m.roughness);m.metalness=civilian?0:Math.min(.22,m.metalness);this.materials.set(old,m);
   }
   o.material=this.materials.get(old);o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;if(o.isSkinnedMesh)skins.push(o);
  });
  root.updateMatrixWorld(true);if(!civilian){const face=rig.getObjectByName('0');if(face?.isMesh&&!face.isSkinnedMesh&&bones.Head)bones.Head.attach(face);}
  rig.updateMatrixWorld(true);const b=new T.Box3().setFromObject(rig),height=b.max.y-b.min.y,scale=(civilian?1.68:1.84)/height;
  rig.scale.multiplyScalar(scale);rig.position.y-=b.min.y*scale;rig.position.x-=(b.min.x+b.max.x)*.5*scale;rig.position.z-=(b.min.z+b.max.z)*.5*scale;
  root.position.set(...position);root.updateMatrixWorld(true);
  root.userData.dynamic=true;root.userData.legs=[];
  const mixer=new T.AnimationMixer(rig),actions={};
  if(!civilian)for(const name of ['Idle','Walk','Run']){const c=asset.animations.find(a=>a.name===name);if(c)actions[name.toLowerCase()]=mixer.clipAction(c)}
  const rest=new Map(Object.values(bones).map(b=>[b,{q:b.quaternion.clone(),p:b.position.clone()}]));
  const actor={root,rig,bones,skins,mixer,actions,rest,civilian,captive,phase,mode:null,baseY:rig.position.y,flashTime:0,weapon:civilian?null:fieldWeapon(root),pose:new Map(),settledY:null};
  root.updateMatrixWorld(true);actor.footQuaternions=Object.fromEntries(['Left','Right'].map(side=>[side,root.getWorldQuaternion(new T.Quaternion()).invert().multiply(bones[side+'Foot'].getWorldQuaternion(new T.Quaternion()))]));actor.feet=Object.fromEntries(['Left','Right'].map(side=>[side,root.worldToLocal(bones[side+'Foot'].getWorldPosition(new T.Vector3()))]));actor.soleOffset=Math.min(...['LeftFoot','RightFoot'].map(n=>bones[n]?.getWorldPosition(new T.Vector3()).y??root.position.y))-root.position.y;
  actor.play=mode=>{if(actor.mode===mode)return;const prev=actions[actor.mode],next=actions[mode];if(next){next.reset().play();if(prev)next.crossFadeFrom(prev,.2,false)}actor.mode=mode};
  actor.play(civilian?'captive':'idle');actor.mixer.update(phase%1);this.actors.push(actor);return actor;
 }
 update(actor,dt,time,mode='idle'){
  const animationMode=mode==='aim'||mode==='crouch'?'idle':mode;
  for(const [bone,r] of actor.rest){bone.quaternion.copy(r.q);bone.position.copy(r.p)}
  actor.play(animationMode);actor.mixer.update(dt);actor.rig.position.y=actor.baseY;actor.flashTime=Math.max(0,actor.flashTime-dt);if(actor.weapon)actor.weapon.userData.flash.visible=actor.flashTime>0;
  const {bones:b,root,rest}=actor;root.updateMatrixWorld(true);
  // Aim bone segments in actor-local space. This works for the different bind
  // orientations of the two imported skeletons, without copying incompatible tracks.
  const point=(name,child,dir)=>{
   const bone=b[name],end=b[child];if(!bone||!end)return;
   const a=bone.getWorldPosition(new T.Vector3()),v=end.getWorldPosition(new T.Vector3()).sub(a).normalize();
   const wanted=new T.Vector3(...dir).normalize().applyQuaternion(root.getWorldQuaternion(new T.Quaternion()));
   const worldQ=bone.getWorldQuaternion(new T.Quaternion()),parentQ=bone.parent.getWorldQuaternion(new T.Quaternion());
   bone.quaternion.copy(parentQ.invert().multiply(new T.Quaternion().setFromUnitVectors(v,wanted).multiply(worldQ)));
  };
  const reach=(side,target,leg=false)=>{
   const upper=b[side+(leg?'UpLeg':'Arm')],lower=b[side+(leg?'Leg':'ForeArm')],hand=b[side+(leg?'Foot':'Hand')];if(!upper||!lower||!hand)return;
   root.updateMatrixWorld(true);const shoulder=upper.getWorldPosition(new T.Vector3()),elbow=lower.getWorldPosition(new T.Vector3()),wrist=hand.getWorldPosition(new T.Vector3());
   const l1=shoulder.distanceTo(elbow),l2=elbow.distanceTo(wrist),delta=target.clone().sub(shoulder),distance=Math.max(.001,Math.min(delta.length(),l1+l2-.001)),direction=delta.normalize();
   const bend=(leg?new T.Vector3(0,0,1):new T.Vector3(side==='Left'?1:-1,-.7,0)).applyQuaternion(root.getWorldQuaternion(new T.Quaternion()));bend.addScaledVector(direction,-bend.dot(direction)).normalize();
   const along=(l1*l1-l2*l2+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,l1*l1-along*along));const desiredElbow=shoulder.clone().addScaledVector(direction,along).addScaledVector(bend,height);
   const rotate=(bone,end,goal)=>{const from=bone.getWorldPosition(new T.Vector3()),old=end.getWorldPosition(new T.Vector3()).sub(from).normalize(),desired=goal.clone().sub(from).normalize(),world=bone.getWorldQuaternion(new T.Quaternion()),parent=bone.parent.getWorldQuaternion(new T.Quaternion());bone.quaternion.copy(parent.invert().multiply(new T.Quaternion().setFromUnitVectors(old,desired).multiply(world)));};
   rotate(upper,lower,desiredElbow);rotate(lower,hand,target);
  };
  if(actor.civilian){
   for(const [bone,r] of rest){bone.quaternion.copy(r.q);bone.position.copy(r.p)}
   const running=mode==='run',cowering=mode==='cower',stride=running?Math.sin(time*9+actor.phase):0;if(cowering)actor.rig.position.y=actor.baseY-.26;
   point('Spine','Spine1',[0,1,running?.18:.12]);
   for(const side of ['Left','Right']){
    const s=side==='Left'?1:-1,k=stride*s;
    point(side+'UpLeg',side+'Leg',[s*.035,-1,running?k*.65:cowering?.65:.16]);
    point(side+'Leg',side+'Foot',[0,-1,running?-Math.max(0,-k)*.8:cowering?-.75:-.18]);
    point(side+'Arm',side+'ForeArm',[s*.22,running?-.9:-.55,running?-k*.6:.65]);
    point(side+'ForeArm',side+'Hand',[s*-.08,running?-.2:.75,.62]);
   }
  }else{
   const moving=mode==='walk'||mode==='run',running=mode==='run',crouching=mode==='crouch'||mode==='down',cycle=time*(running?8:5)+actor.phase;
   actor.rig.position.y=actor.baseY+(crouching?-.5:moving?Math.sin(cycle*2)*.018:Math.sin(time*1.3+actor.phase)*.004);
   if(!moving||!actor.actions[animationMode])for(const side of ['Left','Right']){const sign=side==='Left'?1:-1,step=Math.sin(cycle)*sign,target=actor.feet[side].clone();if(moving){target.z+=step*(running?.32:.18);target.y+=Math.max(0,Math.cos(cycle)*sign)*(running?.16:.085)}if(crouching)target.z+=.1;reach(side,root.localToWorld(target),true);const foot=b[side+'Foot'];foot.quaternion.copy(foot.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(root.getWorldQuaternion(new T.Quaternion())).multiply(actor.footQuaternions[side]));}
   if(crouching)point('Spine','Spine1',[0,1,mode==='down'?.65:.25]);
   point('RightArm','RightForeArm',actor.shoulderAim?[-.25,.03,1]:[-.15,-.8,.5]);point('RightForeArm','RightHand',actor.shoulderAim?[-.1,.05,1]:[-.1,-.05,1]);
   point('LeftArm','LeftForeArm',[.2,-.65,.6]);point('LeftForeArm','LeftHand',[-.5,.05,1]);
   root.updateMatrixWorld(true);const hand=b.RightHand.getWorldPosition(new T.Vector3());actor.weapon.position.copy(root.worldToLocal(hand));actor.weapon.position.z+=.07;actor.weapon.position.y-=.02;actor.weapon.rotation.x=mode==='aim'?-.08:.04;root.updateMatrixWorld(true);reach('Left',actor.weapon.localToWorld(actor.weapon.userData.supportGrip?.clone()||new T.Vector3(0,-.015,.22)));
  }
  if(mode==='cower'){root.updateMatrixWorld(true);const feet=Math.min(...['LeftFoot','RightFoot'].map(n=>b[n]?.getWorldPosition(new T.Vector3()).y??root.position.y));actor.rig.position.y+=root.position.y+actor.soleOffset-feet;}
  // Blend actual skeletal transforms across aim / movement / cover transitions.
  // A restart with dt=0 deliberately snaps to the requested initial pose.
  const blend=dt>0?1-Math.exp(-dt*18):1;
  for(const bone of Object.values(b)){
   const previous=actor.pose.get(bone);if(previous&&blend<1)bone.quaternion.copy(previous.clone().slerp(bone.quaternion,blend));
   actor.pose.set(bone,bone.quaternion.clone());
  }
  if(actor.settledY!==null&&dt>0)actor.rig.position.y=T.MathUtils.lerp(actor.settledY,actor.rig.position.y,blend);actor.settledY=actor.rig.position.y;
  root.updateMatrixWorld(true);
  if(actor.weapon){const hand=b.RightHand.getWorldPosition(new T.Vector3());actor.weapon.position.copy(root.worldToLocal(hand)).add(new T.Vector3(0,-.02,.07));}
  for(const skin of actor.skins)skin.skeleton.update();
 }
 dispose(){for(const a of this.actors){a.mixer.stopAllAction();a.mixer.uncacheRoot(a.rig);for(const s of a.skins)s.skeleton.dispose()}this.actors.length=0}
}
