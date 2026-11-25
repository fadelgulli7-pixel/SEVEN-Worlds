import {T,box,mesh,group,mat,seed,mergeStatic} from './visuals.js?v=field-ridge-4';

// Dressing stays outside the target and extraction lanes.
export function dressOutpost(parent,wood,metal){
 const r=seed(90215),set=group(parent);
 set.name='Outpost command compound';
 const concrete=mat(0x777a70,.96),roof=mat(0x353d3d,.8,.25);
 const glass=new T.MeshStandardMaterial({color:0x24414a,roughness:.22,metalness:.45});
 const windowLight=new T.MeshStandardMaterial({color:0xf0c591,emissive:0xffab59,emissiveIntensity:.75});
 for(const [x,z,width] of [[-15,-48,8],[17,-34,7]]){
  const building=group(set,x,0,z);
  box(building,width,4.4,6,concrete,0,2.2,0);
  box(building,width+.6,.22,6.6,roof,0,4.5,0);
  for(let xx=-width/2+.9;xx<width/2;xx+=1.7){
   box(building,1.2,1.4,.12,metal,xx,2.7,3.04);
   box(building,1.05,1.25,.13,r()>.5?glass:windowLight,xx,2.7,3.10);
   box(building,.035,1.3,.04,metal,xx,2.7,3.19);
  }
  for(let i=0;i<4;i++)box(building,width+.2,.055,6.2,metal,0,4.65+i*.025,-2.4+i*1.6);
  box(building,1.15,2.25,.14,roof,-width/2+.85,1.12,3.15);
  for(let i=0;i<3;i++)box(building,1.6,.13,.36,concrete,-width/2+.85,.065+i*.13,3.3+(2-i)*.36);
  const mast=mesh(new T.CylinderGeometry(.035,.07,8,8),metal,building,width/2-.8,8.5,-1.5);
  const dish=mesh(new T.SphereGeometry(.85,16,8,0,Math.PI*2,0,.7),metal,building,width/2-.8,6.2,-1.5);
  dish.rotation.z=.7;mast.castShadow=true;
 }
 for(const side of [-1,1])for(let i=0;i<7;i++){
  const x=side*(12+r()*4),z=-5-i*6.5;
  const pallet=group(set,x,.05,z);pallet.rotation.y=r()*.5;
  for(let j=0;j<5;j++)box(pallet,1.65,.06,.19,wood,0,.12,(j-2)*.25);
  for(const xx of [-.65,.65])box(pallet,.12,.17,1.3,wood,xx,.04,0);
  if(i%2===0){
   box(pallet,1.3,.7,1,mat(0x505e4b,.95),0,.51,0);
   for(const xx of [-.43,.43])box(pallet,.045,.73,1.04,metal,xx,.51,0);
  }
 }
 // A visible communications wire follows the perimeter rather than the sights.
 for(const side of [-1,1]){
  const points=[];
  for(let i=0;i<=64;i++){const t=i/64;points.push(new T.Vector3(side*18,5.2-Math.sin(t*Math.PI*3)*.35,-3-t*48));}
  const wire=new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color:0x242b2a}));
  wire.userData.nonSolid=true;wire.raycast=()=>{};set.add(wire);
 }
 mergeStatic(set);
 return set;
}

export function alpineTreeLine(parent){
 const r=seed(70195),count=84,object=new T.Object3D();
 const trunks=new T.InstancedMesh(new T.CylinderGeometry(.055,.17,1,7),mat(0x514d3d),count);
 const needles=new T.InstancedMesh(new T.ConeGeometry(1,1,9,1,true),mat(0x344640,.96),count*6);
 trunks.name='Alpine pine trunks';needles.name='Irregular pine branches';
 for(let i=0;i<count;i++){
  const side=i%2?1:-1,x=side*(23+r()*37),z=-8-r()*90,height=4+r()*7;
  object.position.set(x,height*.5,z);object.scale.set(1,height,1);object.rotation.set(0,r()*6.28,0);object.updateMatrix();trunks.setMatrixAt(i,object.matrix);
  for(let j=0;j<6;j++){
   const fraction=j/6,width=(1-fraction)*height*.23+.15;
   object.position.set(x+(r()-.5)*.25,height*(.30+fraction*.63),z+(r()-.5)*.25);
   object.scale.set(width,height*.31,width*(.8+r()*.3));object.rotation.set((r()-.5)*.12,r()*6.28,(r()-.5)*.12);object.updateMatrix();needles.setMatrixAt(i*6+j,object.matrix);
   needles.setColorAt(i*6+j,new T.Color().setHSL(.35+r()*.04,.12+r()*.12,.15+r()*.08));
  }
 }
 for(const item of [trunks,needles]){item.castShadow=true;item.receiveShadow=true;item.computeBoundingSphere();parent.add(item);}
}

export function dressQuarter(parent){
 const set=group(parent),r=seed(76182),stone=mat(0x817c70,.96),iron=mat(0x374146,.75,.3);
 set.name='Old Quarter street details';
 for(const side of [-1,1])for(let i=0;i<5;i++){
  const x=side*8.9,z=5-i*10;
  box(set,.9,.55,.9,stone,x,.36,z);
  const shrub=mesh(new T.IcosahedronGeometry(.6,2),mat(0x43583e),set,x,.95,z);shrub.scale.set(1,.65,1);
  box(set,.48,.8,.45,iron,x,.48,z+1.2);
  box(set,.54,.06,.5,iron,x,.91,z+1.2);
  for(let j=0;j<5;j++){
   const paper=mesh(new T.PlaneGeometry(.1+r()*.2,.15+r()*.25),mat(j%2?0xb3a38c:0x77776e),set,x+(r()-.5)*1.5,.18,z+(r()-.5)*3);
   paper.rotation.set(-Math.PI/2,0,r()*6.28);paper.userData.nonSolid=true;paper.raycast=()=>{};
  }
 }
 mergeStatic(set);
}
