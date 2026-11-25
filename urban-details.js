import {T,mesh,box,group,mat,seed,mergeStatic} from './visuals.js?v=field-cast-2';
import {HDRLoader} from './vendor/HDRLoader.js';

let lightPromise;
export function loadStreetLight(){
 lightPromise??=Promise.all(['urban_street_01','kloofendal_48d_partly_cloudy_puresky'].map(name=>new HDRLoader().loadAsync(new URL(`./assets/${name}_1k.hdr`,import.meta.url).href).then(t=>{t.mapping=T.EquirectangularReflectionMapping;return t}))).then(([light,background])=>({light,background})).catch(e=>{lightPromise=null;throw e});return lightPromise;
}
function canvasMap(draw,w=256,h=w){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t}
export function contactMaterial(){
 const map=canvasMap((c,w,h)=>{const g=c.createRadialGradient(w/2,h/2,4,w/2,h/2,w/2);g.addColorStop(0,'rgba(7,12,14,.65)');g.addColorStop(.3,'rgba(7,12,14,.32)');g.addColorStop(1,'rgba(7,12,14,0)');c.fillStyle=g;c.fillRect(0,0,w,h)},64);
 return new T.MeshBasicMaterial({map,transparent:true,depthWrite:false,opacity:.62,polygonOffset:true,polygonOffsetFactor:-1});
}
export function contactShadow(parent,material,x,z,w=1.1,d=.7){const o=mesh(new T.PlaneGeometry(w,d),material,parent,x,.034,z);o.rotation.x=-Math.PI/2;o.castShadow=false;o.receiveShadow=false;o.userData.nonSolid=true;return o}

// Small scale clues: worn paint, drainage, paper, cables and edge vegetation.
// Decorative meshes remain outside the collision hierarchy and are batched.
export function dressStreet(scene){
 const root=group(scene);root.name='Street wear and service details';root.userData.nonSolid=true;const r=seed(12779),iron=mat(0x2e3435,.76,.45),stone=mat(0x8a8578),shadow=contactMaterial();
 const paint=canvasMap((c,w,h)=>{c.fillStyle='#cfc5a2';c.fillRect(0,0,w,h);c.globalCompositeOperation='destination-out';for(let i=0;i<3600;i++){c.globalAlpha=.2+r()*.8;c.fillRect(r()*w,r()*h,.3+r()*3,.2+r()*4)}},128,256);
 const worn=new T.MeshStandardMaterial({map:paint,transparent:true,alphaTest:.35,roughness:.96,polygonOffset:true,polygonOffsetFactor:-2});
 for(let z=14;z>-35;z-=6){const o=mesh(new T.PlaneGeometry(.11,1.85),worn,root,0,.031,z);o.rotation.x=-Math.PI/2;o.castShadow=false;}
 for(const s of [-1,1]){
  // Thin sidewalk joints and dark drain recesses are at real-world scale.
  for(let z=15;z>-48;z-=1.25){box(root,2.65,.006,.018,0x6e6a60,s*9.55,.153,z);box(root,.018,.006,1.22,0x817c70,s*9.3,.154,z+.6)}
  for(const z of [1,-13,-30]){box(root,.6,.015,.86,0x1f292b,s*7.73,.025,z);for(let i=0;i<9;i++)box(root,.55,.02,.025,iron,s*7.73,.036,z-.36+i*.09);contactShadow(root,shadow,s*7.73,z,1.3,1.3)}
  for(let z=12;z>-45;z-=9){const joint=mesh(new T.PlaneGeometry(.018,2+r()*2),new T.MeshBasicMaterial({color:0x2c3030,transparent:true,opacity:.45}),root,s*(6.3+r()),.016,z);joint.rotation.set(-Math.PI/2,0,r()*.7);joint.castShadow=false;}
  // Crumpled paper, fallen leaves and pebbles gather along the gutters.
  for(let i=0;i<70;i++){const z=14-r()*61,x=s*(7.1+r()*.8);const paper=mesh(new T.PlaneGeometry(.06+r()*.12,.08+r()*.14),mat(i%4?0x8b6941:0xc2bca9),root,x,.029+r()*.015,z);paper.rotation.set(-Math.PI/2+r()*.2,r()*.2,r()*6.28);paper.castShadow=false;}
  for(let i=0;i<12;i++){const z=10-i*4.7,x=s*8.17;for(let j=0;j<5;j++){const blade=mesh(new T.PlaneGeometry(.018,.1+r()*.14),mat(0x677345),root,x+(r()-.5)*.2,.22,z+r()*.2);blade.rotation.set(r()*.5,r()*6.2,.3-r()*.6);blade.material.side=T.DoubleSide;blade.castShadow=false;}}
  for(let z of [-3,-23]){
   const b=group(root,s*10.4,0,z);box(b,.75,.95,.65,0x42534b,0,.64,0);box(b,.81,.09,.69,iron,0,1.16,0);for(let x of [-.28,.28]){const tyre=mesh(new T.CylinderGeometry(.1,.1,.07,12),iron,b,x,.2,0);tyre.rotation.z=Math.PI/2}contactShadow(root,shadow,s*10.4,z,1.5,1.4);
  }
 }
 // Manhole with concentric ribs and bolt heads.
 const cover=mesh(new T.CylinderGeometry(.48,.48,.018,40),iron,root,-2.1,.018,-3.7);for(let i=0;i<5;i++){const ring=mesh(new T.TorusGeometry(.09+i*.075,.009,4,32),stone,root,-2.1,.032,-3.7);ring.rotation.x=Math.PI/2;ring.castShadow=false}
 // Catenary wires stay above the playable lane.
 for(let z of [-9,-30]){const curve=new T.QuadraticBezierCurve3(new T.Vector3(-13,7.5,z),new T.Vector3(0,5.2,z+.3),new T.Vector3(13,7.7,z));mesh(new T.TubeGeometry(curve,28,.018,4,false),iron,root)}
 const damp=canvasMap((c,w,h)=>{const g=c.createRadialGradient(w*.5,h*.5,w*.05,w*.5,h*.5,w*.5);g.addColorStop(0,'#ffffff');g.addColorStop(.7,'#ffffffaa');g.addColorStop(1,'#ffffff00');c.fillStyle=g;c.fillRect(0,0,w,h)},128);
 for(const [x,z,w,d] of [[-7,2,1.4,3.2],[6.7,-18,1.8,4.2],[-6.5,-32,2,3]]){const m=new T.MeshPhysicalMaterial({color:0x596669,metalness:.25,roughness:.16,clearcoat:1,clearcoatRoughness:.08,transparent:true,alphaMap:damp,opacity:.65,depthWrite:false});const o=mesh(new T.PlaneGeometry(w,d),m,root,x,.027,z);o.rotation.x=-Math.PI/2;o.castShadow=false;}
 mergeStatic(root);return root;
}

