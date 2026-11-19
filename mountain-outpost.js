import {T,mat,mesh,box,cyl,group,bevel,seed,mergeStatic} from './visuals.js?v=studio';
import {surface} from './surfaces.js?v=studio';
import {fieldTent,timberCrate,watchTower,campTerrain,campScatter,lampGlowMaterial,lampGlow} from './camp-detail.js?v=studio';
import {HDRLoader} from './vendor/HDRLoader.js';
let assets;
export function loadCampAssets(){
 assets??=Promise.all([
  Promise.all(['rock_face','sandy_gravel_02','hessian_380','weathered_planks'].map(async name=>{const kit={};for(const [kind,key] of [['diff','map'],['nor_gl','normalMap'],['rough','roughnessMap']]){const image=await new T.ImageBitmapLoader().setOptions({imageOrientation:'flipY'}).loadAsync(new URL(`./assets/${name}_${kind}_1k.jpg`,import.meta.url).href);const t=new T.CanvasTexture(image);t.colorSpace=kind==='diff'?T.SRGBColorSpace:T.NoColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;kit[key]=t;}return kit})),
  new HDRLoader().loadAsync(new URL('./assets/qwantani_sunset_puresky_1k.hdr',import.meta.url).href)
 ]).then(([kits,light])=>{light.mapping=T.EquirectangularReflectionMapping;return {kits,light,background:light}}).catch(e=>{assets=null;throw e});return assets;
}
function pbr(kit,color,rx=1,ry=rx){const m=new T.MeshStandardMaterial({color,roughness:.92});for(const [k,v] of Object.entries(kit)){m[k]=v.clone();m[k].repeat.set(rx,ry)}m.normalScale.set(.55,.55);return m}
function beam(p,a,b,r,m){const aa=new T.Vector3(...a),bb=new T.Vector3(...b),g=mesh(new T.CylinderGeometry(r,r,aa.distanceTo(bb),8),m,p,...aa.clone().add(bb).multiplyScalar(.5).toArray());g.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bb.sub(aa).normalize());return g}
function sign(p,text,x,y,z,w=3.5,accent='#ffd784'){const c=document.createElement('canvas');c.width=512;c.height=180;const g=c.getContext('2d');g.fillStyle='#1d182ae8';g.fillRect(5,5,502,170);g.strokeStyle=accent;g.lineWidth=7;g.strokeRect(8,8,496,164);g.fillStyle=accent;g.font='bold 45px sans-serif';g.textAlign='center';g.textBaseline='middle';const words=text.split('|');words.forEach((s,i)=>g.fillText(s,256,words.length===1?90:62+i*57));const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;const s=new T.Sprite(new T.SpriteMaterial({map:t,depthWrite:false}));s.position.set(x,y,z);s.scale.set(w,w*180/512,1);s.userData.nonSolid=true;s.raycast=()=>{};p.add(s);return s}
export function buildMountainOutpost(scene,kits){
 const p=group(scene),r=seed(77441),rock=pbr(kits[0],0xafa4a9,2,2),steel=mat(0x4a454e,.7,.3);
 const M={canvas:pbr(kits[2],0xbca78c,5,7),canvasDark:pbr(kits[2],0x867768,3,4),wood:pbr(kits[3],0xbdb7a6,1,1),iron:new T.MeshStandardMaterial({color:0x4b5050,roughness:.75,metalness:.45,...surface('metal')}),metal:new T.MeshStandardMaterial({color:0x63696a,roughness:.65,metalness:.65,...surface('metal')}),rope:mat(0x74705c),dark:mat(0x1e2524),lamp:new T.MeshStandardMaterial({color:0xffdcb0,emissive:0xffbb72,emissiveIntensity:2,roughness:.3})};M.canvas.side=M.canvasDark.side=T.DoubleSide;M.glow=lampGlowMaterial();M.window=new T.MeshStandardMaterial({color:0xbe9161,emissive:0xffb873,emissiveIntensity:.9,roughness:.2,metalness:.1,transparent:true,opacity:.8});
 campTerrain(p,kits);campScatter(p,rock,M);
 for(const [x,z,w,d] of [[-9,-13,5.5,7],[12,-13,6,7],[-12,-32,6,8],[-5.5,-43,5.5,7],[3,-47,5.5,7],[14,-44,5,7]])fieldTent(p,x,z,w,d,M);
 for(let i=0;i<20;i++){const x=(i%2?1:-1)*(9+r()*8),z=-4-r()*37;if(Math.hypot(x-8,z+27)>5)timberCrate(p,x,z,.75+r()*.6,M)}
 const towers=[watchTower(p,-6.3,-28,11.5,M),watchTower(p,10,-58,9,M),watchTower(p,-19,-56,9,M)];
 for(let side of [-1,1]){for(let z=7;z>-48;z-=3){cyl(p,.05,.05,2.4,0x62565c,side*19,1.2,z);for(let y of [.55,1.3,2.1])box(p,.018,.018,3,steel,side*19,y,z-1.5)}for(let z of [-5,-20,-35]){cyl(p,.055,.075,4,0x48424a,side*8,2,z);const m=new T.MeshStandardMaterial({color:0xffd188,emissive:0xffac47,emissiveIntensity:2.2});box(p,.18,.3,.18,m,side*8,3.8,z);lampGlow(p,M.glow,side*8,3.8,z,.9)}}
 // Same physical guard cover arrangement as the tested encounter.
 const barrier=pbr(kits[0],0x80797d,1,.6);for(const [x,z] of [[-5.7,-9.8],[5.1,-19.8],[2.9,-13.8]]){bevel(p,2.5,.55,.62,barrier,x,.28,z,.08);bevel(p,2.25,.79,.4,barrier,x,.93,z,.06);for(let row=0;row<3;row++)for(let i=0;i<4;i++){const b=bevel(p,.60,.27,.45,M.canvasDark,x-.9+i*.59+(row%2)*.07,.18+row*.29,z+.13,.12);b.rotation.y=(r()-.5)*.1}}
 // A low stone edge stays below the standing sight line; cover lowers behind it.
 const playerCover=group(p);playerCover.name='Player cover';playerCover.userData.dynamic=true;
 box(playerCover,8.4,2.5,.42,rock,0,1.25,7.1);bevel(playerCover,8.6,.10,.50,rock,0,2.55,7.1,.04);
 const platform=box(p,12,1.9,17,rock,0,.95,16);platform.name='Lookout floor';
 for(let side of [-1,1])for(let i=0;i<4;i++){const o=mesh(new T.DodecahedronGeometry(1,1),rock,p,side*(7+r()*4),.4+r(),11+r()*12);o.scale.set(1+r(),1+r(),1+r())}
 const exit=new T.Vector3(8,.09,-27),pad=mesh(new T.CylinderGeometry(4.1,4.1,.12,64),mat(0x625961),p,exit.x,.02,exit.z);const glow=new T.MeshBasicMaterial({color:0xffcd76});const ring=mesh(new T.TorusGeometry(3.7,.045,8,80),glow,p,exit.x,.11,exit.z);ring.rotation.x=-Math.PI/2;ring.userData.nonSolid=true;for(const [inner,outer,opacity] of [[3.5,3.9,.16],[3.2,4.2,.045]]){const halo=mesh(new T.RingGeometry(inner,outer,80),new T.MeshBasicMaterial({color:0xffbd61,transparent:true,opacity,depthWrite:false,blending:T.AdditiveBlending}),p,exit.x,.115,exit.z);halo.rotation.x=-Math.PI/2;halo.userData.nonSolid=true;halo.userData.dynamic=true;}
 for(let x of [-.65,.65])box(p,.16,.02,2,glow,exit.x+x,.1,exit.z);box(p,1.3,.02,.16,glow,exit.x,.1,exit.z);
 for(let i=0;i<12;i++){const a=i*Math.PI/6;mesh(new T.SphereGeometry(.07,8,6),glow,p,exit.x+Math.sin(a)*3.9,.2,exit.z+Math.cos(a)*3.9)}
 sign(p,'EVACUATION|POINT',8,5.3,-30,6.1);sign(p,'SEVEN · OUTPOST',-9,3.4,-8.9,3.1);
 mergeStatic(p);
 const sweep=[];for(const [i,t] of towers.entries()){if(i>1)break;const light=new T.SpotLight(0xffdcad,650,52,.25,.8,2);light.position.copy(t.position);const target=new T.Object3D();target.position.set(i?1:-3,0,-10-i*15);scene.add(light,target);light.target=target;sweep.push({light,target,i});}
 for(const [x,z] of [[-10,-7],[11,-19]]){const l=new T.PointLight(0xffb968,60,14,2);l.position.set(x,2,z);scene.add(l)}
 p.name='Sunset Ridge rescue outpost';return {environment:p,exit,ring,playerCover,updateAmbient(time){for(const s of sweep){s.target.position.x=Math.sin(time*.16+s.i*2)*7;}}};
}
