import {T,mat,mesh,bevel,box,ball,cyl,group} from './visuals.js?v=studio';
export function rescueHelicopter(parent,x,z){
 const g=group(parent,x,.2,z),paint=mat(0x47595c,.46,.4),trim=mat(0x263437,.48,.55),glass=new T.MeshPhysicalMaterial({color:0x33515b,roughness:.08,metalness:.55,clearcoat:1});
 ball(g,0,1.55,0,1.12,.99,2.2,paint);ball(g,0,1.45,1.65,.9,.72,.8,paint);
 // Separate windshields and center framing, not one bright blue bubble.
 for(const s of [-1,1]){const screen=ball(g,s*.39,1.95,1.83,.43,.47,.38,glass);screen.rotation.z=s*.12;bevel(g,.025,.67,.77,glass,s*1.08,1.84,.55,.04);bevel(g,.04,1.24,1.16,paint,s*1.1,1.34,-.65,.06);bevel(g,.055,.48,.7,glass,s*1.13,1.64,-.65,.06);box(g,.08,.035,.18,0xb6c3ba,s*1.15,1.29,-.3);box(g,.02,.055,.56,0xc5ba8b,s*1.16,1.05,-.6)}
 const spine=box(g,.06,.85,.04,trim,0,1.93,2.16);spine.rotation.x=.24;bevel(g,1.6,.07,.09,trim,0,1.52,2.21,.02);
 const tail=cyl(g,.12,.43,4.5,0x44585a,0,1.58,-3.8,24);tail.rotation.x=-Math.PI/2;
 const fin=box(g,.12,1.65,.85,paint,0,2.07,-5.8);fin.rotation.x=-.28;bevel(g,2.5,.08,.65,paint,0,1.85,-4.75,.03);
 const rearRotor=group(g,.2,2,-5.8);for(let i=0;i<3;i++){let b=bevel(rearRotor,.045,.13,1.5,trim,0,0,0,.01);b.rotation.x=i*Math.PI/3}
 for(const s of [-1,1]){for(const zz of [-1.2,1.1]){const leg=cyl(g,.055,.055,1,trim,s*.93,.42,zz);leg.rotation.z=-s*.25}const skid=mesh(new T.CapsuleGeometry(.075,4.2,5,12),trim,g,s*1.1,.08,0);skid.rotation.x=Math.PI/2}
 bevel(g,.75,.48,1.4,paint,0,2.5,-.25,.15);for(const s of [-1,1]){const exhaust=cyl(g,.15,.18,.45,trim,s*.47,2.52,-1);exhaust.rotation.x=Math.PI/2}
 cyl(g,.095,.095,.6,trim,0,2.99,0,20);const rotor=group(g,0,3.27,0);rotor.userData.dynamic=true;
 for(let i=0;i<4;i++){const blade=group(rotor);blade.rotation.y=i*Math.PI/2;bevel(blade,.23,.035,4.5,trim,.08,0,2.4,.014);box(blade,.24,.036,.35,0xc7c5ac,.08,0,4.48)}
 ball(g,0,1.13,2.38,.13,.12,.04,new T.MeshStandardMaterial({color:0xf1e6b5,emissive:0xffe7a0,emissiveIntensity:.65}));
 return {model:g,rotor};
}
