import {T,mat,mesh,box,ball,cyl,group,seed,tree} from './visuals.js?v=field-ridge-4';

// Continuous terrain keeps the estate grounded, with a flat playable center.
export function meadow(scene){
 const geometry=new T.PlaneGeometry(180,160,80,72);geometry.rotateX(-Math.PI/2);const p=geometry.attributes.position,colors=[];
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),edge=Math.max(Math.abs(x)/18,Math.abs(z)/18),rise=Math.min(1,Math.max(0,edge-1));let y=-.6+rise*(Math.sin(x*.055)*Math.cos(z*.07)*3.5+Math.sin(z*.13+x*.02)*1.4);p.setY(i,y);const c=new T.Color(0x8fa875).lerp(new T.Color(0xb5bf8d),(Math.sin(x*.065+z*.04)+1)*.24);colors.push(c.r,c.g,c.b)}
 geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();const land=mesh(geometry,new T.MeshStandardMaterial({vertexColors:true,roughness:1}),scene);land.castShadow=false;
 const r=seed(81);for(let i=0;i<38;i++){const x=(r()-.5)*100,z=(r()-.5)*95;if(Math.abs(x)<19&&Math.abs(z)<20)continue;tree(scene,x,z,.8+r()*.8)}
}
export function estateDetails(scene){
 // Four sails turn around a true 3D mill, behind the cattle pasture.
 const mill=group(scene,16,0,-15);cyl(mill,1,1.8,5.5,0xc3b18b,0,2.75,0,24);const cap=mesh(new T.ConeGeometry(1.6,1.7,24),mat(0x78648a),mill,0,6.2,0);const sails=group(mill,0,4.8,1.3);sails.userData.dynamic=true;cyl(sails,.16,.16,.4,0x6d674f,0,0,0).rotation.x=Math.PI/2;
 for(let i=0;i<4;i++){let arm=group(sails);arm.rotation.z=i*Math.PI/2;box(arm,.12,3.3,.12,0x84745a,0,1.65,0);box(arm,.6,1.9,.08,0xe8dfbf,.25,2.1,0);for(let y=1.2;y<3.1;y+=.4)box(arm,.7,.055,.12,0x9e9073,.25,y,.02)}
 for(let i=0;i<3;i++){box(mill,.4,.55,.08,0x6b7978,0,1.6+i*1.1,1.1);box(mill,.5,.06,.15,0xe3d9bb,0,1.3+i*1.1,1.13)}
 // Market cart and canvas awning at the edge of the estate.
 const stall=group(scene,4,0,14.5);box(stall,3.5,1,1.3,0x9c7957,0,.5,0);for(const x of [-1.7,1.7])box(stall,.1,2.6,.1,0x8f7754,x,1.3,0);for(let i=0;i<8;i++)box(stall,.46,.12,2.4,i%2?0xe7d6af:0x7b668b,-1.6+i*.46,2.7,0).rotation.x=-.08;
 for(let i=0;i<3;i++){box(stall,.8,.1,.8,0xd2b37e,-1+i,.99,0);for(let j=0;j<5;j++)ball(stall,-1+i+Math.cos(j)*.2,1.14+Math.sin(j)*.02,Math.sin(j)*.2,.11,.13,.11,i===0?0xcba25f:i===1?0xc2785d:0x8f9c62)}
 // Tiny waves form and fade on the pond; no shader/post-processing dependency.
 const waves=[];for(let i=0;i<3;i++){const m=mesh(new T.TorusGeometry(.6,.012,5,48),new T.MeshBasicMaterial({color:0xd6eecc,transparent:true,opacity:.2,depthWrite:false}),scene,10,.13,11);m.rotation.x=-Math.PI/2;m.userData.dynamic=true;m.castShadow=false;waves.push(m)}
 return {update(dt,t){sails.rotation.z-=dt*.28;waves.forEach((w,i)=>{let a=(t*.15+i/3)%1;w.scale.setScalar(.4+a*3.4);w.material.opacity=(1-a)*.22})}};
}
function wallMaterial(color){let canvas=document.createElement('canvas');canvas.width=canvas.height=128;let c=canvas.getContext('2d');c.fillStyle='#c0c4bd';c.fillRect(0,0,128,128);const r=seed(19);for(let i=0;i<800;i++){c.fillStyle=i%2?'#ffffff16':'#34434a12';c.fillRect(r()*128,r()*128,r()*5+1,r()*9+1)}for(let y=16;y<128;y+=24){c.fillStyle='#5f6d6d35';c.fillRect(0,y,128,1)}const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(2,2);return new T.MeshStandardMaterial({color,map:tex,roughness:.95})}
export function outpostDetails(parent,biome){
 const r=seed(912),snow=biome===3,wall=wallMaterial(snow?0xa4b1b7:0x82959b),metal=mat(0x445562,.7,.2),glass=new T.MeshStandardMaterial({color:0xb59e70,emissive:0xcf9b51,emissiveIntensity:.5});
 // Corrugated metal siding, lit inset windows and roof vents give buildings depth.
 for(const side of [-1,1])for(let i=0;i<3;i++){
  const g=group(parent,side*28,0,-13-i*20),height=7+r()*5;
  box(g,8,height,12,wall,0,height/2,0);box(g,8.6,.25,12.6,0x405361,0,height,0);
  for(let x=-3.7;x<4;x+=.55)box(g,.065,height,12.05,metal,x,height/2,0);
  for(let y=2;y<height-1;y+=2.3)for(let x=-2.5;x<3;x+=2.5){box(g,1.5,1.2,.12,0x233847,x,y,6.1);box(g,1.1,.85,.05,glass,x,y,6.18);box(g,1.6,.1,.4,0x536671,x,y-.65,6.25)}
  for(let j=0;j<2;j++){cyl(g,.6,.6,1.4,0x6f8087,-2+j*3,height+.7,-2,16);cyl(g,.75,.75,.15,0x89999b,-2+j*3,height+1.4,-2,16)}
 }
 // A road and separate lane lights establish a readable route to extraction.
 box(parent,17,.01,80,snow?0x7b8e9b:0x4e616d,0,.025,-26);
 for(let z=9;z>-65;z-=7){box(parent,.1,.014,2.5,0xbbc3b5,-8.3,.04,z);box(parent,.1,.014,2.5,0xbbc3b5,8.3,.04,z)}
 for(let side of [-1,1])for(let i=0;i<5;i++){let z=8-i*14;const bulb=mesh(new T.SphereGeometry(.09,10,8),new T.MeshBasicMaterial({color:0xf2cf92}),parent,side*10,.4,z);bulb.castShadow=false;cyl(parent,.13,.16,.4,0x566b73,side*10,.2,z)}
 // Searchlight shafts are visual geometry and stay outside the target corridor.
 for(let side of [-1,1]){const beam=mesh(new T.ConeGeometry(3.5,14,20,1,true),new T.MeshBasicMaterial({color:0xc7deee,transparent:true,opacity:.045,side:T.DoubleSide,depthWrite:false}),parent,side*20,5,-35);beam.rotation.z=side*.35;beam.castShadow=false;beam.receiveShadow=false}
}
