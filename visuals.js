import * as T from 'three';
import {RoundedBoxGeometry} from './vendor/RoundedBoxGeometry.js';
import {surface} from './surfaces.js?v=studio';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
export {T};
const materials=new Map();export function mat(color,roughness=.8,metalness=0){let k=color+':'+roughness+':'+metalness;if(!materials.has(k))materials.set(k,new T.MeshStandardMaterial({color,roughness,metalness}));return materials.get(k)}
export function mesh(g,m,p,x=0,y=0,z=0){const a=new T.Mesh(g,m);a.position.set(x,y,z);a.castShadow=true;a.receiveShadow=true;p.add(a);return a}
export function box(p,w,h,d,c,x=0,y=0,z=0){return mesh(new T.BoxGeometry(w,h,d),typeof c==='object'?c:mat(c),p,x,y,z)}
export function ball(p,x,y,z,sx,sy,sz,c){let m=mesh(new T.SphereGeometry(1,24,16),typeof c==='object'?c:mat(c),p,x,y,z);m.scale.set(sx,sy,sz);return m}
export function cyl(p,rt,rb,h,c,x=0,y=0,z=0,n=12){return mesh(new T.CylinderGeometry(rt,rb,h,n),mat(c),p,x,y,z)}
export function group(p,x=0,y=0,z=0){const g=new T.Group();g.position.set(x,y,z);p.add(g);return g}
export function seed(n){return ()=>{n|=0;n=n+0x6D2B79F5|0;let t=Math.imul(n^n>>>15,1|n);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
export function terrainTexture(base,accent){let c=document.createElement('canvas');c.width=c.height=256;let x=c.getContext('2d'),r=seed(123);x.fillStyle=base;x.fillRect(0,0,256,256);for(let i=0;i<18000;i++){x.fillStyle=i%2?accent:'#ffffff18';x.fillRect(r()*256,r()*256,1+r()*3,1+r()*3)}const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(7,7);t.colorSpace=T.SRGBColorSpace;return t}
export function lightScene(scene,sky=0xb8d6d4,sunColor=0xffe7bd){scene.background=new T.Color(sky);scene.add(new T.HemisphereLight(0xe5f2ff,0x5d503a,2));let sun=new T.DirectionalLight(sunColor,3);sun.position.set(-15,30,18);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-30,right:30,top:30,bottom:-30,near:1,far:100});sun.shadow.normalBias=.04;sun.shadow.bias=-.0002;scene.add(sun);return sun}
export function tree(p,x,z,scale=1,apple=false){let g=group(p,x,0,z);g.scale.setScalar(scale);cyl(g,.18,.3,2.7,0x745135,0,1.3,0);for(let i=0;i<5;i++){let a=i*2.4;ball(g,Math.sin(a)*.8,2.6+(i%2)*.6,Math.cos(a)*.8,1.2,1.3,1.1,i%2?0x658c32:0x3e772d)}if(apple)for(let i=0;i<9;i++){let a=i*2.4;ball(g,Math.sin(a)*1.3,2.4+(i%3)*.4,Math.cos(a)*1.3,.15,.17,.15,0xd95030)}return g}
export function fence(p,x,z,w,d){let g=group(p,x,0,z);for(let side=0;side<4;side++){let len=side%2?d:w,n=Math.ceil(len/1.5);for(let i=0;i<=n;i++){let a=-len/2+len*i/n,px=side%2?(side===1?w/2:-w/2):a,pz=side%2?a:(side===0?-d/2:d/2);box(g,.16,1.35,.16,0xb69b6a,px,.65,pz)}for(let y of [.55,1]){let b=box(g,side%2?.12:len,.14,side%2?len:.12,0xd1b784,side%2?(side===1?w/2:-w/2):0,y,side%2?0:(side===0?-d/2:d/2))}}return g}
export function barn(p,x,z,scale=1){let g=group(p,x,0,z);g.scale.setScalar(scale);box(g,6,3.6,5,0xa7784b,0,1.8,0);for(let x=-3;x<=3;x+=.45)box(g,.06,3.6,5.04,0xd4b580,x,1.8,0);for(let z of [-2.55,2.55]){for(let x of [-3,3])box(g,.22,4,.22,0xe4d0a5,x,2,z);box(g,6.3,.2,.2,0xe4d0a5,0,3.6,z)}for(let x of [-1.58,1.58]){const roof=box(g,3.8,.25,5.8,0x54297c,x,4.35,0);roof.rotation.z=x<0?.5:-.5;for(let z=-2.7;z<=2.7;z+=.42){let slat=box(g,3.9,.07,.055,0x8b54b5,x,4.52,z);slat.rotation.z=roof.rotation.z}}box(g,2.2,2.7,.13,0x53352b,0,1.35,2.55);for(let x of [-1.2,1.2])box(g,.13,2.9,.25,0xf0d9a5,x,1.45,2.7);box(g,2.5,.16,.25,0xf0d9a5,0,2.9,2.7);for(let a of [-.65,.65]){let b=box(g,.13,3.3,.08,0xd8c498,0,1.5,2.67);b.rotation.z=a}for(let x of [-2.1,2.1]){box(g,.8,.9,.13,0xf7cb68,x,2.5,2.55);box(g,.07,1,.17,0x644133,x,2.5,2.65);box(g,.9,.07,.17,0x644133,x,2.5,2.65)}return g}
export function cow(p,x,z,scale=1){let g=group(p,x,0,z);g.scale.setScalar(scale);ball(g,0,1.1,0,.67,.62,1.15,0xf3e9d6);ball(g,.5,1.2,.2,.2,.45,.6,0x392d29);ball(g,-.35,1.48,-.45,.36,.22,.4,0x392d29);let head=group(g,0,1.5,1);ball(head,0,0,0,.42,.46,.5,0xf3e9d6);ball(head,0,-.2,.43,.4,.24,.23,0xcc9c88);for(let s of [-1,1]){ball(head,s*.39,.2,0,.25,.12,.13,0xf1e7d0);ball(head,s*.27,.08,.4,.055,.065,.04,0x201b1a);cyl(head,0,.065,.3,0xd1b682,s*.22,.53,0)}let legs=[];for(let x of [-.4,.4])for(let z of [-.65,.65]){let leg=group(g,x,.8,z);cyl(leg,.1,.08,.8,0xeee0cb,0,-.35,0);box(leg,.2,.13,.25,0x45352b,0,-.75,.03);legs.push(leg)}let tail=cyl(g,.035,.03,.8,0xd8cbbb,0,.8,-1.1);tail.rotation.x=-.5;g.userData={legs,head,origin:new T.Vector3(x,0,z)};return g}
export function chicken(p,x,z){let g=group(p,x,0,z);ball(g,0,.45,0,.32,.32,.45,0xead6a0);ball(g,0,.8,.25,.2,.24,.2,0xf4e4ba);let beak=mesh(new T.ConeGeometry(.08,.23,8),mat(0xdd9231),g,0,.77,.47);beak.rotation.x=Math.PI/2;ball(g,0,1.02,.25,.07,.12,.12,0xa32f2e);for(let s of [-1,1]){ball(g,s*.17,.85,.35,.025,.03,.025,0x201b1b);cyl(g,.025,.025,.25,0xba7c35,s*.13,.12,0)}return g}
function capsule(p,r,h,c,x=0,y=0,z=0){return mesh(new T.CapsuleGeometry(r,h,6,16),typeof c==='object'?c:mat(c),p,x,y,z)}
export function bevel(p,w,h,d,c,x=0,y=0,z=0,r=.035){return mesh(new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/3,h/3,d/3)),typeof c==='object'?c:mat(c),p,x,y,z)}
function rod(p,a,b,r,c){const from=new T.Vector3(...a),to=new T.Vector3(...b),mid=from.clone().add(to).multiplyScalar(.5),m=mesh(new T.CylinderGeometry(r,r,from.distanceTo(to),12),typeof c==='object'?c:mat(c),p,...mid.toArray());m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),to.sub(from).normalize());return m}
export function person(p,x,z,color,friend=false){
 const g=group(p,x,0,z),legs=[],arms=[];
 // Shared within one character; all maps are owned and disposed with its scene.
 const uniform=new T.MeshStandardMaterial({color:friend?0x658b88:0xe4d7af,...surface(friend?'fabric':'camo',64),roughness:.94});
 uniform.normalScale.setScalar(.35);const webbing=new T.MeshStandardMaterial({color:friend?0x355052:0x4b503d,roughness:.92});webbing.userData.surface='fabric';const armor=mat(0x292f2b,.68,.12),skin=mat(0xa5886e,.9);
 const hips=group(g,0,1.02,0);bevel(hips,.49,.23,.3,uniform,0,0,0,.08);
 for(const side of [-1,1]){
  const leg=group(hips,side*.145,-.04,0);
  capsule(leg,.12,.28,uniform,0,-.23,0);capsule(leg,.095,.24,uniform,0,-.65,.025);
  bevel(leg,.18,.21,.075,armor,0,-.46,.12,.04);bevel(leg,.18,.13,.1,webbing,side*.11,-.22,.015,.03);
  bevel(leg,.19,.17,.31,armor,0,-.88,.07,.05);bevel(leg,.2,.04,.32,0x161c1a,0,-.98,.08,.01);legs.push(leg);
 }
 const torso=bevel(g,.52,.57,.32,uniform,0,1.43,0,.1);bevel(g,.45,.47,.14,webbing,0,1.46,.19,.065);
 bevel(g,.4,.5,.2,webbing,0,1.4,-.24,.07); // compact rucksack
 for(const side of [-1,1]){bevel(g,.065,.48,.045,armor,side*.18,1.49,.28,.015);bevel(g,.1,.23,.08,webbing,side*.24,1.39,.08,.02)}
 for(let i=-1;i<=1;i++){bevel(g,.125,.19,.1,webbing,i*.14,1.29,.29,.018);box(g,.1,.015,.015,0x8e9175,i*.14,1.37,.35)}
 for(let y=1.43;y<1.64;y+=.06)box(g,.29,.014,.014,0x313e31,0,y,.273);
 const belt=bevel(g,.49,.065,.35,armor,0,1.12,0,.025);bevel(g,.06,.055,.035,0x9b9477,0,1.12,.195,.01);
 const head=group(g,0,1.99,0);capsule(head,.075,.1,skin,0,-.23,0);
 ball(head,0,0,0,.155,.215,.155,skin);bevel(head,.19,.13,.08,webbing,0,-.07,.11,.045);
 const helmet=mesh(new T.SphereGeometry(.214,24,16,0,Math.PI*2,0,Math.PI*.6),webbing,head,0,.07,-.02);helmet.scale.y=.92;
 const rim=mesh(new T.TorusGeometry(.2,.019,8,32),armor,head,0,.025,-.02);rim.rotation.x=Math.PI/2;
 bevel(head,.29,.08,.04,armor,0,.035,.155,.02);bevel(head,.125,.058,.024,new T.MeshStandardMaterial({color:0x738e93,metalness:.75,roughness:.12}),-.075,.035,.18,.01);bevel(head,.125,.058,.024,new T.MeshStandardMaterial({color:0x738e93,metalness:.75,roughness:.12}),.075,.035,.18,.01);
 for(const side of [-1,1]){ball(head,side*.19,.015,0,.035,.075,.065,armor);rod(head,[side*.12,-.18,.07],[side*.18,.03,-.03],.012,armor);
  const arm=group(g,side*.31,1.65,0);capsule(arm,.098,.21,uniform,side*.025,-.16,0);capsule(arm,.08,.18,uniform,side*.02,-.38,.15).rotation.x=-.7;
  bevel(arm,.12,.09,.08,armor,side*.04,-.27,.015,.025);ball(arm,side*.02,-.49,.27,.075,.083,.11,armor);arms.push(arm);
 }
 bevel(g,.13,.075,.02,friend?0x93e3b9:0xbf5b45,.18,1.66,.195,.008);
 if(friend){box(g,.1,.028,.025,0xc9f1de,0,1.58,.28);box(g,.028,.1,.025,0xc9f1de,0,1.58,.28)}else{
  const weapon=group(g,.14,1.08,.36);weapon.rotation.y=-.45;
  bevel(weapon,.07,.11,.43,armor,0,0,0,.012);rod(weapon,[0,.01,.2],[0,.01,.59],.018,armor);bevel(weapon,.06,.15,.09,0x242b27,0,-.11,.02,.01).rotation.x=-.2;bevel(weapon,.065,.1,.18,webbing,0,-.01,-.3,.02);
 }
 g.userData={legs,arms,head,origin:new T.Vector3(x,0,z),friend};for(const part of [...legs,...arms,head]){mergeStatic(part);part.userData.dynamic=true}mergeStatic(g);return g;
}
export function marker(p,color){let g=group(p,0,2.65,0);const diamond=mesh(new T.OctahedronGeometry(.105),new T.MeshBasicMaterial({color,transparent:true,opacity:.88}),g);const ring=mesh(new T.TorusGeometry(.21,.013,6,24),new T.MeshBasicMaterial({color,transparent:true,opacity:.55}),g);g.userData.spin=diamond;return g}
export function rifle(p){
 const g=group(p,.26,-.24,-.55);g.name='SEVEN M77 precision rifle';
 const steel=new T.MeshStandardMaterial({color:0x323b40,metalness:.88,roughness:.3,...surface('metal')});steel.normalScale.setScalar(.12);
 const bronze=new T.MeshStandardMaterial({color:0x78817b,metalness:.52,roughness:.41,...surface('metal')});bronze.normalScale.setScalar(.12);
 const rubber=new T.MeshStandardMaterial({color:0x242b29,roughness:.92,...surface('fabric',64)});
 const sleeve=new T.MeshStandardMaterial({color:0xc4bb9e,roughness:.93,...surface('camo',64)});
 const pipe=(radius,length,z,m=steel,y=.015)=>{const o=mesh(new T.CylinderGeometry(radius,radius,length,32),m,g,0,y,z);o.rotation.x=Math.PI/2;return o};
 // Chassis, adjustable stock, cheek pad, rubber shoulder pad and fore-end.
 bevel(g,.105,.135,.48,bronze,0,-.01,-.19,.018);bevel(g,.094,.098,.38,steel,0,.045,-.19,.016);
 bevel(g,.09,.12,.3,bronze,0,-.025,.2,.025);bevel(g,.085,.05,.21,rubber,0,.055,.19,.02);bevel(g,.108,.18,.045,rubber,0,-.045,.375,.02);
 bevel(g,.1,.11,.42,bronze,0,-.015,-.61,.016);for(let z=-.79;z<-.4;z+=.065){bevel(g,.109,.028,.037,steel,0,-.012,z,.006);bevel(g,.114,.012,.042,bronze,0,.065,z,.004)}
 pipe(.021,.58,-1.05);pipe(.036,.22,-1.43);for(let z=-1.51;z<-1.34;z+=.035)pipe(.037,.009,z,bronze);
 for(let z=-.43;z<.07;z+=.025)bevel(g,.1,.018,.012,steel,0,.115,z,.003);
 bevel(g,.062,.16,.085,rubber,0,-.14,.025,.018).rotation.x=-.25;const magazine=bevel(g,.068,.17,.105,steel,0,-.14,-.2,.012);magazine.rotation.x=-.08;magazine.userData.dynamic=true;g.userData.magazine=magazine;
 // Mechanical bolt, receiver screws and an open trigger guard.
 rod(g,[.055,.075,-.07],[.125,.055,-.02],.012,steel);ball(g,.13,.047,-.015,.024,.023,.024,steel);
 for(let z of [-.35,-.17,.04]){const screw=mesh(new T.CylinderGeometry(.01,.01,.006,12),steel,g,.056,-.015,z);screw.rotation.z=Math.PI/2}
 const guard=mesh(new T.TorusGeometry(.043,.006,8,24),steel,g,0,-.12,.035);guard.rotation.y=Math.PI/2;guard.scale.y=1.3;
 // 3D 3x optical assembly with lens coatings, turrets and mount rings.
 for(const z of [-.36,-.12]){bevel(g,.07,.06,.045,steel,0,.15,z,.008);const ring=mesh(new T.TorusGeometry(.048,.008,10,32),bronze,g,0,.21,z)}
 pipe(.043,.36,-.24,steel,.21);pipe(.062,.14,-.49,steel,.21);pipe(.054,.1,-.025,rubber,.21);
 for(const z of [-.57,.025]){const ring=mesh(new T.TorusGeometry(z<0?.062:.054,.006,10,36),bronze,g,0,.21,z)}
 const lens=mesh(new T.CircleGeometry(.048,40),new T.MeshPhysicalMaterial({color:0x4b8ca4,metalness:.6,roughness:.04,clearcoat:1,clearcoatRoughness:.04}),g,0,.21,.031);lens.name='Optical lens';
 mesh(new T.CylinderGeometry(.032,.032,.044,24),rubber,g,0,.271,-.23);const turret=mesh(new T.CylinderGeometry(.029,.029,.04,24),rubber,g,.061,.21,-.23);turret.rotation.z=Math.PI/2;
 for(let i=0;i<10;i++){const angle=i/10*Math.PI*2;box(g,.003,.014,.003,0xe2d9bd,Math.cos(angle)*.031,.278,-.23+Math.sin(angle)*.031)}
 // Gloved hands and sleeves replace floating blobs; they follow recoil/reload.
 const right=group(g,.065,-.12,.055);ball(right,0,0,0,.06,.065,.09,rubber);for(let i=0;i<4;i++)capsule(right,.013,.045,rubber,-.025+i*.018,-.04,-.015).rotation.x=1.15;
 rod(g,[.085,-.14,.12],[.19,-.3,.48],.068,sleeve);bevel(g,.12,.06,.08,rubber,.09,-.145,.17,.018);
 const left=group(g,-.035,-.075,-.54);left.userData.dynamic=true;g.userData.supportHand=left;ball(left,0,0,0,.068,.047,.095,rubber);for(let i=0;i<4;i++)capsule(left,.012,.04,rubber,-.035+i*.019,.025,.015).rotation.x=1.3;
 rod(left,[-.04,-.025,.06],[-.165,-.195,.57],.07,sleeve);mergeStatic(left);
 const flash=group(g,0,.015,-1.57);const flare=mesh(new T.ConeGeometry(.07,.28,8),new T.MeshBasicMaterial({color:0xffd181,transparent:true,opacity:.8,depthWrite:false}),flash);flare.rotation.x=-Math.PI/2;flash.visible=false;flash.userData.dynamic=true;g.userData.flash=flash;
 mergeStatic(g);return g;
}

