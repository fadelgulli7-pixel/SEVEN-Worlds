import * as T from 'three';

// Original, deterministic PBR surfaces. No remote assets or asset downloads at play time.
const clamp=x=>Math.max(0,Math.min(1,x));
function hash(x,y,s=1){let n=Math.imul(x+97,374761393)^Math.imul(y+31,668265263)^s;n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295}
function noise(x,y,s){const a=Math.floor(x),b=Math.floor(y),u=x-a,v=y-b,f=u*u*(3-2*u),g=v*v*(3-2*v);return T.MathUtils.lerp(T.MathUtils.lerp(hash(a,b,s),hash(a+1,b,s),f),T.MathUtils.lerp(hash(a,b+1,s),hash(a+1,b+1,s),f),g)}
function texture(data,size,srgb=false){const t=new T.DataTexture(data,size,size,T.RGBAFormat);t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.colorSpace=srgb?T.SRGBColorSpace:T.NoColorSpace;t.needsUpdate=true;return t}
export function surface(type,size=128){
 const color=new Uint8Array(size*size*4),normal=new Uint8Array(size*size*4),rough=new Uint8Array(size*size*4),height=new Float32Array(size*size);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const i=y*size+x,n=noise(x/18,y/18,31),fine=hash(x,y,19),vein=noise(x/5,y/5,81),cloth=(x%4===0||y%4===0)?-.09:0;
  let h=.65*n+.2*vein+.15*fine,c=.72+h*.28,r=.86;
  if(type==='camo'){const patch=noise(x/13,y/12,55)+noise(x/5,y/5,34)*.25;const rgb=patch<.43?[64,71,57]:patch<.62?[108,110,80]:patch<.8?[145,137,99]:[40,53,47];for(let j=0;j<3;j++)color[i*4+j]=rgb[j]*(.88+fine*.12+cloth);h=.5+cloth+fine*.08;r=.94}
  else {if(type==='metal'){c=.55+.35*noise(x/30,y/2,21)+fine*.1;h=vein*.12;r=.37+fine*.16}
   if(type==='wood'){h=noise(x/3,y/80,91)*.6+Math.sin(x*.4+noise(x/22,y/55,11)*5)*.09+fine*.1;c=.66+h*.38}
   if(type==='soil'){h=n*.5+vein*.2+fine*.3;c=.5+h*.5}
   if(type==='asphalt'){h=fine*.65+vein*.25;c=.55+h*.33;r=.95}
   if(type==='fabric'){h=.5+cloth+fine*.1;c=.75+h*.25;r=1}
   for(let j=0;j<3;j++)color[i*4+j]=Math.round(clamp(c)*255);
  }
  color[i*4+3]=255;height[i]=h;rough[i*4]=rough[i*4+1]=rough[i*4+2]=Math.round(r*255);rough[i*4+3]=255;
 }
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(y*size+x)*4,dx=height[y*size+(x+1)%size]-height[y*size+(x+size-1)%size],dy=height[((y+1)%size)*size+x]-height[((y+size-1)%size)*size+x];const n=new T.Vector3(-dx*2,-dy*2,1).normalize();normal[i]=(n.x*.5+.5)*255;normal[i+1]=(n.y*.5+.5)*255;normal[i+2]=(n.z*.5+.5)*255;normal[i+3]=255}
 return {map:texture(color,size,true),normalMap:texture(normal,size),roughnessMap:texture(rough,size)};
}
export function environmentLight(scene,mode){
 const w=256,h=128,data=new Uint8Array(w*h*4),farm=mode==='farm';
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const v=y/h,up=clamp(1-v*2),warm=Math.pow(Math.max(0,1-Math.hypot((x/w-.3)*3,(v-.4)*6)),8),i=(y*w+x)*4;const rgb=v<.5?[.42+up*.12,.52+up*.13,.65+up*.2]:farm?[.22,.28,.15]:[.18,.19,.21];for(let k=0;k<3;k++)data[i+k]=clamp(rgb[k]+warm*(k===2?.3:.6))*255;data[i+3]=255}
 const tex=new T.DataTexture(data,w,h,T.RGBAFormat);tex.colorSpace=T.SRGBColorSpace;tex.mapping=T.EquirectangularReflectionMapping;tex.minFilter=tex.magFilter=T.LinearFilter;tex.needsUpdate=true;scene.environment=tex;scene.environmentIntensity=farm?.6:.48;
}
export function finishSurfaces(scene,mode){
 const kits={},clones=new Map();const get=k=>kits[k]??=surface(k);const colors=new T.Color();
 scene.traverse(o=>{if(!o.isMesh||Array.isArray(o.material)||!o.material.isMeshStandardMaterial||o.material.map||o.material.transparent)return;
  const m=o.material,c=m.color,key=m.uuid;let kind=m.userData.surface;
  if(!kind){colors.copy(c);if(m.metalness>.35)kind='metal';else if(mode==='farm'&&c.r>c.g*1.1&&c.g>c.b*1.2)kind='wood';else kind='stone'}
  if(!clones.has(key)){const clone=m.clone(),kit=get(kind);Object.assign(clone,kit);clone.normalScale.setScalar(kind==='metal'?.16:kind==='fabric'?.25:.4);clones.set(key,clone)}o.material=clones.get(key);
 });
 environmentLight(scene,mode);
}
