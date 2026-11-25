import {T,mat,mesh,box,ball,cyl,group,seed,bevel} from './visuals.js?v=field-cast-2';
import {surface} from './surfaces.js?v=field-cast-2';

export function farmNature(scene,land=0){
 const r=seed(4077),positions=[],colors=[],green=new T.Color();
 // Dense banks of individual tapered blades, one draw call, excluding every field/path.
 for(let i=0;i<7500;i++){
  const x=(r()-.5)*37,z=(r()-.5)*35;
  if(Math.abs(x-1)<1.9||Math.abs(z)<1.3||(x>-13&&x<-1.2&&z>.7&&z<10.5+land*4.3)||Math.hypot(x-10,z-11)<3.5||(x>-12&&x<-4&&z>-12&&z<-4)||(x>7&&x<13&&z>-2&&z<4))continue;
  const h=.1+r()*.32,w=.025+r()*.026,a=r()*Math.PI,dx=Math.cos(a)*w,dz=Math.sin(a)*w;
  positions.push(x-dx,.025,z-dz,x+dx,.025,z+dz,x+.09,h,z+.03);
  green.setHex(i%3?0x6d963a:0xa2b759);for(let j=0;j<3;j++){const shade=j===2?1:.6;colors.push(green.r*shade,green.g*shade,green.b*shade)}
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();
 const grassMat=new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.9});
 const wind={value:0};grassMat.onBeforeCompile=shader=>{shader.uniforms.windTime=wind;shader.vertexShader='uniform float windTime;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.x += sin(position.x * 1.6 + position.z * .7 + windTime * 1.4) * position.y * .22;')};
 const grass=mesh(geo,grassMat,scene);grass.castShadow=false;grass.userData.dynamic=true;
 const butterfly=group(scene,2,2,5);butterfly.userData.dynamic=true;const wings=[];for(const s of [-1,1]){const wing=ball(butterfly,s*.12,0,0,.16,.018,.12,0xf1b45e);wings.push(wing)}
 const butterflies=[];for(let i=0;i<5;i++){const b=butterfly.clone(true);scene.add(b);butterflies.push(b)}
 return {update(dt,t){wind.value=t;butterfly.position.set(2+Math.sin(t*.7)*2,1.6+Math.sin(t)*.3,6+Math.cos(t*.6)*2);butterflies.forEach((b,i)=>{b.position.set(5+Math.sin(t*.25+i*2)*8,1.3+Math.sin(t*.8+i)*.3,8+Math.cos(t*.3+i*2)*4);b.children.forEach((w,j)=>w.rotation.z=Math.sin(t*14+i)*(j?1:-1))});wings.forEach((w,i)=>w.rotation.z=Math.sin(t*15)*(i?1:-1))}};
}
function transport(parent,x,z){
 const g=group(parent,x,0,z),body=mat(0x51635e,.65,.3),dark=mat(0x242e30,.7,.15),glass=new T.MeshPhysicalMaterial({color:0x678b94,metalness:.45,roughness:.14,clearcoat:1});
 bevel(g,2.4,.35,5.6,dark,0,.63,0,.1);bevel(g,2.3,.6,3.1,body,0,1.15,-1,.13);bevel(g,2.15,1.6,1.8,body,0,1.8,1.05,.16);bevel(g,2.2,.2,1.9,body,0,2.66,1.05,.1);
 bevel(g,1.85,.65,.025,glass,0,2.13,1.96,.03);for(const s of [-1,1]){bevel(g,.025,.65,1.2,glass,s*1.085,2.13,1.1,.02);bevel(g,.12,.22,.38,dark,s*1.27,2,1.7,.02);rodMirror(g,s);for(const zz of [-1.8,1.4]){const tyre=mesh(new T.CylinderGeometry(.58,.58,.32,24),mat(0x202527),g,s*1.2,.62,zz);tyre.rotation.z=Math.PI/2;const hub=mesh(new T.CylinderGeometry(.27,.27,.34,16),body,g,s*1.22,.62,zz);hub.rotation.z=Math.PI/2}}
 bevel(g,1.25,.35,.06,dark,0,1.25,2.01,.03);for(const s of [-1,1])bevel(g,.3,.22,.06,new T.MeshStandardMaterial({color:0xe9ddb5,emissive:0xe5be78,emissiveIntensity:.4}),s*.8,1.37,2.01,.03);
 for(let zz=-2;zz<.1;zz+=.75){const arch=mesh(new T.TorusGeometry(1,.055,8,24,Math.PI),body,g,0,1.75,zz);arch.rotation.z=0}
 bevel(g,2.18,.1,3.0,0x69766b,0,2.76,-1,.05);for(let x of [-1.09,1.09])box(g,.04,1.0,3.0,0x69766b,x,2.25,-1);
 return g;
}
function rodMirror(g,s){box(g,.32,.04,.04,0x39433e,s*1.1,2,1.7)}
export function outpostAtmosphere(scene,parent,biome){
 const r=seed(177+biome),snow=biome===3;
 const paving=new T.MeshStandardMaterial({color:snow?0x9caeb8:0x64717a,...surface('asphalt'),roughness:.95});paving.map.repeat.set(5,25);paving.normalMap.repeat.copy(paving.map.repeat);paving.roughnessMap.repeat.copy(paving.map.repeat);paving.normalScale.setScalar(.28);
 const road=mesh(new T.PlaneGeometry(17,80),paving,parent,0,.051,-26);road.rotation.x=-Math.PI/2;
 // Broken lane paint and drainage seams are real ground geometry.
 for(let z=9;z>-65;z-=7){box(parent,.13,.012,2.4,0xc2ba99,-8.15,.065,z);box(parent,.13,.012,2.4,0xc2ba99,8.15,.065,z);box(parent,.09,.012,1.7,0xb6af97,0,.064,z)}
 for(let s of [-1,1]){box(parent,.4,.18,79,0x747f82,s*8.8,.09,-26);transport(parent,s*19,-21+(s>0?12:0));
  // Utility poles, suspended cables and roof antennas outside the shooting lane.
  for(let i=0;i<4;i++){const x=s*24,z=5-i*18;cyl(parent,.09,.12,9,0x414c52,x,4.5,z);box(parent,3,.12,.12,0x354149,x,8.7,z);for(let j of [-1,1]){cyl(parent,.1,.1,.24,0x92a1a5,x+j,8.8,z);if(i<3){const curve=new T.QuadraticBezierCurve3(new T.Vector3(x+j,8.9,z),new T.Vector3(x+j,7.6,z-9),new T.Vector3(x+j,8.9,z-18));mesh(new T.TubeGeometry(curve,12,.018,4,false),mat(0x242e37),parent)}}}
 }
 // Sparse stones and scrub give the compound a weathered edge, leaving sight lines clear.
 const rockGeo=new T.DodecahedronGeometry(1,1),rockMat=mat(snow?0xc9d3d6:0x777872),rocks=new T.InstancedMesh(rockGeo,rockMat,120),dummy=new T.Object3D();
 for(let i=0;i<120;i++){const side=i%2?1:-1;dummy.position.set(side*(9.4+r()*25),.04,-r()*65);dummy.scale.set(.1+r()*.4,.08+r()*.1,.1+r()*.3);dummy.rotation.set(r(),r()*6,r());dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix)}rocks.receiveShadow=true;parent.add(rocks);
 const count=snow?110:65,pts=new Float32Array(count*3);for(let i=0;i<count;i++){pts[i*3]=(r()-.5)*50;pts[i*3+1]=r()*12;pts[i*3+2]=10-r()*75}const geom=new T.BufferGeometry();geom.setAttribute('position',new T.BufferAttribute(pts,3));const particles=new T.Points(geom,new T.PointsMaterial({color:snow?0xdceaf2:0xc2b394,size:snow?.07:.035,transparent:true,opacity:snow?.7:.28,depthWrite:false}));particles.userData.dynamic=true;scene.add(particles);
 return {update(dt,t){const a=geom.attributes.position;for(let i=0;i<count;i++){a.setY(i,a.getY(i)-dt*(snow?.55:.07));a.setX(i,a.getX(i)+Math.sin(t*.3+i)*dt*.05);if(a.getY(i)<.3)a.setY(i,12)}a.needsUpdate=true}};
}