// Merge static pieces of a rig by material; articulated limbs stay independent.
export function mergeStatic(root){
 root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert(),sets=new Map();
 root.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||o.isSkinnedMesh||o.children.length||Array.isArray(o.material))return;let a=o;while(a&&a!==root){if(a.userData.dynamic)return;a=a.parent}const k=o.material.uuid+o.castShadow+o.receiveShadow;let list=sets.get(k);if(!list)sets.set(k,list=[]);list.push(o)});
 for(const list of sets.values()){if(list.length<2)continue;const geos=list.map(o=>{const geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geo.applyMatrix4(inverse.clone().multiply(o.matrixWorld));return geo});const merged=mergeGeometries(geos);if(merged){const m=new T.Mesh(merged,list[0].material);m.castShadow=list[0].castShadow;m.receiveShadow=list[0].receiveShadow;root.add(m);for(const old of list){old.removeFromParent();old.geometry.dispose()}}geos.forEach(g=>g.dispose())}
}
// Batch stationary scenery by geometry/material; animated and interactive groups stay separate.
export function batchScenery(root){
 root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert(),groups=new Map();
 root.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||o.children.length)return;let a=o;while(a&&a!==root){if(a.userData.pick||a.userData.dynamic||a.userData.target!==undefined)return;a=a.parent}if(Array.isArray(o.material))return;const key=o.geometry.type+JSON.stringify(o.geometry.parameters)+o.material.uuid+o.castShadow+o.receiveShadow;let list=groups.get(key);if(!list)groups.set(key,list=[]);list.push(o)});
 let removed=0;for(const list of groups.values()){if(list.length<3)continue;const first=list[0],instances=new T.InstancedMesh(first.geometry,first.material,list.length);instances.castShadow=first.castShadow;instances.receiveShadow=first.receiveShadow;const disposed=new Set();list.forEach((o,i)=>{instances.setMatrixAt(i,inverse.clone().multiply(o.matrixWorld));o.removeFromParent();if(o.geometry!==first.geometry&&!disposed.has(o.geometry)){o.geometry.dispose();disposed.add(o.geometry)}});instances.instanceMatrix.needsUpdate=true;instances.computeBoundingSphere();root.add(instances);removed+=list.length-1}return removed;
}
export function disposeWorld(scene){
 const geometries=new Set(),textures=new Set(),localMaterials=new Set(),shared=new Set(materials.values());
 scene.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.geometry)geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[]){if(!shared.has(m))localMaterials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v)}if(o.isLight&&o.shadow)o.shadow.dispose()});
 if(scene.background?.isTexture)textures.add(scene.background);if(scene.environment?.isTexture)textures.add(scene.environment);for(const g of geometries)g.dispose();for(const t of textures)t.dispose();for(const m of localMaterials)m.dispose();
}
