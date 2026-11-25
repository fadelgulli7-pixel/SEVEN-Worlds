import {loadActorLibrary,CharacterCast} from './actors.js?v=field-cast-2';
import {loadHeroAssets,heroRifle} from './hero-assets.js?v=field-cast-2';
import {loadCampAssets} from './mountain-outpost.js?v=field-cast-2';
import {alpineTreeLine} from './field-design.js?v=field-cast-2';
import {rescueHelicopter} from './aircraft.js?v=field-cast-2';
import {finishSurfaces} from './surfaces.js?v=field-cast-2';
import {outpostAtmosphere} from './presentation.js?v=field-cast-2';
import {outpostDetails} from './scenery.js?v=field-cast-2';
import {sky,mountains,details} from './environment.js?v=field-cast-2';
import {T,mat,mesh,box,ball,cyl,group,seed,terrainTexture,lightScene,person,marker,rifle,batchScenery,disposeWorld} from './visuals.js?v=field-cast-2';
import {config,operationFor} from './state.js?v=field-cast-2';
import {chapterLandmark,chapterSky} from './chapter-art.js?v=field-cast-2';
export class Sniper{
constructor(renderer,state,events){this.scene=new T.Scene();this.state=state;this.operation=operationFor(state.level);this.events=events;this.camera=new T.PerspectiveCamera(55,1,.1,250);this.camera.position.set(0,7,19.5);this.camera.rotation.order='YXZ';this.yaw=0;this.pitch=-.23;this.camera.rotation.x=this.pitch;this.scene.add(this.camera);this.gun=rifle(this.camera);this.gun.scale.setScalar(.68);this.scanClock=0;this.sensitivity=1;this.holding=false;this.breath=3;this.breathRecovery=0;this.ray=new T.Raycaster();this.targets=[];this.effects=[];this.round=null;this.scoped=false;this.recoil=0;this.build();this.loaded=false;this.ready=this.loadDetailedModels();finishSurfaces(this.scene,'sniper');batchScenery(this.environment)}
build(){this.environment=new T.Group();this.scene.add(this.environment);let p=this.environment,r=seed(this.state.level*717),biome=Math.floor((this.state.level-1)/11);const ground=[0x9a8468,0xc2a06c,0x667a7d,0xd1dbde,0x66616b,0x7a806e,0x857774][biome];const [zenith,horizon,haze]=chapterSky(biome);this.scene.fog=new T.Fog(haze,65,180);const sun=lightScene(this.scene,0x718594,0xf9dab3);sun.intensity=2.1;sun.position.set(-30,24,12);sun.shadow.mapSize.set(2048,2048);this.sun=sun;this.scene.children.find(x=>x.isHemisphereLight).intensity=.55;mesh(new T.PlaneGeometry(250,250),new T.MeshStandardMaterial({color:ground,map:terrainTexture('#aa9a83','#665b4822'),roughness:1}),p).rotation.x=-Math.PI/2;
mountains(p,biome);alpineTreeLine(p);details(p,biome);outpostDetails(p,biome);this.atmosphere=outpostAtmosphere(this.scene,p,biome);sky(this.scene,zenith,horizon);chapterLandmark(p,biome);
box(p,16,6,8,0x8c8377,0,3,24);box(p,17,.25,9,0xa69c8a,0,6.15,24);for(let x of [-8,8])box(p,.3,.5,8,0xbbb09b,x,6.5,24);box(p,17,.2,.3,0xb3a28b,0,6.28,20); // player rooftop
// outpost buildings arranged around the clear central rescue corridor
for(let side of [-1,1])for(let i=0;i<4;i++){let x=side*(17+r()*5),z=-5-i*16,h=4+r()*5;let g=group(p,x,0,z);box(g,8,h,9,biome===3?0xa4adb1:0x9b8d76,0,h/2,0);box(g,8.6,.3,9.6,0x766c5c,0,h,0);for(let j=0;j<3;j++){box(g,1.1,1.5,.08,0x343c40,-2.5+j*2.5,2,4.55);box(g,1.2,.1,.2,0xbaa47a,-2.5+j*2.5,1.2,4.6)}for(let k=0;k<2;k++)box(g,1.4,1.4,1.4,0x666b62,(r()-.5)*4,h+.85,(r()-.5)*4)}
for(let side of [-1,1]){let g=group(p,side*15,0,-40);for(let x of [-1,1])for(let z of [-1,1])box(g,.2,10,.2,0x564d3e,x*1.5,5,z*1.5);box(g,4,.3,4,0x80705a,0,8,0);box(g,4,.2,4,0x5c5144,0,10.6,0);for(let x of [-1.8,1.8])box(g,.15,2.5,.15,0x554e42,x,9.3,1.8);box(g,3.8,.8,.1,0x76664f,0,8.5,1.8)}
for(let i=0;i<20;i++){let side=i%2?1:-1,x=side*(10+r()*4),z=-r()*55;box(p,1.5,1.4,1.5,0x6b715b,x,.7,z);box(p,1.6,.12,1.6,0x3b4538,x,1.42,z);for(let a of [-.55,.55])box(p,.07,1.4,1.55,0xb3a379,x+a,.7,z)}
// extraction ring and hovering rescue aircraft model
this.exit=new T.Vector3(8,0,5);
this.cache=new T.Vector3(-7,0,-7);
if(this.operation.type==='supply'){
 const crate=group(p,this.cache.x,0,this.cache.z);
 box(crate,1.4,.9,1.1,0x39796d,0,.45,0);
 box(crate,1.47,.12,1.17,0xd7ba79,0,.94,0);
}
const ring=mesh(new T.TorusGeometry(3.1,.07,8,48),new T.MeshBasicMaterial({color:0xedc568}),p,8,.04,5);ring.rotation.x=-Math.PI/2;this.rotor=rescueHelicopter(p,12,7).rotor;
for(let i=0;i<config('sniper',this.state.level).target;i++){let x=(i%2?1:-1)*(3+(i%4)*1.6),z=-4-Math.floor(i/2)*5;let model=person(p,x,z,0x77715a);let tag=marker(model,0xf36b4b);model.userData.target=this.targets.length;this.targets.push({model,tag,alive:true,friend:false,origin:model.position.clone(),phase:r()*6})}for(let i=0;i<2;i++){let model=person(p,-1+i*3,-12-i*7,0x437c7b,true),tag=marker(model,0x7bf3ae);model.userData.target=this.targets.length;this.targets.push({model,tag,alive:true,friend:true,origin:model.position.clone(),phase:i})}}
async loadDetailedModels(){
 const [library,hero,lighting]=await Promise.all([loadActorLibrary(),loadHeroAssets(),loadCampAssets()]);
 if(this.disposed)return;
 this.cast=new CharacterCast(library);
 for(const target of this.targets){
  const previous=target.model;
  const actor=this.cast.create(this.environment,{position:previous.position.toArray(),civilian:false,phase:target.phase});
  actor.root.userData.target=previous.userData.target;
  actor.root.userData.legs=[];
  actor.root.add(target.tag);
  previous.removeFromParent();disposeWorld(previous);
  target.model=actor.root;target.actor=actor;
 }
 this.gun.removeFromParent();disposeWorld(this.gun);
 this.gun=heroRifle(this.camera,hero.rifle);this.gun.scale.setScalar(.48);this.gun.position.set(.3,-.3,-.9);
 this.scene.background?.dispose();this.scene.background=lighting.background.clone();
 this.scene.environment=lighting.light.clone();this.scene.environmentIntensity=.5;this.scene.backgroundIntensity=.6;
 this.loaded=true;
}

scan(){this.ray.setFromCamera(new T.Vector2(0,0),this.camera);let hits=this.ray.intersectObjects(this.environment.children,true);let info=null;for(const h of hits){let o=h.object;while(o&&o.userData.target===undefined)o=o.parent;if(o){let target=this.targets[o.userData.target];if(target.alive){info={friend:target.friend,distance:Math.round(h.distance)};break}}else if(h.distance>2)break}this.events.scan?.(info)}
holdBreath(){if(!this.round||this.round.paused||this.breath<=.1)return false;this.holding=!this.holding;return this.holding}
resize(w,h){this.camera.aspect=w/h;this.gun.position.x=w/h<1?.16:.3;this.camera.updateProjectionMatrix()}
aim(dx,dy){if(!this.round||this.round.paused)return;let rate=(this.scoped?.0008:.0025)*this.sensitivity;this.yaw=Math.max(-.85,Math.min(.85,this.yaw-dx*rate));this.pitch=Math.max(-.65,Math.min(.1,this.pitch-dy*rate));this.camera.rotation.set(this.pitch,this.yaw,0,'YXZ')}
start(){this.breath=3;this.breathRecovery=0;this.holding=false;this.wasReloading=false;this.round={left:config('sniper',this.state.level).seconds,hits:0,mistakes:0,ammo:5,reload:0,paused:false,extract:0,shots:0,accuracy:0};this.targets.forEach(t=>{t.alive=true;t.fall=null;t.tag.visible=true;t.model.visible=true;t.model.rotation.z=0;t.model.position.copy(t.origin)});this.yaw=0;this.pitch=-.23;this.camera.rotation.set(this.pitch,0,0);this.events.change(this.round)}
scope(){this.scoped=!this.scoped;this.camera.fov=this.scoped?19:55;this.camera.updateProjectionMatrix();this.gun.visible=!this.scoped;return this.scoped}
reload(){if(!this.round||this.round.paused||this.round.reload||this.round.ammo===5)return;this.round.reload=1.2;this.events.toast('Reloading…')}
fire(){let a=this.round;if(!a||a.paused||a.extract||a.reload||a.waitingCargo||a.waitingBeacon)return;if(!a.ammo){this.events.toast('Magazine empty. Tap Reload.');return}a.ammo--;a.shots++;this.recoil=.09;this.flashTime=.055;this.events.shot();this.ray.setFromCamera(new T.Vector2(0,0),this.camera);let hits=this.ray.intersectObjects(this.environment.children,true);let victim=null;for(let h of hits){let o=h.object;while(o&&o.userData.target===undefined)o=o.parent;if(o){let target=this.targets[o.userData.target];if(target.alive&&target.model.visible){victim=target;break}}else if(h.distance>2){break}}
if(victim){this.events.hit?.();if(victim.friend){a.mistakes++;this.events.toast('Teammate hit. Protect green markers.');if(a.mistakes>=3)return this.end(false)}else{victim.alive=false;victim.fall=0;victim.tag.visible=false;a.hits++;this.spark(victim.model.position);this.events.toast('Threat neutralized. '+a.hits+'/'+config('sniper',this.state.level).target);if(a.hits>=config('sniper',this.state.level).target){if(this.operation.type==='relay'){
 a.waitingBeacon=true;this.events.toast('Route clear. Activate the rescue beacon.');
}else this.beginEvacuation(a);}}}this.events.change(a)}
beginEvacuation(round){
 round.extract=.001;
 const viaSupply=this.operation.type==='supply'&&!round.cargoCollected;
 for(const [index,teammate] of this.targets.filter(t=>t.friend).entries()){
  teammate.extractStart=teammate.model.position.clone();
  teammate.destination=(viaSupply?this.cache:this.exit).clone();
  teammate.destination.x+=index*.7-.35;
 }
 this.events.toast(viaSupply?'Team moving to the supply cache.':'Team moving to extraction.');
}
routeAction(){
 const round=this.round;
 if(!round||round.paused)return false;
 if(round.waitingBeacon){round.waitingBeacon=false;this.beginEvacuation(round);}
 else if(round.waitingCargo){round.waitingCargo=false;round.cargoCollected=true;this.beginEvacuation(round);}
 else return false;
 this.events.change(round);
 return true;
}
spark(pos){let g=group(this.scene,pos.x,1.2,pos.z);for(let i=0;i<8;i++){let a=ball(g,0,0,0,.045,.045,.045,0xffd58d);a.userData.v=new T.Vector3((Math.random()-.5)*3,Math.random()*3,(Math.random()-.5)*3)}this.effects.push({g,life:.5})}
end(win){let result=this.round;this.round=null;this.events.end(win,result)}
update(dt,t){this.atmosphere.update(dt,t);this.rotor.rotation.y+=dt*20;this.flashTime=Math.max(0,(this.flashTime||0)-dt);this.gun.userData.flash.visible=this.flashTime>0;this.recoil*=Math.exp(-dt*16);this.gun.position.z=-.9+this.recoil*.6;this.gun.position.y=-.28+Math.sin(t*1.7)*.002;this.gun.rotation.y=Math.sin(t*1.1)*.005;let a=this.round;if(!a)this.camera.rotation.set(-.23,Math.sin(t*.12)*.025,0,'YXZ');this.gun.rotation.z=a?.reload?-Math.sin(a.reload/1.2*Math.PI)*.5:0;this.gun.rotation.x=a?.reload?Math.sin(a.reload/1.2*Math.PI)*.2:0;if(a&&!a.paused){a.left-=dt;if(this.holding&&this.breath>0){this.breath=Math.max(0,this.breath-dt);this.breathRecovery=5;if(!this.breath)this.holding=false}else{this.breathRecovery=Math.max(0,this.breathRecovery-dt);if(!this.breathRecovery)this.breath=Math.min(3,this.breath+dt*.5)}const sway=this.scoped&&!this.holding?.0008*(1-this.state.upgrade*.12):0;this.camera.rotation.set(this.pitch+Math.sin(t*2)*sway+this.recoil*.08,this.yaw+Math.sin(t*1.3)*sway,0,'YXZ');a.reload=Math.max(0,a.reload-dt);if(a.reload===0&&this.wasReloading){a.ammo=5;this.events.toast('Reloaded');this.events.change(a)}this.wasReloading=a.reload>0;if(a.left<=0)return this.end(false);if(a.extract){a.extract+=dt;for(let target of this.targets.filter(x=>x.friend)){target.model.position.lerpVectors(target.extractStart,target.destination,Math.min(1,a.extract/4));target.model.rotation.y=Math.atan2(8-target.model.position.x,5-target.model.position.z);target.model.userData.legs.forEach((l,i)=>l.rotation.x=Math.sin(t*9+i*Math.PI)*.5)}if(a.extract>=4){
 if(this.operation.type==='supply'&&!a.cargoCollected){
  a.extract=0;a.waitingCargo=true;this.events.toast('Team at the cache. Collect the supplies.');
  this.events.change(a);
 }else return this.end(true);
}}else if(!a.waitingCargo&&!a.waitingBeacon)for(let target of this.targets){if(!target.alive)continue;let speed=config('sniper',this.state.level).speed*(this.scoped?1-this.state.upgrade*.1:1);target.phase+=dt*speed;target.model.position.x=target.origin.x+Math.sin(target.phase)*(target.friend?.15:1.2);target.model.rotation.y=Math.cos(target.phase)>0?.6:-.6;target.model.userData.legs.forEach((l,i)=>l.rotation.x=Math.sin(t*4+i*Math.PI)*(target.friend?.02:.2))}this.events.tick(a);this.scanClock+=dt;if(this.scanClock>.15){this.scanClock=0;this.scan()}}for(let x of this.targets){if(!x.alive&&x.model.visible){x.fall+=dt;x.model.rotation.z=Math.min(1.5,x.fall*3)*(x.origin.x<0?1:-1);if(x.fall>1.2)x.model.visible=false}x.tag.rotation.y=t;x.tag.position.y=2.7+Math.sin(t*2+x.phase)*.06}if(this.cast&&!a?.paused)for(const target of this.targets){
 if(target.alive)this.cast.update(target.actor,dt,t,a?.extract&&target.friend?'run':target.friend?'idle':a?'walk':'idle');
}
for(let e of this.effects){e.life-=dt;e.g.children.forEach(o=>o.position.addScaledVector(o.userData.v,dt))}this.effects=this.effects.filter(e=>{if(e.life<=0){this.scene.remove(e.g);disposeWorld(e.g);return false}return true})}
setQuality(q){const size=q==='high'?2048:1024;if(this.sun.shadow.mapSize.x!==size){this.sun.shadow.map?.dispose();this.sun.shadow.map=null;this.sun.shadow.mapSize.set(size,size)}this.atmosphereQuality=q}
dispose(){this.disposed=true;this.cast?.dispose();disposeWorld(this.scene)}}
