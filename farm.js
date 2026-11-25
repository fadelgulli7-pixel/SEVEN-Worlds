import {T,mat,mesh,box,bevel,ball,cyl,group,seed,terrainTexture,lightScene,fence,cow,chicken,batchScenery,mergeStatic,disposeWorld} from './visuals.js?v=field-cast-2';
import {OrbitControls} from './vendor/OrbitControls.js';
import {environmentLight,surface} from './surfaces.js?v=field-cast-2';
import {farmNature} from './presentation.js?v=field-cast-2';
import {farmBarn,farmGround,goat,farmWorker,farmTruck,greenhouse} from './farm-art.js?v=field-cast-2';
import {adoptFarm,SPECIES} from './farm-business.js?v=field-cast-2';
export const CROPS=[{name:'Wheat',cost:4,value:8,seconds:14},{name:'Carrot',cost:7,value:14,seconds:22},{name:'Tomato',cost:10,value:20,seconds:30}];
export class Farm{
 constructor(renderer,state,onPick){
  this.scene=new T.Scene();this.scene.background=new T.Color(0xc9dcad);this.scene.fog=new T.Fog(0xc9dcad,100,180);this.state=adoptFarm(state);this.onPick=onPick;
  this.sun=lightScene(this.scene,0xc9dcad,0xffedc4);this.sun.intensity=2.7;this.sun.position.set(-20,35,22);this.scene.children.find(x=>x.isHemisphereLight).intensity=1.65;environmentLight(this.scene,'farm');
  this.camera=new T.OrthographicCamera(-22,22,30,-30,.1,200);this.camera.aspect=1;
  this.controls=new OrbitControls(this.camera,renderer.domElement);this.controls.enableDamping=true;this.controls.minZoom=.7;this.controls.maxZoom=2.3;this.controls.minPolarAngle=.35;this.controls.maxPolarAngle=.85;this.controls.enablePan=true;this.controls.screenSpacePanning=false;this.controls.target.set(-1,0,0);this.home();
  this.animals=[];this.chickens=[];this.goats=[];this.workers=[];this.plots=[];this.ray=new T.Raycaster();this.lastRefresh=0;this.r=seed(744);
  mesh(new T.PlaneGeometry(300,300),mat(0xa7bf76),this.scene,0,-1.5,0).rotation.x=-Math.PI/2;farmGround(this.scene,state.land);
  greenhouse(this.scene,-14,-12);farmBarn(this.scene,-8,-8,.93);farmBarn(this.scene,11,-1.6,.38);
  const silo=group(this.scene,-13.6,-.05,-9);cyl(silo,1,1,4.5,0xc7c7ae,0,2.25,0,32);mesh(new T.ConeGeometry(1.13,1.2,32),mat(0x77518d),silo,0,5.1,0);for(let y=.5;y<4.5;y+=.65)cyl(silo,1.02,1.02,.05,0x999f88,0,y,0,32);
  fence(this.scene,8,-8,12,7);fence(this.scene,9,5.4,11,5.5);
  for(let i=0;i<state.plots.length;i++){
   const x=-11+(i%3)*3.6,z=2+Math.floor(i/3)*4.3,g=group(this.scene,x,0,z);
   bevel(g,3.2,.2,3.65,0x835837,0,.18,0,.12);bevel(g,3,.06,3.45,0x60422e,0,.3,0,.08);
   for(let xx=-1.2;xx<1.4;xx+=.4)box(g,.08,.04,3.15,0x90613f,xx,.35,0);
   for(const zz of [-1.86,1.86])bevel(g,3.45,.22,.15,0xd2b07b,0,.25,zz,.04);for(const xx of [-1.68,1.68])bevel(g,.15,.22,3.82,0xd2b07b,xx,.25,0,.04);
   mergeStatic(g);g.userData.pick={kind:'plot',index:i};this.plots.push({group:g,crop:null,stamp:''});
  }
  if(state.land<4){const z=2+(2+state.land)*4.3,g=group(this.scene,-7.4,0,z);g.userData.pick={kind:'land'};box(g,10.4,.06,3.75,0xb6bd77,0,.04,0);for(let x of [-4.8,4.8]){cyl(g,.055,.07,1.1,0xb29b6a,x,.55,0);const flag=box(g,.5,.33,.035,0xcfac65,x+.24,1.05,0)}this.landMarker=g}
  this.water=mesh(new T.CylinderGeometry(2,2,.09,48),new T.MeshStandardMaterial({color:0x50a6a2,roughness:.11,metalness:.38}),this.scene,11,.04,12);const normals=surface('stone');this.water.material.normalMap=normals.normalMap;this.water.material.normalScale.set(.14,.14);normals.map.dispose();normals.roughnessMap.dispose();for(let i=0;i<20;i++){const a=i/20*Math.PI*2;ball(this.scene,11+Math.cos(a)*2.1,.17,12+Math.sin(a)*2.1,.28,.17,.24,0xb7b59a)}
  // Flowered arch and the vehicle gate make the delivery route visible.
  for(const x of [-1,3]){box(this.scene,.24,2.8,.24,0xd4bb8b,x,1.4,10.4);ball(this.scene,x,2.9,10.4,.23,.2,.23,0xe8c78e)}box(this.scene,4.4,.22,.3,0x80589d,1,2.8,10.4);
  this.truck=farmTruck(this.scene);this.truck.userData.pick={kind:'truck'};this.nature=farmNature(this.scene,state.land);
  this.herdGroup=group(this.scene);this.herdGroup.userData.dynamic=true;this.workerGroup=group(this.scene);this.workerGroup.userData.dynamic=true;this.herdStamp='';this.workerStamp='';this.syncActors();
  batchScenery(this.scene);this.refresh();this.selection=mesh(new T.RingGeometry(1.65,1.73,48),new T.MeshBasicMaterial({color:0xffedac,side:T.DoubleSide,transparent:true,opacity:.85,depthWrite:false}),this.scene);this.selection.rotation.x=-Math.PI/2;this.selection.visible=false;this.selection.castShadow=false;
 }
 home(){const center=this.state.land*1.9;this.camera.position.set(20,40,32+center);this.controls.target.set(-1,0,center);this.camera.zoom=1;this.camera.updateProjectionMatrix();this.controls.update()}
 resize(w,h){this.camera.aspect=w/h;const width=43+this.state.land*.9,half=width/2;this.camera.left=-half;this.camera.right=half;this.camera.top=half/(w/h);this.camera.bottom=-this.camera.top;this.camera.updateProjectionMatrix()}
 syncActors(){
  const sig=this.state.herd.map(x=>x.id).join(',');if(sig!==this.herdStamp){disposeWorld(this.herdGroup);this.herdGroup.clear();this.animals=[];this.chickens=[];this.goats=[];const counts={cow:0,chicken:0,goat:0};for(const a of this.state.herd){const i=counts[a.kind]++,cols=a.kind==='chicken'?6:4;let x,z,m;if(a.kind==='cow'){x=4.5+i%cols*2.35;z=-9.8+Math.floor(i/cols)*2.2;m=cow(this.herdGroup,x,z,.72);this.animals.push(m)}else if(a.kind==='chicken'){x=7+i%cols*1.1;z=-.7+Math.floor(i/cols)*.65;m=chicken(this.herdGroup,x,z);m.userData.origin=m.position.clone();this.chickens.push(m)}else{x=5.5+i%cols*2;z=4.2+Math.floor(i/cols)*1.8;m=goat(this.herdGroup,x,z);this.goats.push(m)}for(const part of [...(m.userData.legs||[]),...(m.userData.head?[m.userData.head]:[])]){mergeStatic(part);part.userData.dynamic=true}mergeStatic(m);m.userData.pick={kind:'animal',id:a.id,animal:a.kind};m.userData.animalId=a.id;const status=mesh(new T.SphereGeometry(.08,10,8),new T.MeshBasicMaterial({color:0xe9c574}),m,0,a.kind==='chicken'?1.35:2.2,0);status.castShadow=false;m.userData.status=status}this.herdStamp=sig}
  const ws=this.state.workers.map(w=>w.id+':'+w.role).join(',');if(ws!==this.workerStamp){disposeWorld(this.workerGroup);this.workerGroup.clear();this.workers=this.state.workers.map((w,i)=>{const m=farmWorker(this.workerGroup,i);m.userData.worker=w;return m});this.workerStamp=ws}
 }
 select(p){if(!p){this.selection.visible=false;return}const obj=p.kind==='plot'?this.plots[p.index]?.group:p.kind==='animal'?[...this.animals,...this.chickens,...this.goats].find(a=>a.userData.animalId===p.id):p.kind==='land'?this.landMarker:this.truck;if(!obj)return;this.selection.position.set(obj.position.x,.39,obj.position.z);this.selection.scale.setScalar(p.kind==='plot'?1:.7);this.selection.visible=true}
 pick(x,y){this.ray.setFromCamera(new T.Vector2(x,y),this.camera);for(const h of this.ray.intersectObjects(this.scene.children,true)){let o=h.object;while(o){if(o.userData.pick){this.onPick(o.userData.pick);return}o=o.parent}}}
makeCrop(type){const g=new T.Group();for(let x of [-.95,0,.95])for(let z of [-1.3,-.4,.5,1.4]){let p=group(g,x,0,z);if(type===0){for(let a of [-.12,.12]){cyl(p,.018,.025,.9,0x9e9d37,a,.5,0,5);let head=ball(p,a,1,0,.08,.23,.07,0xe2bd52);head.rotation.z=a}}else if(type===1){cyl(p,.07,.15,.32,0xd17b31,0,.23,0,8);for(let a of [-.6,0,.6]){let leaf=ball(p,a*.2,.55,0,.07,.28,.05,0x538f38);leaf.rotation.z=a}}else{cyl(p,.02,.03,1.2,0x7c6a42,0,.6,0,6);for(let i=0;i<3;i++){ball(p,Math.sin(i*3)*.2,.4+i*.25,Math.cos(i*3)*.14,.25,.18,.25,0x508239);ball(p,.16,.45+i*.23,.2,.12,.12,.12,0xdd5236)}}}batchScenery(g);return g}
 refresh(){this.syncActors();this.plots.forEach((p,i)=>{const s=this.state.plots[i],stamp=s?s.crop+':'+s.end:'empty';if(stamp!==p.stamp){if(p.crop){p.group.remove(p.crop);disposeWorld(p.crop)}p.crop=s?this.makeCrop(s.crop):null;if(p.crop){p.crop.position.y=.33;p.group.add(p.crop)}p.stamp=stamp}if(s&&p.crop){const duration=CROPS[s.crop].seconds*1000*(1-this.state.upgrade*.1),growth=Math.max(.1,Math.min(1,1-(s.end-Date.now())/duration));p.crop.scale.y=.2+growth*.8}})}
 update(dt,t){
  this.controls.update();this.nature.update(dt,t);this.water.material.normalMap.offset.set(t*.012,t*.007);if(this.selection.visible)this.selection.material.opacity=.7+Math.sin(t*3)*.15;
  if(t-this.lastRefresh>.4){this.refresh();this.lastRefresh=t}
  for(const [i,a] of [...this.animals,...this.chickens,...this.goats].entries()){const v=a.userData,o=v.origin,record=this.state.herd.find(x=>x.id===v.animalId),feeding=record?.readyAt>Date.now();a.position.x=o.x+Math.sin(t*.23+i)*.22;a.position.z=o.z+Math.cos(t*.23+i)*.2;a.rotation.y=Math.sin(t*.2+i)*.6;v.legs?.forEach((l,j)=>l.rotation.x=Math.sin(t*3+j*Math.PI)*.09);if(v.head&&v.head!==a)v.head.rotation.x=feeding?.15+Math.sin(t*3)*.1:Math.sin(t)*.04;v.status.visible=!!record?.readyAt&&record.readyAt<=Date.now()}
  for(const [i,m] of this.workers.entries()){if(!this.state.workerEnabled)continue;const role=m.userData.worker.role;let x=role==='ranch'?6:role==='plant'?-4:-10,z=role==='ranch'?-6:3;m.position.set(x+Math.sin(t*.5+i)*1.4,0,z+Math.cos(t*.4+i)*1.8);m.rotation.y=t*.4+i;m.userData.legs.forEach((l,j)=>l.rotation.x=this.state.workerEnabled?Math.sin(t*7+j*Math.PI)*.25:0)}
  const shipment=this.state.shipment;if(shipment){const u=Math.max(0,Math.min(1,(Date.now()-shipment.startedAt)/8000));this.truck.position.z=u<.65?12+Math.max(0,(u-.1)/.55)*38:12+(1-u)/.35*38;this.truck.rotation.y=u<.65?0:Math.PI}else{this.truck.position.z=12;this.truck.rotation.y=0}
 }
 setQuality(q){const n=q==='high'?2048:1024;if(this.sun.shadow.mapSize.x!==n){this.sun.shadow.map?.dispose();this.sun.shadow.map=null;this.sun.shadow.mapSize.set(n,n)}}
 dispose(){this.controls.dispose();disposeWorld(this.scene)}
}
