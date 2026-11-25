import {T,mat,mesh,group,marker,rifle,lightScene,disposeWorld} from './visuals.js?v=field-cast-2';
import {environmentLight} from './surfaces.js?v=field-cast-2';
import {TacticalEncounter} from './combat-ai.js?v=field-cast-2';
import {sky} from './environment.js?v=field-cast-2';
import {loadStreetLight,contactMaterial,contactShadow} from './urban-details.js?v=field-cast-2';
import {loadHeroAssets,heroRifle,animateHeroRifle} from './hero-assets.js?v=field-cast-2';
import {loadActorLibrary,CharacterCast} from './actors.js?v=field-cast-2';
import {loadCampAssets,buildMountainOutpost} from './mountain-outpost.js?v=field-cast-2';
import {loadCityMaterials,buildOldQuarter} from './old-quarter.js?v=field-cast-2';

export const URBAN_MISSION={target:3,seconds:100,reward:0,title:'Old Quarter rescue'};
const HOME=new T.Vector3(0,3.45,15),PITCH=-.085;
export class UrbanRescue{
 constructor(renderer,state,events,options={}){
  this.isCamp=options.theme==='camp';this.home=this.isCamp?new T.Vector3(0,3.6,9):HOME.clone();this.startPitch=this.isCamp?-.11:PITCH;this.baseFov=this.isCamp?60:50;this.coverDrop=this.isCamp?1.25:.95;this.coverZ=this.isCamp?7.1:14.4;this.coverTop=this.isCamp?2.6:3.02;this.gunHome=new T.Vector3(.28,-.23,-.8);
  this.isUrban=true;this.state=state;this.events=events;this.scene=new T.Scene();this.targets=[];this.round=null;this.scoped=false;this.yaw=0;this.pitch=this.startPitch;this.sensitivity=1;this.effects=[];this.breath=3;this.breathRecovery=0;this.holding=false;this.recoil=0;this.loaded=false;this.disposed=false;this.scanClock=0;this.cinematicEnabled=true;this.zoom=3;this.coverAmount=0;this.cooldown=0;this.encounter=new TacticalEncounter(3);this.enemyRay=new T.Raycaster();
  this.camera=new T.PerspectiveCamera(this.baseFov,1,.05,360);this.camera.rotation.order='YXZ';this.camera.position.copy(this.home);this.camera.rotation.x=this.startPitch;this.scene.add(this.camera);
  this.gun=rifle(this.camera);this.gun.scale.setScalar(.68);this.gun.position.set(.28,-.23,-.8);
  this.sun=lightScene(this.scene,0xc7d7da,0xffe0ae);this.sun.position.set(-18,28,21);this.sun.target.position.set(0,0,-12);this.scene.add(this.sun.target);this.sun.intensity=2.1;Object.assign(this.sun.shadow.camera,{left:-25,right:25,top:36,bottom:-22,far:130});this.sun.shadow.normalBias=.025;this.sun.shadow.bias=-.00015;
  this.scene.children.find(o=>o.isHemisphereLight).intensity=.3;this.scene.fog=new T.Fog(0xa7b9bd,48,130);sky(this.scene,'#80abc2','#dfd7be');environmentLight(this.scene,'sniper');this.scene.environmentIntensity=.65;this.ray=new T.Raycaster();
  this.ready=Promise.all([loadActorLibrary(),this.isCamp?loadCampAssets().then(a=>a.kits):loadCityMaterials(),this.isCamp?loadCampAssets():loadStreetLight(),loadHeroAssets()]).then(([library,kits,hdri,hero])=>{
   if(this.disposed)return;this.scene.environment.dispose();this.scene.background.dispose();this.scene.environment=hdri.light.clone();this.scene.background=hdri.background.clone();this.scene.backgroundBlurriness=.015;this.scene.backgroundIntensity=.8;this.scene.environmentIntensity=.75;this.scene.environmentRotation.y=-.6;this.scene.backgroundRotation.y=-.6;this.contactMaterial=contactMaterial();this.gun.removeFromParent();disposeWorld(this.gun);this.gun=heroRifle(this.camera,hero.rifle);this.gun.scale.setScalar(.55);this.gun.position.set(this.camera.aspect<1?.10:.28,-.23,-.8);const city=this.isCamp?buildMountainOutpost(this.scene,kits):buildOldQuarter(this.scene,kits,hero);Object.assign(this,city);this.cast=new CharacterCast(library);this.actorsGroup=group(this.scene);
   if(this.isCamp){
    this.sun.color.setHex(0xffb075);this.sun.intensity=2.15;this.sun.position.set(25,19,-50);this.scene.fog=new T.Fog(0xa5a397,52,205);this.scene.backgroundIntensity=.55;this.scene.environmentIntensity=.48;this.scene.backgroundRotation.y=1.2;this.scene.environmentRotation.y=1.2;
    const hemi=this.scene.children.find(o=>o.isHemisphereLight);hemi.color.setHex(0xa398d1);hemi.groundColor.setHex(0x574250);hemi.intensity=.43;
    // Live aiming is first person. The lobby illustration is not a camera rig.
    this.gun.visible=true;
   }
   if(!this.isCamp){this.sun.color.setHex(0xffd7a0);this.sun.intensity=2.25;this.sun.position.set(-25,22,8);this.scene.environmentIntensity=.52;this.scene.fog=new T.Fog(0xaeb9b8,38,115);}
   const definitions=[
    {position:[-4.1,0,-7.8],phase:.2,role:'patrol',cover:[-5.7,0,-10.7]},
    {position:[4.2,0,-17],phase:1.8,role:'patrol',cover:[5.1,0,-20.7]},
    {position:[.75,0,-10.5],phase:0,role:'captor',cover:[2.9,0,-14.7]},
    {position:[-.05,0,-9.95],phase:0,civilian:true,captive:true,role:'hostage'},
    {position:[-3.3,0,-23],phase:.8,civilian:true,role:'civilian'}
   ];
   for(const d of definitions){const actor=this.cast.create(this.actorsGroup,this.isCamp&&d.civilian?{...d,civilian:false,captive:false}:d),model=actor.root,tag=marker(model,d.civilian?0x8bdfba:0xecad77);tag.scale.setScalar(.65);tag.userData.nonSolid=true;model.userData.target=this.targets.length;const target={actor,model,tag,friend:!!d.civilian,role:d.role,alive:true,origin:model.position.clone(),phase:d.phase,fall:null,cover:d.cover?new T.Vector3(...d.cover):null};target.contact=contactShadow(this.scene,this.contactMaterial,model.position.x,model.position.z,.9,.65);this.targets.push(target);this.cast.update(actor,0,0,'idle')}
   this.loaded=true;this.resize(this.viewWidth||390,this.viewHeight||750);this.scene.updateMatrixWorld(true);
  });
 }
 resize(w,h){
  this.viewWidth=w;this.viewHeight=h;this.camera.aspect=w/h;if(!this.film)this.camera.fov=this.scoped?this.baseFov/this.zoom:this.baseFov;
  if(this.isCamp){const portrait=w/h<1;this.gun.scale.setScalar(portrait?.40:.48);this.gunHome.set(portrait?.13:.33,portrait?-.34:-.30,-.9);}
  else{this.gun.scale.setScalar(.55);this.gunHome.set(w/h<1?.10:.28,-.23,-.8);}
  this.gun.position.copy(this.gunHome);this.camera.updateProjectionMatrix();
 }
 setQuality(q){const n=q==='high'?2048:1024;if(this.sun.shadow.mapSize.x!==n){this.sun.shadow.map?.dispose();this.sun.shadow.map=null;this.sun.shadow.mapSize.set(n,n)}}
 start(){
  if(!this.loaded||this.disposed)return false;this.cancelFilm();this.scoped=false;this.events.cinema?.(false,false);this.gun.visible=true;this.camera.position.copy(this.home);this.yaw=0;this.pitch=this.startPitch;this.camera.rotation.set(this.startPitch,0,0);this.camera.fov=this.baseFov;this.camera.updateProjectionMatrix();this.breath=3;this.breathRecovery=0;this.holding=false;this.simTime=0;this.recoil=0;this.coverAmount=0;this.cooldown=0;this.encounter.reset(3);this.damageFade=0;
  for(const e of this.effects){e.g.removeFromParent();disposeWorld(e.g)}this.effects.length=0;
  this.round={left:URBAN_MISSION.seconds,hits:0,mistakes:0,ammo:5,reload:0,paused:false,extract:0,shots:0,headshots:0,cinematic:false,health:100,covered:false,alerted:false,lastDamage:0,enemyShots:0,damage:0};
  for(const t of this.targets){t.alive=true;t.fall=null;t.settled=false;t.moveStart=null;t.phaseBefore=null;t.actor.flashTime=0;t.model.visible=true;t.contact.visible=true;t.tag.visible=true;t.model.position.copy(t.origin);t.model.rotation.set(0,0,0);this.cast.update(t.actor,0,0,t.friend&&!this.isCamp?'captive':'idle')}
  this.events.change(this.round);this.events.phase?.('01 / IDENTIFY',this.isCamp?'Clear three guards. Protect both teammates and escort them to the evacuation point.':'Three threats. Two civilians. Fire, then take cover when they aim.');return true;
 }
 aim(dx,dy){if(!this.round||this.round.paused||this.film||this.round.extract)return;const rate=(this.scoped?.00055:.0018)*this.sensitivity;this.yaw=T.MathUtils.clamp(this.yaw-dx*rate,-.85,.85);this.pitch=T.MathUtils.clamp(this.pitch-dy*rate,this.isCamp?-.30:-.7,.28);this.camera.rotation.set(this.pitch,this.yaw,0,'YXZ')}
 scope(){if(this.film||this.round?.paused||this.round?.extract||this.round?.covered)return this.scoped;this.scoped=!this.scoped;this.camera.fov=this.scoped?this.baseFov/this.zoom:this.baseFov;this.camera.updateProjectionMatrix();this.gun.visible=!this.scoped;return this.scoped}
 setZoom(value){this.zoom=T.MathUtils.clamp(Number(value)||3,2,6);if(this.scoped&&!this.film){this.camera.fov=this.baseFov/this.zoom;this.camera.updateProjectionMatrix()}return this.zoom}
 toggleCover(){const a=this.round;if(!a||a.paused||a.cinematic||a.extract)return false;a.covered=!a.covered;this.holding=false;if(a.covered&&this.scoped){this.scoped=false;this.camera.fov=this.baseFov;this.camera.updateProjectionMatrix();this.events.cinema?.(false,false)}this.events.change(a);return a.covered}
 holdBreath(){if(!this.round||this.round.paused||this.film||this.breath<=.1)return false;return this.holding=!this.holding}
 reload(){const a=this.round;if(!a||a.paused||a.cinematic||a.extract||a.reload||a.ammo===5)return;a.reload=1.45;if(this.scoped){this.scoped=false;this.camera.fov=this.baseFov;this.camera.updateProjectionMatrix();this.events.cinema?.(false,false)}this.events.audio?.('reload');this.events.toast('Reloading…');this.events.change(a)}
 hitTest(){
  this.scene.updateMatrixWorld(true);this.ray.setFromCamera(new T.Vector2(),this.camera);
  // Accurate animated bounds only for scans/shots, not a full vertex pass every frame.
  for(const t of this.targets)if(t.alive)for(const skin of t.actor.skins)skin.computeBoundingSphere();
  const hits=this.ray.intersectObjects([this.environment,this.actorsGroup],true);
  for(const h of hits){let o=h.object,target=null,skip=false;while(o){if(o.userData.nonSolid)skip=true;if(o.userData.target!==undefined)target=this.targets[o.userData.target];o=o.parent}if(skip||target&&!target.alive||!h.object.visible)continue;return {target,point:h.point.clone(),distance:h.distance}}
  return null;
 }
 scan(){const h=this.hitTest();this.events.scan?.(h?.target?{friend:h.target.friend,distance:Math.round(h.distance)}:null)}
 fire(){
  const a=this.round;if(!a||a.paused||a.extract||a.reload||a.cinematic||a.covered||this.coverAmount>.12||this.cooldown>0||!this.loaded)return;
  if(!a.ammo){this.events.toast('Magazine empty. Reload to continue.');return}
  a.ammo--;a.shots++;this.cooldown=.7;this.encounter.alert();a.alerted=true;this.recoil=.09;this.flashTime=.06;this.events.shot();
  const hit=this.hitTest();if(hit?.target&&!hit.target.friend&&this.cinematicEnabled)this.beginFilm(hit);else this.resolveShot(hit);
  if(this.round)this.events.change(a);
 }
 resolveShot(hit){
  const a=this.round;if(!a)return;
  if(hit?.target){const t=hit.target;this.events.hit?.();if(t.friend){a.mistakes++;this.events.toast(this.isCamp?'Teammate injured. Mission stopped.':'Civilian injured. Mission stopped.');this.end(false);return}
   if(!t.alive)return;t.alive=false;t.fall=0;t.actor.flashTime=0;t.tag.visible=false;a.hits++;if(hit.point.y-t.model.position.y>1.5)a.headshots++;this.impact(hit.point);
   this.events.toast(`Threat stopped · ${a.hits} / 3`);
   this.events.phase?.(this.isCamp?'02 / CLEAR THE OUTPOST':'02 / CLEAR THE STREET',`${3-a.hits} threats remaining. Use cover while they fire.`);
   if(a.hits===3){a.extract=.001;a.covered=false;this.holding=false;for(const [i,f] of this.targets.filter(t=>t.friend).entries()){f.extractStart=f.model.position.clone();f.waypoint=new T.Vector3(i===0?-.7:-1.7,0,this.isCamp?-24:-2);f.destination=this.exit.clone().add(new T.Vector3(i*.8,0,0))}this.events.phase?.('03 / EXTRACTION',this.isCamp?'Camp secure. Escort your team to the illuminated evacuation point.':'Street secure. Follow the civilians to the rescue vehicle.');this.events.toast(this.isCamp?'Your team is moving. Hold fire.':'Civilians are moving. Hold fire.');if(this.scoped){this.scoped=false;this.events.cinema?.(false,false)}this.camera.fov=this.baseFov;this.camera.updateProjectionMatrix()}
  }else{this.events.toast('No confirmed hit. Check your line of sight.');if(hit)this.impact(hit.point)}
  this.events.change(a);
 }
 beginFilm(hit){
  const a=this.round;a.cinematic=true;this.holding=false;
  const from=this.camera.getWorldPosition(new T.Vector3()),to=hit.point.clone(),direction=to.clone().sub(from).normalize();
  const bullet=group(this.scene);const shell=mesh(new T.CylinderGeometry(.014,.02,.1,12),mat(0xcaa266,.25,.8),bullet);shell.rotation.x=Math.PI/2;const nose=mesh(new T.ConeGeometry(.014,.04,12),mat(0xe6c088,.25,.8),bullet,0,0,.07);nose.rotation.x=Math.PI/2;bullet.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),direction);
  this.film={elapsed:0,hit,from,to,direction,bullet,position:this.camera.position.clone(),quaternion:this.camera.quaternion.clone(),fov:this.camera.fov};this.gun.visible=false;this.camera.fov=40;this.camera.updateProjectionMatrix();this.events.cinema?.(true,this.scoped);this.events.phase?.('PRECISION SHOT','Confirmed hit');
 }
 updateFilm(dt){
  const f=this.film;if(!f)return;f.elapsed+=dt;const u=T.MathUtils.clamp(f.elapsed/1.1,0,1),travel=.06+u*.94;const at=f.from.clone().lerp(f.to,travel);f.bullet.position.copy(at);
  const side=new T.Vector3().crossVectors(f.direction,new T.Vector3(0,1,0)).normalize();this.camera.position.copy(at).addScaledVector(f.direction,-1.8).addScaledVector(side,.28).add(new T.Vector3(0,.19,0));this.camera.lookAt(at.clone().addScaledVector(f.direction,2));
  if(u>=1){const hit=f.hit;this.cancelFilm();if(this.round){this.round.cinematic=false;this.resolveShot(hit)}}
 }
 cancelFilm(){
  const f=this.film;if(!f)return;this.camera.position.copy(f.position);this.camera.quaternion.copy(f.quaternion);this.camera.fov=f.fov;this.camera.updateProjectionMatrix();f.bullet.removeFromParent();disposeWorld(f.bullet);this.film=null;this.gun.visible=!this.scoped;if(this.round)this.round.cinematic=false;this.events.cinema?.(false,this.scoped);
 }
 impact(at){const g=group(this.scene,...at.toArray());for(let i=0;i<7;i++){const o=mesh(new T.SphereGeometry(.018,6,4),mat(0xd8c7a6),g);o.userData.velocity=new T.Vector3((Math.random()-.5)*.7,Math.random()*.7,(Math.random()-.5)*.7)}this.effects.push({g,time:.35})}
 enemyCanSee(index){
  const t=this.targets[index];this.scene.updateMatrixWorld(true);const from=t.actor.weapon.getWorldPosition(new T.Vector3()).add(new T.Vector3(0,.04,.25)),to=this.camera.getWorldPosition(new T.Vector3()),direction=to.clone().sub(from);const distance=direction.length();this.enemyRay.set(from,direction.normalize());this.enemyRay.far=distance;
  const blocks=this.enemyRay.intersectObject(this.environment,true).filter(h=>{let o=h.object;while(o){if(o.userData.nonSolid)return false;o=o.parent}return true});return !blocks.length&&!this.round.covered&&this.coverAmount<.75;
 }
 enemyShot(index,clear){
  const a=this.round;if(!a||a.extract)return;const t=this.targets[index];t.actor.flashTime=.09;a.enemyShots++;this.events.audio?.('enemy',T.MathUtils.clamp(t.model.position.x/7,-1,1));
  const from=t.actor.weapon.localToWorld(new T.Vector3(0,.025,.6)),to=this.camera.position.clone();if(a.covered)to.set(this.camera.position.x+.3,this.coverTop-.04,this.coverZ);
  const line=new T.Line(new T.BufferGeometry().setFromPoints([from,to]),new T.LineBasicMaterial({color:0xffd697,transparent:true,opacity:.65}));line.userData.nonSolid=true;this.scene.add(line);this.effects.push({g:line,time:.075,tracer:true});
  if(clear){a.health=Math.max(0,a.health-6);a.damage+=6;a.lastDamage=this.simTime;this.damageFade=.75;this.events.audio?.('hurt',t.model.position.x/7);this.events.damage?.(a.health,index);if(a.health<=0){a.failure='health';this.end(false);return}}
  else this.impact(to);
  this.events.change(a);
 }
 updateCombat(dt,time){
  const a=this.round,enemy=this.targets.filter(t=>!t.friend);
  this.encounter.update(dt,{alive:i=>!!this.round&&enemy[i].alive,canShoot:i=>!!this.round&&this.enemyCanSee(i),shot:(i,clear)=>this.enemyShot(i,clear)});
  if(!this.round)return false;a.alerted=this.encounter.alerted;
  for(const [i,t] of enemy.entries()){
   if(!t.alive)continue;const g=this.encounter.guards[i];
   if(g.phase==='patrol'){
    const phase=this.simTime*.48+t.phase;if(t.role==='patrol'){t.model.position.x=t.origin.x+Math.sin(phase)*1.5;t.model.rotation.y=Math.cos(phase)>0?Math.PI/2:-Math.PI/2;this.cast.update(t.actor,dt,time,'walk')}else this.cast.update(t.actor,dt,time,'idle');
   }else{
    if(g.phase==='move'){if(t.phaseBefore!=='move')t.moveStart=t.model.position.clone();const u=T.MathUtils.clamp(g.elapsed/.9,0,1);t.model.position.lerpVectors(t.moveStart,t.cover,u);const d=t.cover.clone().sub(t.moveStart);t.model.rotation.y=Math.atan2(d.x,d.z);this.cast.update(t.actor,dt,time,'run')}
    else{t.model.rotation.y=Math.atan2(this.camera.position.x-t.model.position.x,this.camera.position.z-t.model.position.z);this.cast.update(t.actor,dt,time,g.phase==='cover'?'crouch':'aim')}
   }
   t.phaseBefore=g.phase;t.tag.position.y=g.phase==='cover'?1.55:2.12;t.tag.visible=g.phase!=='cover';
   for(const m of t.tag.children)if(m.material?.color)m.material.color.setHex(g.phase==='aim'||g.phase==='burst'?0xff7751:0xd7b47b);
  }
  a.aiming=this.encounter.guards.filter((g,i)=>enemy[i].alive&&(g.phase==='aim'||g.phase==='burst')).length;
  if(a.covered&&this.simTime-a.lastDamage>2)a.health=Math.min(100,a.health+dt*6);
  return true;
 }
 end(win){const a=this.round;this.cancelFilm();this.round=null;this.events.end(win,a)}
 update(dt,time){
  if(this.disposed)return;
  if(this.round?.paused)return;this.cooldown=Math.max(0,this.cooldown-dt);this.damageFade=Math.max(0,(this.damageFade||0)-dt);this.flashTime=Math.max(0,(this.flashTime||0)-dt);this.gun.userData.flash.visible=this.flashTime>0;this.recoil*=Math.exp(-dt*14);
  if(!this.loaded)return;const a=this.round;
  if(a?.paused)return;
  if(this.film){this.updateFilm(dt);return}
  this.coverAmount=T.MathUtils.damp(this.coverAmount,a?.covered?1:0,13,dt);if(!a?.extract)this.camera.position.y=this.home.y-this.coverAmount*this.coverDrop;
  this.gun.visible=!this.scoped&&this.coverAmount<.4&&!a?.extract;this.gun.position.z=this.gunHome.z+this.recoil*.7;this.gun.position.y=this.gunHome.y+Math.sin(time*1.3)*.0015;this.gun.rotation.x=a?.reload?Math.sin(a.reload/1.45*Math.PI)*.4:this.recoil*.5;this.gun.rotation.z=a?.reload?-Math.sin(a.reload/1.45*Math.PI)*.4:0;
  animateHeroRifle(this.gun,a?.reload||0,this.cooldown,time,dt);
  const reloadMotion=a?.reload?Math.sin((1-a.reload/1.45)*Math.PI):0;if(this.gun.userData.magazine){this.gun.userData.magazine.position.y=-.14-reloadMotion*.24;this.gun.userData.magazine.rotation.z=reloadMotion*.1;}if(this.gun.userData.supportHand){this.gun.userData.supportHand.position.set(-.035+reloadMotion*.035,-.075-reloadMotion*.3,-.54+reloadMotion*.34);}
  this.simTime=(this.simTime||0)+dt;this.updateAmbient?.(this.simTime);if(this.atmosphere){this.atmosphere.position.x=Math.sin(this.simTime*.12)*.45;this.atmosphere.position.y=Math.sin(this.simTime*.19)*.12;}
  if(!a){this.camera.rotation.set(this.startPitch,Math.sin(time*.1)*.025,0,'YXZ');for(const t of this.targets)this.cast.update(t.actor,dt,time,t.friend&&!this.isCamp?'captive':'idle');return}
  a.left-=dt;if(a.left<=0){this.end(false);return}
  if(this.holding){this.breath=Math.max(0,this.breath-dt);this.breathRecovery=4;if(!this.breath)this.holding=false}else{this.breathRecovery=Math.max(0,this.breathRecovery-dt);if(!this.breathRecovery)this.breath=Math.min(3,this.breath+dt*.6)}
  if(a.reload){a.reload=Math.max(0,a.reload-dt);if(!a.reload){a.ammo=5;this.events.toast('Reloaded');this.events.change(a)}}
  const sway=this.scoped&&!this.holding?.00065:0;this.camera.rotation.set(this.pitch+Math.sin(time*1.7)*sway+this.recoil*.05,this.yaw+Math.sin(time*.9)*sway,0,'YXZ');
  if(!a.extract&&!this.updateCombat(dt,time))return;
  if(a.extract){
   a.extract+=dt;const u=T.MathUtils.clamp(a.extract/7,0,1),friends=this.targets.filter(t=>t.friend);
   for(const f of friends){const previous=f.model.position.clone();if(u<.65)f.model.position.lerpVectors(f.extractStart,f.waypoint,u/.65);else f.model.position.lerpVectors(f.waypoint,f.destination,(u-.65)/.35);const velocity=f.model.position.clone().sub(previous);f.model.rotation.y=Math.atan2(velocity.x,velocity.z);this.cast.update(f.actor,dt,time,'run')}
   const mid=friends[0].model.position.clone().add(friends[1].model.position).multiplyScalar(.5).add(new T.Vector3(0,1,0));this.camera.lookAt(mid);this.yaw=this.camera.rotation.y;this.pitch=this.camera.rotation.x;
   if(u>=1){this.end(true);return}
  }
  for(const t of this.targets){
   t.contact.position.set(t.model.position.x,.034,t.model.position.z);t.contact.visible=t.model.visible;
   if(!t.alive){t.fall+=dt;if(!t.settled){this.cast.update(t.actor,dt,time,'down');const u=T.MathUtils.clamp(t.fall/.8,0,1),ease=u*u*(3-2*u);t.model.rotation.z=ease*1.5;t.model.rotation.x=-ease*.2;if(u===1){t.model.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(t.actor.rig,true);t.model.position.y-=bounds.min.y-.025;t.settled=true;}}if(t.fall>8){t.model.visible=false;t.contact.visible=false}continue}
   if(!a.extract&&t.friend)this.cast.update(t.actor,dt,time,this.isCamp?(this.encounter.alerted?'crouch':'idle'):(this.encounter.alerted?'cower':'captive'));
   if(t.friend)t.tag.position.y=this.encounter.alerted&&!a.extract?1.7:2.12;t.tag.rotation.y=-this.camera.rotation.y;
  }
  for(const e of this.effects){e.time-=dt;if(!e.tracer)for(const o of e.g.children)o.position.addScaledVector(o.userData.velocity,dt)}this.effects=this.effects.filter(e=>{if(e.time<=0){e.g.removeFromParent();disposeWorld(e.g);return false}return true});
  this.scanClock+=dt;if(this.scanClock>.18&&!a.extract){this.scanClock=0;this.scan()}this.events.tick(a);
 }
 dispose(){this.disposed=true;this.cancelFilm();this.cast?.dispose();this.gun.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.dispose()});disposeWorld(this.scene)}
}
