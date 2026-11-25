import {dressQuarter} from './field-design.js?v=field-cast-2';
import {T,mat,mesh,box,ball,cyl,group,bevel,seed,mergeStatic} from './visuals.js?v=field-cast-2';
import {surface} from './surfaces.js?v=field-cast-2';
import {dressStreet,weatherFacade} from './urban-details.js?v=field-cast-2';
import {abandonedCar} from './hero-assets.js?v=field-cast-2';

let texturePromise;
export function loadCityMaterials(){
 texturePromise??=Promise.all(['concrete_layers_02','brick_wall_006','asphalt_01'].map(async name=>{
  const maps=await Promise.all(['diff','nor_gl','rough'].map(async (kind)=>{
   const bitmap=await new T.ImageBitmapLoader().setOptions({imageOrientation:'flipY'}).loadAsync(new URL(`./assets/${name}_${kind}.jpg`,import.meta.url).href);
   const t=new T.CanvasTexture(bitmap);t.colorSpace=kind==='diff'?T.SRGBColorSpace:T.NoColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;t.userData.sourceFile=`assets/${name}_${kind}.jpg`;return t;
  }));return {map:maps[0],normalMap:maps[1],roughnessMap:maps[2]};
 })).catch(e=>{texturePromise=null;throw e});return texturePromise;
}
function material(kit,color=0xffffff,repeat=[1,1]){
 const m=new T.MeshStandardMaterial({color,roughness:1});
 for(const [key,value] of Object.entries(kit)){m[key]=value.clone();m[key].repeat.set(...repeat)}m.normalScale.set(.45,.45);return m;
}
function label(p,text,w,h,color=0xe4ddbc,bg='#183f46'){
 const c=document.createElement('canvas');c.width=512;c.height=128;const x=c.getContext('2d');x.fillStyle=bg;x.fillRect(0,0,512,128);x.strokeStyle='#c7ae76';x.lineWidth=4;x.strokeRect(10,10,492,108);x.fillStyle='#f5e4b8';x.textAlign='center';x.textBaseline='middle';x.font='600 42px Georgia';x.fillText(text,256,64,460);
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({color,map:t,roughness:.7}),p);
}
function rod(p,a,b,r,m){const av=new T.Vector3(...a),bv=new T.Vector3(...b),o=mesh(new T.CylinderGeometry(r,r,av.distanceTo(bv),8),typeof m==='object'?m:mat(m),p,...av.clone().add(bv).multiplyScalar(.5).toArray());o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bv.sub(av).normalize());return o}
function facade(parent,{x,z,w=9,h=11,depth=7,color=0xcabca6,side=0,brick,wall,shop='SEVEN CAFE',awning=0x35646a}){
 const p=group(parent,x,0,z);p.rotation.y=side;const body=material(wall,color,[3,3]),stone=mat(0xc4b9a2),trim=mat(0xd6cbb4),dark=new T.MeshPhysicalMaterial({color:0x697879,metalness:.72,roughness:.14,clearcoat:1,envMapIntensity:1.45});
 box(p,w,h,depth,body,0,h/2,-depth/2);box(p,w+.3,.22,depth+.4,trim,0,h,-depth/2);
 box(p,w,.48,.2,brick,0,.24,.08);for(let yy=3.35;yy<h;yy+=3)box(p,w+.15,.16,.26,trim,0,yy,.13);
 for(let yy=4.6;yy<h-.7;yy+=3)for(let xx=-w/2+1.5;xx<w/2-1;xx+=2.8){
  box(p,1.55,2,.16,stone,xx,yy,.12);box(p,1.28,1.76,.12,dark,xx,yy,.23);
  box(p,.045,1.8,.1,trim,xx,yy,.32);box(p,1.3,.045,.1,trim,xx,yy-.05,.32);
  box(p,1.8,.14,.5,trim,xx,yy-1.05,.18);
  for(let s of [-1,1]){box(p,.52,1.9,.12,0x4d6a64,xx+s*1.05,yy,.2);for(let y=-.8;y<.9;y+=.14)box(p,.45,.028,.15,0x728179,xx+s*1.05,yy+y,.29)}
  if(yy<5){box(p,2.15,.14,.9,stone,xx,yy-1,.6);for(let i=-4;i<=4;i++)box(p,.025,.85,.025,0x263a3d,xx+i*.23,yy-.48,1);box(p,2.1,.04,.04,0x263a3d,xx,yy-.05,1)}
 }
 for(let xx of [-w*.27,w*.27]){
  box(p,w*.4,2.6,.1,dark,xx,1.35,.12);for(let t of [-1,1])box(p,.1,2.7,.16,trim,xx+t*w*.2,1.35,.23);
  box(p,w*.4,.1,.16,trim,xx,2.7,.23);box(p,.04,2.5,.15,trim,xx,1.35,.24);box(p,w*.4,.07,.18,trim,xx,1.3,.25);
 }
 const sign=label(p,shop,w*.85,.6);sign.position.set(0,3.05,.3);
 for(let i=0;i<14;i++){const a=box(p,w/14,.08,1.8,i%2?0xd8d2af:awning,-w/2+(i+.5)*w/14,2.8,1);a.rotation.x=.17;box(p,w/14,.26,.06,i%2?0xd8d2af:awning,-w/2+(i+.5)*w/14,2.52,1.88)}
 for(let s of [-1,1]){box(p,.12,h,.12,0x5c6561,s*(w/2-.15),h/2,.25);for(let y=1;y<h;y+=2)box(p,.26,.08,.16,0x777e72,s*(w/2-.15),y,.25)}
 // Roof plant, ventilation ducts and a framed water tank break the silhouette.
 box(p,1.6,.9,1,0x727c78,w*.2,h+.5,-2);for(let i=0;i<8;i++)box(p,1.35,.035,.04,0x374948,w*.2,h+.13+i*.09,-1.48);
 cyl(p,.7,.7,1.5,0x828e88,-w*.25,h+1,-3,20);weatherFacade(p,w,h,seed(Math.round((x+50)*31+z*13)));mergeStatic(p);return p;
}
function streetTree(p,x,z,r){
 const g=group(p,x,0,z),trunk=mat(0x6a5a45);cyl(g,.13,.22,3.1,0x6a5a45,0,1.5,0,12);
 for(let i=0;i<7;i++){const a=i*2.4,tip=[Math.sin(a)*(1+r()*.6),3.3+r()*.8,Math.cos(a)*(1+r()*.6)];rod(g,[0,1.8,0],tip,.06,trunk)}
 const geo=new T.PlaneGeometry(.38,.17),leafmat=new T.MeshStandardMaterial({color:0x62794b,roughness:1,side:T.DoubleSide});
 // Tapered individual leaves, with dappled light rather than solid foliage spheres.
 const pos=geo.attributes.position;pos.setX(0,-.03);pos.setX(3,.03);geo.computeVertexNormals();
 const leaves=new T.InstancedMesh(geo,leafmat,850),o=new T.Object3D(),col=new T.Color();
 for(let i=0;i<850;i++){const a=r()*6.28,u=r()*2-1,rr=Math.cbrt(r()),s=Math.sqrt(1-u*u);o.position.set(Math.cos(a)*s*rr*2,3.5+u*rr*1.5,Math.sin(a)*s*rr*2);o.rotation.set(r()*3.14,r()*6.28,r()*3.14);o.scale.setScalar(.8+r()*.8);o.updateMatrix();leaves.setMatrixAt(i,o.matrix);leaves.setColorAt(i,col.setHSL(.23+r()*.06,.27+r()*.18,.19+r()*.12))}leaves.castShadow=true;leaves.receiveShadow=true;g.add(leaves);
 box(g,2.4,.28,2.4,0x969786,0,.14,0);box(g,2.12,.03,2.12,0x554e3c,0,.295,0);return g;
}
function car(p,x,z,angle,color){
 const g=group(p,x,0,z);g.rotation.y=angle;const paint=new T.MeshPhysicalMaterial({color,metalness:.4,roughness:.28,clearcoat:1}),glass=mat(0x405f66,.17,.65),rubber=mat(0x242a28),chrome=mat(0x99aaa7,.25,.9);
 bevel(g,1.85,.55,4.1,paint,0,.67,0,.22);bevel(g,1.56,.73,2.02,paint,0,1.2,-.15,.2);bevel(g,1.42,.53,.055,glass,0,1.27,.88,.07).rotation.x=.3;bevel(g,1.42,.5,.055,glass,0,1.26,-1.2,.06).rotation.x=-.3;
 for(let s of [-1,1]){bevel(g,.05,.49,1.7,glass,s*.794,1.28,-.15,.06);box(g,.07,.52,.07,paint,s*.8,1.28,-.12);box(g,.07,.04,.21,chrome,s*.95,.83,-.38);for(let zz of [-1.34,1.34]){const tyre=mesh(new T.CylinderGeometry(.38,.38,.2,24),rubber,g,s*.92,.42,zz);tyre.rotation.z=Math.PI/2;const rim=mesh(new T.CylinderGeometry(.23,.23,.21,20),chrome,g,s*.93,.42,zz);rim.rotation.z=Math.PI/2}bevel(g,.47,.18,.06,0xeee8c9,s*.59,.73,2.06,.04);bevel(g,.45,.14,.055,0x9b3529,s*.62,.78,-2.06,.03)}box(g,1.1,.2,.06,0x212b2d,0,.58,2.08);mergeStatic(g);return g;
}
export function buildOldQuarter(scene,kits,hero){
 const p=group(scene),r=seed(7607),wall=kits[0],brick=material(kits[1],0xe7d6b9,[3,2]),paving=material(wall,0xc5baa4,[12,18]);
 const road=mesh(new T.PlaneGeometry(110,140),paving,p,0,-.025,-30);road.rotation.x=-Math.PI/2;
 const asphalt=material(kits[2],0xb9bdc0,[7.6,32]);asphalt.normalScale.set(.6,.6);
 const lane=mesh(new T.PlaneGeometry(16,68),asphalt,p,0,.005,-15);lane.rotation.x=-Math.PI/2;
 for(const s of [-1,1]){
  box(p,3,.17,74,0xc3bba7,s*9.5,.06,-17);
  for(let z=18;z>-52;z-=.9)box(p,.32,.23,.82,0xb5b4a4,s*8,.09,z);
  for(let i=0;i<5;i++)facade(p,{x:s*13.8,z:8-i*10,w:9.7,h:8.6+((i*3+(s>0?1:2))%4)*2.5,side:s<0?Math.PI/2:-Math.PI/2,wall,brick,color:[0xdac5a5,0xb6c4b6,0xd4c3af,0xc5b7a2][i%4],shop:(s<0?['CAFE AZUR','MAISON 07','ATELIER','MARCHE','LIBRAIRIE']:['OLD QUARTER','HOTEL BELLEVUE','PHARMACIE','LA TERRASSE','GALERIE'])[i],awning:s<0?0x34666b:0x88483b});
  for(let z of [7,-10,-28]){
   streetTree(p,s*9.6,z,r);const lamp=group(p,s*7.8,0,z+3);cyl(lamp,.06,.12,5,0x354447,0,2.5,0);rod(lamp,[0,4.9,0],[-s*.65,5.1,0],.045,0x354447);box(lamp,.5,.07,.3,0x243b3d,-s*.65,5.1,0);box(lamp,.4,.035,.24,new T.MeshStandardMaterial({color:0xf2e0ad,emissive:0xffd58d,emissiveIntensity:.6}),-s*.65,5.05,0);
  }
  for(let z of [-4,-22]){const b=group(p,s*9.1,0,z);for(let i=0;i<5;i++){box(b,1.9,.055,.12,0x836b4e,0,.48,i*.14);box(b,1.9,.08,.065,0x836b4e,0,.75+i*.12,-.1)}for(let x of [-.7,.7])box(b,.06,.5,.7,0x354441,x,.23,.2)}
 }
 // A shop-lined plaza terminates in a real open arcade, leaving the shooting lane clear.
 for(const [x,z,w,h,color,shop,awning] of [[-11,-46,9.6,12.8,0xa49b83,'BOULANGERIE',0x625545],[0,-48,11.4,16,0xcbbca5,'PLACE DES OLIVIERS',0x48635d],[11,-45,9.8,10.5,0xbb9781,'MAISON DU THE',0x70544d]])facade(p,{x,z,w,h,color,shop,awning,wall,brick});
 for(let x=-25;x<=25;x+=8){box(p,6,12+r()*12,8,material(wall,0x8d9997,[2,4]),x,7,-60);box(p,5,5,6,material(wall,0x89938e,[2,2]),x+3,10,-72)}
 for(const z of [6,-36])for(let x=-6;x<7;x+=1.2)box(p,.55,.008,2.3,0xd1cdb9,x,.02,z);

 if(hero){abandonedCar(p,hero.car,-6.5,-19,.08);abandonedCar(p,hero.car,6.5,-30,Math.PI+.1);}else car(p,-6.6,-19,.03,0x8caca4);
 // Rescue van at the near end of the street, with an unambiguous safe-zone beacon.
 const van=car(p,-6,8,0,0xd4d7cc);van.scale.y=1.18;const rescue=label(p,'RESCUE',2.6,.7);rescue.position.set(-6,2.75,9.5);
 const exit=new T.Vector3(-4.6,0,6.5),ring=mesh(new T.TorusGeometry(1.1,.026,8,48),new T.MeshBasicMaterial({color:0x91e3be,transparent:true,opacity:.6}),p,...exit.toArray());ring.rotation.x=-Math.PI/2;ring.position.y=.035;
 // A low checkpoint line gives enemies a physical place to retreat behind.
 const barrier=material(wall,0x9a9c8b,[1.5,.8]);
 for(const [x,z] of [[-5.7,-9.8],[5.1,-19.8],[2.9,-13.8]]){
  const b=group(p,x,0,z);bevel(b,2.5,.55,.62,barrier,0,.28,0,.08);bevel(b,2.25,.79,.4,barrier,0,.93,0,.06);box(b,2.25,.045,.42,0xbfbba2,0,1.345,0);
  for(let i=-3;i<=3;i++){const stripe=box(b,.13,.2,.012,i%2?0xd6b974:0x3f453d,i*.27,.55,.32);stripe.rotation.z=-.35}
 }
 // Player parapet: the standing view clears it, the cover position is occluded.
 box(p,8.4,2.9,.4,brick,0,1.45,14.4);box(p,8.6,.15,.58,0xc3b69d,0,2.97,14.4);
 // Camera balcony behind the player: details add depth without hiding targets.
 box(p,8,2.55,8,brick,0,1.26,22);box(p,8.4,.2,8.4,0xc5b59c,0,2.65,22);box(p,8.4,.2,.4,0xa69a83,0,2.85,17.9);
 for(let i=0;i<18;i++){const x=(i%2?1:-1)*(8.4+r()*2),z=12-r()*52;box(p,.24,.035,.32,0x9a9481,x,.2,z).rotation.y=r()*6.2}
 dressQuarter(p);mergeStatic(p);dressStreet(scene);
 const dustGeometry=new T.BufferGeometry(),dust=new Float32Array(90*3);for(let i=0;i<90;i++){dust[i*3]=(r()-.5)*17;dust[i*3+1]=r()*8+.3;dust[i*3+2]=r()*53-40}dustGeometry.setAttribute('position',new T.BufferAttribute(dust,3));const atmosphere=new T.Points(dustGeometry,new T.PointsMaterial({color:0xffdb9c,size:.025,transparent:true,opacity:.35,depthWrite:false}));atmosphere.userData.nonSolid=true;scene.add(atmosphere);
 return {environment:p,exit,ring,atmosphere};
}
