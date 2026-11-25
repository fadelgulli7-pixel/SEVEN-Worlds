import {T,mesh,box,group,bevel,mat,seed} from './visuals.js?v=field-20261125';
export function pbr(kit,color,rx=1,ry=rx){const m=new T.MeshStandardMaterial({color,roughness:.93});for(const [k,t] of Object.entries(kit)){m[k]=t.clone();m[k].repeat.set(rx,ry)}m.normalScale.set(.65,.65);return m}
export function beam(p,a,b,r,m){const aa=new T.Vector3(...a),bb=new T.Vector3(...b),o=mesh(new T.CylinderGeometry(r,r,aa.distanceTo(bb),8),m,p,...aa.clone().add(bb).multiplyScalar(.5).toArray());o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bb.sub(aa).normalize());return o}
const smooth=x=>x*x*(3-2*x);
function hash(x,z){let n=Math.imul(x,374761393)^Math.imul(z,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295}
function noise(x,z){const a=Math.floor(x),b=Math.floor(z),u=smooth(x-a),v=smooth(z-b);return T.MathUtils.lerp(T.MathUtils.lerp(hash(a,b),hash(a+1,b),u),T.MathUtils.lerp(hash(a,b+1),hash(a+1,b+1),u),v)}
function fbm(x,z){let value=0,amp=.5;for(let i=0;i<5;i++){value+=noise(x,z)*amp;x=x*2.03+17;z=z*2.01-9;amp*=.5}return value}
function cloth(p,nx,ny,point,m){const geo=new T.PlaneGeometry(1,1,nx,ny),a=geo.attributes.position,uv=geo.attributes.uv;for(let i=0;i<a.count;i++)a.setXYZ(i,...point(uv.getX(i),uv.getY(i)));geo.computeVertexNormals();return mesh(geo,m,p)}
export function lampGlowMaterial(){const size=32,data=new Uint8Array(size*size*4);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const r=Math.hypot((x+.5)/size*2-1,(y+.5)/size*2-1),i=(y*size+x)*4;data[i]=data[i+1]=data[i+2]=255;data[i+3]=Math.round(255*Math.exp(-r*r*6)*Math.max(0,1-r));}const t=new T.DataTexture(data,size,size);t.needsUpdate=true;t.magFilter=t.minFilter=T.LinearFilter;return new T.SpriteMaterial({map:t,color:0xffc487,transparent:true,opacity:.65,blending:T.AdditiveBlending,depthWrite:false});}
export function lampGlow(p,m,x,y,z,size=.7){const s=new T.Sprite(m);s.position.set(x,y,z);s.scale.setScalar(size);s.userData.nonSolid=true;s.raycast=()=>{};p.add(s);return s;}
export function fieldTent(p,x,z,w,d,M){const g=group(p,x,0,z);g.name='Folded field shelter';const eave=1.95,ridge=3.7,front=d/2;
 const roof=(xx,zz)=>eave+(ridge-eave)*(1-Math.abs(xx)/(w/2))-.12*Math.sin((zz/d+.5)*Math.PI)+.045*Math.cos(zz*9)*Math.sin(Math.abs(xx)/w*Math.PI*2);
 for(const s of [-1,1]){
  cloth(g,24,32,(u,v)=>{const xx=s*u*w/2,zz=(v-.5)*d;return [xx,roof(xx,zz),zz]},M.canvas);
  cloth(g,32,12,(u,v)=>{const zz=(u-.5)*d;return [s*(w/2+.035*Math.sin(zz*12)*(1-v)+.07*Math.sin(v*Math.PI)),v*eave,zz]},M.canvas);
  for(const zz of [-d/2,-d/6,d/6,d/2]){beam(g,[s*w/2,eave,zz],[s*(w/2+1.05),.08,zz+.3],.014,M.rope);beam(g,[s*(w/2+1.05),-.1,zz+.3],[s*(w/2+1.05),.18,zz+.3],.035,M.iron)}
 }
 for(const end of [-1,1]){const zz=end*front;
  cloth(g,28,12,(u,v)=>{const xx=(u-.5)*w;return [xx,eave+v*(roof(xx,zz)-eave),zz+.03*Math.sin(u*41)*Math.sin(v*Math.PI)]},M.canvas);
  if(end===-1)cloth(g,28,14,(u,v)=>[(u-.5)*w,v*eave,zz+.04*Math.sin(u*50)*Math.sin(v*Math.PI)],M.canvas);
  else for(const s of [-1,1])cloth(g,16,16,(u,v)=>[s*(.75+u*(w/2-.75)),v*eave,zz+.07*Math.sin(u*26)*(1-v)],M.canvas);
  beam(g,[-w/2,eave,zz],[0,ridge,zz],.036,M.rope);beam(g,[0,ridge,zz],[w/2,eave,zz],.036,M.rope);for(const xx of [-w/2,w/2])beam(g,[xx,0,zz],[xx,eave,zz],.045,M.iron);
 }
 box(g,w-.12,.09,d-.12,M.wood,0,.01,0);box(g,w-.1,eave,.08,M.dark,0,eave/2,-front+.06);
 for(const s of [-1,1]){cloth(g,12,20,(u,v)=>[s*(.77+u*.43),v*1.95,front+.10+Math.sin(u*16)*.09],M.canvasDark);beam(g,[s*.78,0,front+.03],[s*.78,2,front+.03],.03,M.iron)}beam(g,[-.8,2.03,front+.04],[.8,2.03,front+.04],.1,M.canvasDark);
 for(const xx of [-1.2,1.2])box(g,.15,.12,d+.4,M.wood,xx,-.01,0);for(let i=0;i<5;i++)box(g,1.5,.06,.18,M.wood,0,.025,front+.12+i*.22);
 for(const s of [-1,1]){box(g,.02,.48,1.05,M.dark,s*(w/2+.06),1.25,-.8);box(g,.06,.035,1.2,M.rope,s*(w/2+.08),1.52,-.8);for(let dz=-.45;dz<=.45;dz+=.15)box(g,.025,.48,.018,M.iron,s*(w/2+.09),1.25,-.8+dz)}box(g,.19,.24,.16,M.lamp,1.12,2.13,front+.18);box(g,.28,.06,.27,M.iron,1.12,2.27,front+.18);if(M.glow)lampGlow(g,M.glow,1.12,2.13,front+.30,.85);return g;
}
export function timberCrate(p,x,z,w,M,y=0){const g=group(p,x,y,z);g.rotation.y=(x*z)%1*.3;for(const side of [-1,1])for(let i=0;i<5;i++){box(g,w,.145*w,.07*w,M.wood,0,(i+.5)*.16*w,side*.47*w);box(g,.07*w,.145*w,w,M.wood,side*.47*w,(i+.5)*.16*w,0)}for(let i=0;i<5;i++)box(g,.18*w,.06*w,w,M.wood,(i-2)*.195*w,.84*w,0);for(const s of [-1,1]){for(const e of [-1,1])box(g,.085*w,.86*w,.085*w,M.iron,s*.37*w,.43*w,e*.49*w);beam(g,[-w*.4,.06,s*w*.52],[w*.4,w*.75,s*w*.52],.035,M.wood)}return g}
export function watchTower(p,x,z,h,M){const g=group(p,x,0,z);g.name='Weathered observation tower';
 for(const xx of [-1,1])for(const zz of [-1,1]){beam(g,[xx*1.85,0,zz*1.85],[xx*1.3,h,zz*1.3],.095,M.iron);for(let y=0;y<h-1;y+=2.2){beam(g,[xx*1.75,y,-1.6],[xx*1.5,y+2.2,1.5],.045,M.iron);beam(g,[-1.6,y,zz*1.75],[1.5,y+2.2,zz*1.5],.045,M.iron)}}
 for(let i=0;i<16;i++)box(g,3.8,.16,.225,M.wood,0,h,(i-7.5)*.237);
 for(const s of [-1,1]){for(let i=0;i<14;i++){const q=(i-6.5)*.21;box(g,.195,.8,.09,M.wood,q,h+.5,s*1.4);box(g,.09,.8,.195,M.wood,s*1.4,h+.5,q);box(g,.195,.37,.09,M.wood,q,h+1.87,s*1.4);box(g,.09,.37,.195,M.wood,s*1.4,h+1.87,q)}for(const a of [-1.4,0,1.4]){box(g,.07,1.95,.13,M.iron,a,h+1,s*1.44);box(g,.13,1.95,.07,M.iron,s*1.44,h+1,a)}box(g,2.8,.07,.16,M.iron,0,h+.93,s*1.42);box(g,.16,.07,2.8,M.iron,s*1.42,h+.93,0);for(let q=-1.7;q<=1.7;q+=.85)beam(g,[q,h,s*1.8],[q,h+.7,s*1.8],.025,M.iron);beam(g,[-1.8,h+.7,s*1.8],[1.8,h+.7,s*1.8],.028,M.iron)}
 for(let i=0;i<23;i++){const roof=box(g,.18,.05,3.8,M.metal,(i-11)*.17,h+2.1+.16-Math.abs(i-11)*.014,0);roof.rotation.z=i<11?.09:-.09}for(let y=.2;y<h;y+=.3)beam(g,[-.32,y,1.88],[.32,y,1.88],.025,M.iron);for(const xx of [-.36,.36])beam(g,[xx,0,1.88],[xx,h+.5,1.88],.035,M.iron);
 for(const side of [-1,1])for(const offset of [-.7,.7]){box(g,1.14,.72,.02,M.window,offset,h+1.36,side*1.38);box(g,.02,.72,1.14,M.window,side*1.38,h+1.36,offset)}
 const light=mesh(new T.CylinderGeometry(.14,.18,.3,16),M.iron,g,.2,h+.8,1.7);light.rotation.x=Math.PI/2;mesh(new T.CircleGeometry(.14,16),M.lamp,g,.2,h+.8,1.86);if(M.glow)lampGlow(g,M.glow,.2,h+.8,1.9,1.3);return {g,position:new T.Vector3(x+.2,h+.8,z+1.9)};
}
export function campTerrain(p,kits){const m=pbr(kits[1],0xd7d0bd,60,72);m.vertexColors=true;const geo=new T.PlaneGeometry(150,180,150,180);geo.rotateX(-Math.PI/2);const a=geo.attributes.position,col=[];for(let i=0;i<a.count;i++){const x=a.getX(i),z=a.getZ(i)-35,edge=smooth(T.MathUtils.clamp((Math.abs(x)-7)/6,0,1));a.setY(i,-.04+edge*(fbm(x*.13,z*.13)-.45)*.4);const track=Math.exp(-Math.pow((Math.abs(x)-2.4)/.45,2))*.22,dirt=.78+noise(x*.2,z*.2)*.18-track;col.push(dirt,dirt*.98,dirt*.91)}geo.setAttribute('color',new T.Float32BufferAttribute(col,3));geo.computeVertexNormals();mesh(geo,m,p,0,0,-35).name='Gravel terrain and worn vehicle tracks';
 // Unequal, sharply folded massifs enclose a valley. A low saddle on the
 // right frames the HDR sunset rather than hiding it behind a uniform ridge.
 for(let band=0;band<3;band++){
  const g=new T.PlaneGeometry(310,100,190,70);g.rotateX(-Math.PI/2);const a=g.attributes.position;
  for(let i=0;i<a.count;i++){
   const x=a.getX(i),z=a.getZ(i),envelope=Math.pow(Math.max(0,1-Math.pow(z/50,2)),1.1);
   const peak=(center,width,height)=>height*Math.exp(-Math.pow((x-center)/width,2));
   const profile=6+peak(-55+band*7,27,24+band*4)+peak(-105,30,21)+peak(98-band*5,32,29);
   const saddle=1-.72*Math.exp(-Math.pow((x-32)/19,2));
   const ridge=1-Math.abs(2*noise(x*.16+band*7,z*.13)-1);
   const erosion=fbm(x*.055+band*7,z*.075)*.25+.9;
   a.setY(i,Math.max(0,envelope*(profile*saddle*erosion*.85+ridge*1.2)+fbm(x*.8,z*.6)*.6));
  }
  g.computeVertexNormals();mesh(g,pbr(kits[0],[0x8d8d82,0x808b8b,0x7c8e98][band],64,22),p,band*8,-1,-96-band*49).name='Folded mountain massif';
 }

}
export function campScatter(p,rock,M){const r=seed(77012),geo=new T.IcosahedronGeometry(1,3),a=geo.attributes.position;for(let i=0;i<a.count;i++){const x=a.getX(i),y=a.getY(i),z=a.getZ(i),f=.72+fbm(x*2.4+8,z*2.4+y*1.6)*.5;a.setXYZ(i,x*f,y*f,z*f)}geo.computeVertexNormals();const o=new T.Object3D(),boulders=new T.InstancedMesh(geo,rock,92);for(let i=0;i<92;i++){const side=i%2?1:-1,large=i<28;o.position.set(side*(large?25+r()*10:11+r()*17),large?-1:-.03,12-r()*72);o.scale.setScalar(large?3+r()*6:.15+r()*.9);o.scale.y*=.6+r()*.8;o.rotation.set(r(),r()*7,r());o.updateMatrix();boulders.setMatrixAt(i,o.matrix)}boulders.castShadow=boulders.receiveShadow=true;boulders.computeBoundingSphere();p.add(boulders);
 const pebbles=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),rock,1000);for(let i=0;i<1000;i++){o.position.set((r()-.5)*74,.01,12-r()*82);o.scale.set(.025+r()*.11,.02+r()*.06,.04+r()*.14);o.rotation.set(r()*3,r()*6,r()*3);o.updateMatrix();pebbles.setMatrixAt(i,o.matrix)}pebbles.receiveShadow=true;pebbles.userData.nonSolid=true;pebbles.raycast=()=>{};pebbles.computeBoundingSphere();p.add(pebbles);
 const pos=[],uv=[];for(let i=0;i<400;i++){const x=(r()<.5?-1:1)*(10+r()*22),z=12-r()*75;for(let j=0;j<7;j++){const a=r()*6.28,h=.12+r()*.37,w=.015+r()*.025,dx=Math.cos(a)*w,dz=Math.sin(a)*w,bend=.1+r()*.1;pos.push(x-dx,0,z-dz,x+dx,0,z+dz,x+Math.sin(a)*bend,h,z+Math.cos(a)*bend);uv.push(0,0,1,0,.5,1)}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();const grass=mesh(g,new T.MeshStandardMaterial({color:0x696b43,roughness:1,side:T.DoubleSide}),p);grass.userData.nonSolid=true;grass.raycast=()=>{};grass.castShadow=false;
 for(let i=0;i<8;i++){const x=(i%2?1:-1)*(9+r()*2),z=-24-r()*14;if(Math.hypot(x-8,z+27)<4.8)continue;mesh(new T.CylinderGeometry(.29,.29,.88,24),M.metal,p,x,.44,z);for(const y of [.16,.7]){const hoop=mesh(new T.TorusGeometry(.296,.025,6,24),M.iron,p,x,y,z);hoop.rotation.x=Math.PI/2}}
}