export function weatherFacade(p,w,h,r){
 const grime=canvasMap((c,cw,ch)=>{c.clearRect(0,0,cw,ch);const g=c.createLinearGradient(0,ch,0,ch*.64);g.addColorStop(0,'#2d332a88');g.addColorStop(1,'#2d332a00');c.fillStyle=g;c.fillRect(0,0,cw,ch);for(let i=0;i<80;i++){c.fillStyle=`rgba(52,48,38,${.025+r()*.065})`;c.fillRect(r()*cw,r()*ch,r()*3+1,15+r()*60)}},128,256);
 const m=new T.MeshStandardMaterial({map:grime,transparent:true,depthWrite:false,roughness:1,polygonOffset:true,polygonOffsetFactor:-1});const stains=mesh(new T.PlaneGeometry(w,h),m,p,0,h/2,.031);stains.castShadow=false;
 // Cornice shadow reveals, cornice brackets and masonry corner blocks.
 for(let y=3.45;y<h;y+=3){box(p,w,.045,.12,0x5b574c,0,y-.12,.15);for(let x=-w/2+.4;x<w/2;x+=1.1)box(p,.16,.24,.38,0xb9b09b,x,y-.02,.22)}
 for(let y=.8;y<h-.5;y+=.55)for(let s of [-1,1])box(p,y%1>.5?.48:.65,.45,.1,0xb7ad98,s*(w/2-.24),y,.11);
 // Rooftop antenna and an oxidized exhaust pipe.
 box(p,.035,2.7,.035,0x5a6260,w*.32,h+1.35,-3.5);for(let i=0;i<5;i++)box(p,.35+i*.09,.025,.025,0x6a716b,w*.32,h+2.4-i*.16,-3.5);
}
