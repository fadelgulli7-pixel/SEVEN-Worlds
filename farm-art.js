import {T,mat,mesh,box,bevel,ball,cyl,group,seed,batchScenery,mergeStatic} from './visuals.js?v=field-20261125';
import {surface} from './surfaces.js?v=field-20261125';
const lavender=0x7042a1,cream=0xffe7b4,wood=0xc38c51;
export function farmBarn(p,x,z,scale=1){
 const g=group(p,x,0,z);g.scale.setScalar(scale);
 bevel(g,6.5,.45,5.6,0xa99b80,0,.2,0,.14);bevel(g,6,3.5,5,0xb77b49,0,1.95,0,.09);
 for(let xx=-2.8;xx<3;xx+=.44)box(g,.035,3.45,5.02,0xd7a36c,xx,1.95,0);
 const shape=new T.Shape();shape.moveTo(-3,0);shape.lineTo(3,0);shape.lineTo(0,1.8);shape.closePath();const end=new T.ShapeGeometry(shape);
 for(const zz of [-2.51,2.51]){const m=mesh(end,mat(0xbc8655),g,0,3.7,zz);m.material.side=T.DoubleSide;box(g,6.18,.17,.19,cream,0,3.65,zz);for(const xx of [-2.94,2.94])box(g,.18,3.6,.19,cream,xx,1.97,zz)}
 for(const side of [-1,1]){const roof=group(g,side*1.62,4.62,0);roof.rotation.z=-side*.54;bevel(roof,3.85,.2,5.8,0x512b7a,0,0,0,.04);for(let row=0;row<7;row++)for(let col=0;col<8;col++){const tile=bevel(roof,.53,.085,.73,row%2?0x7f4bb0:0x7140a2,-1.6+row*.52,.14,-2.48+col*.71,.035);tile.rotation.z=.02}}
 box(g,.2,.15,5.9,0xb586d4,0,5.55,0);bevel(g,2.6,2.9,.15,0x634232,0,1.9,2.56,.02);
 for(const xx of [-1.3,0,1.3])box(g,.12,2.94,.14,cream,xx,1.88,2.68);box(g,2.85,.16,.15,cream,0,3.35,2.67);
 for(const side of [-1,1]){const brace=box(g,.13,2.9,.11,cream,side*.66,1.9,2.7);brace.rotation.z=side*.39;bevel(g,.95,1.05,.15,cream,side*2.2,2.4,2.55,.035);box(g,.76,.87,.1,0x6b8594,side*2.2,2.4,2.66);box(g,.04,.9,.13,cream,side*2.2,2.4,2.74);box(g,.8,.04,.13,cream,side*2.2,2.4,2.74)}
 const badge=mesh(new T.CylinderGeometry(.4,.4,.09,7),mat(0xeac46c,.35,.3),g,0,4.35,2.63);badge.rotation.x=Math.PI/2;box(g,.32,.06,.03,0x70449c,0,4.48,2.71);const seven=box(g,.065,.34,.03,0x70449c,.02,4.31,2.71);seven.rotation.z=-.35;
 for(const side of [-1,1]){bevel(g,.55,.1,.75,0xbaa077,side*1.85,.7,2.8,.02);const lantern=bevel(g,.22,.34,.24,new T.MeshStandardMaterial({color:0xffd76f,emissive:0xffb851,emissiveIntensity:.28}),side*1.7,2.7,2.84,.02);box(g,.3,.08,.3,0x644759,side*1.7,2.9,2.84)}
 return g;
}
export function goat(p,x,z){
 const g=group(p,x,0,z);ball(g,0,.8,0,.38,.39,.62,0xc8aa86);ball(g,0,.98,.5,.23,.3,.23,0xe6d4b6);ball(g,0,.83,.73,.18,.14,.17,0x9a7d61);
 const legs=[];for(const sx of [-.23,.23])for(const zz of [-.36,.36]){const l=group(g,sx,.56,zz);cyl(l,.05,.04,.48,0xbc9d7a,0,-.2,0);bevel(l,.1,.11,.14,0x544c42,0,-.45,.025,.02);legs.push(l)}
 for(const s of [-1,1]){ball(g,s*.22,1.05,.45,.17,.065,.09,0xb69a79);ball(g,s*.16,1.04,.67,.026,.035,.03,0x272a26);const horn=cyl(g,.015,.04,.35,0x746b58,s*.12,1.3,.42,12);horn.rotation.x=-.55;horn.rotation.z=-s*.15}cyl(g,0,.07,.18,0xb49a78,0,.63,.6,8);const tail=cyl(g,.025,.035,.23,0xc3a37d,0,.97,-.6,10);tail.rotation.x=-.7;
 g.userData={legs,head:g.children[1],origin:new T.Vector3(x,0,z)};return g;
}
export function farmWorker(p,index){
 const g=group(p,0,0,0),legs=[];ball(g,0,.86,0,.21,.29,.15,0x5c80a2);ball(g,0,1.3,0,.18,.2,.17,0xc5a07e);cyl(g,.29,.3,.05,0xe6c477,0,1.45,0,24);cyl(g,.18,.2,.15,0xd8b565,0,1.52,0,20);cyl(g,.185,.195,.035,0x785188,0,1.47,0,20);
 for(const s of [-1,1]){const l=group(g,s*.1,.62,0);cyl(l,.07,.065,.48,0x425168,0,-.2,0);ball(l,0,-.45,.05,.09,.06,.14,0x695346);legs.push(l);const arm=cyl(g,.06,.075,.43,0xe2cdac,s*.27,.86,0,12);arm.rotation.z=s*.3;ball(g,s*.33,.63,0,.07,.07,.07,0xc7a280)}
 for(const s of [-1,1])box(g,.045,.34,.025,0xa5b6bc,s*.1,1,.16);g.userData.legs=legs;g.userData.dynamic=true;for(const l of legs){mergeStatic(l);l.userData.dynamic=true}mergeStatic(g);return g;
}
export function farmTruck(p){
 const g=group(p,1,0,12),purple=mat(0x735094,.4,.15),creamMat=mat(0xf3dba6,.45,.1),dark=mat(0x323d41),glass=mat(0x77b4c4,.12,.45);
 bevel(g,1.65,.25,3.2,dark,0,.42,0,.09);bevel(g,1.63,.54,1.8,purple,0,.85,-.55,.09);bevel(g,1.55,1.17,1.24,creamMat,0,1.13,.9,.15);bevel(g,1.6,.13,1.37,purple,0,1.77,.9,.06);
 bevel(g,1.34,.49,.025,glass,0,1.4,1.53,.05);for(const s of [-1,1]){bevel(g,.025,.46,.86,glass,s*.79,1.4,.88,.05);bevel(g,.18,.16,.03,0xffe9ac,s*.55,.85,1.56,.035);for(const z of [-.9,1]){const wheel=mesh(new T.CylinderGeometry(.37,.37,.22,24),dark,g,s*.84,.38,z);wheel.rotation.z=Math.PI/2;const hub=mesh(new T.CylinderGeometry(.18,.18,.24,16),creamMat,g,s*.85,.38,z);hub.rotation.z=Math.PI/2}}
 for(let x of [-.52,0,.52])for(let z of [-.92,-.3]){bevel(g,.45,.37,.46,0xc49860,x,1.15,z,.035);for(let y=1.02;y<1.3;y+=.12)box(g,.46,.025,.47,0xe3c58d,x,y,z)}
 bevel(g,1.7,.16,.18,creamMat,0,.56,1.6,.05);g.userData.dynamic=true;mergeStatic(g);return g;
}
export function orchardTree(parent,x,z,scale=1,fruit=false){
 const g=group(parent,x,0,z),r=seed(31+Math.round(x*z));g.scale.setScalar(scale);cyl(g,.13,.25,2.2,0x8a623e,0,1.1,0,12);
 for(let i=0;i<5;i++){const a=i*1.26,b=cyl(g,.05,.1,1.25,0x92683f,Math.sin(a)*.35,2.0,Math.cos(a)*.35,10);b.rotation.z=Math.sin(a)*.5;b.rotation.x=Math.cos(a)*.5;}
 for(let i=0;i<32;i++){const a=r()*6.28,rad=Math.sqrt(r())*1.28;ball(g,Math.sin(a)*rad,2.3+r()*.9,Math.cos(a)*rad,.35+r()*.2,.3+r()*.28,.35+r()*.2,[0x538c35,0x71a444,0x8ebd59,0x42782e][i%4])}
 if(fruit)for(let i=0;i<11;i++){const a=i*2.4;ball(g,Math.sin(a)*1.12,2.15+(i%3)*.3,Math.cos(a)*1.12,.105,.12,.1,0xd9763b)}return g;
}
export function farmGround(scene,land){
 const extent=15+land*4.3,p=group(scene);bevel(p,34,1.3,31+land*4.3,0xc6ae7f,0,-.7,(extent-16)/2,.5);bevel(p,34,.3,31+land*4.3,0x91b652,0,-.1,(extent-16)/2,.3);
 // Curved-looking paved crossing, subtle individual limestone paving blocks.
 box(p,3,.04,64,0xcfbf92,1,.08,10);box(p,30,.045,2,0xcfbf92,0,.09,-1.2);
 const r=seed(89);for(let i=0;i<200;i++){const x=.1+r()*1.8,z=-16+r()*61,stone=bevel(p,.38,.025,.36,i%2?0xded1a9:0xc4b588,x,.12,z,.04);stone.scale.set(.7+r()*.7,1,.7+r()*.8)}
 for(let i=0;i<5;i++)orchardTree(p,-13+i*6,-15,.9,true);orchardTree(p,-16,-5,.7,true);orchardTree(p,16,-4,.7,true);
 // Flower borders avoid the camera-facing edge and clickable fields.
 for(let i=0;i<90;i++){const x=i%2?15:-15,z=-12+r()*(extent+10);const color=[0xe5b85a,0xbc8ccd,0xf1d9ad][i%3];cyl(p,.012,.018,.26,0x4c8236,x+r()*.6,.2,z,5);for(let k=0;k<4;k++)ball(p,x+Math.sin(k*1.57)*.07,.35,z+Math.cos(k*1.57)*.07,.075,.035,.06,color)}
 return p;
}

export function greenhouse(parent,x,z){
 const house=group(parent,x,0,z);
 house.name='Market greenhouse';
 const frame=mat(0xbfc8b0,.45,.38);
 const glass=new T.MeshStandardMaterial({color:0x9ebfb5,roughness:.18,metalness:.08,transparent:true,opacity:.27,depthWrite:false,side:T.DoubleSide});
 box(house,4.3,.2,6.4,0xac9a7d,0,.1,0);
 for(const side of [-1,1]){
  box(house,.035,2,6.1,glass,side*2,1.2,0);
  const roof=box(house,2.22,.05,6.16,glass,side,2.68,0);
  roof.rotation.z=-side*.42;
  for(const y of [.28,1.2,2.2])box(house,.08,.07,6.25,frame,side*2,y,0);
  for(let z=-3;z<=3;z+=1.5){
   box(house,.07,2.1,.07,frame,side*2,1.24,z);
   const rib=box(house,2.24,.075,.07,frame,side,2.68,z);rib.rotation.z=-side*.42;
  }
  box(house,.58,.25,5,0x905e3c,side*1.05,.42,0);
  for(let row=0;row<9;row++)ball(house,side*1.05,.69,-2.25+row*.56,.31,.24,.33,row%2?0x568949:0x789a50);
 }
 box(house,.09,.09,6.25,frame,0,3.15,0);
 mergeStatic(house);
 return house;
}
