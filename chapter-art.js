import {T,box,cyl,mesh,group,mat} from './visuals.js?v=studio';

const skyColors = [
 ['#7196ab','#ffd99a',0xb1806f],['#8db9c0','#fce0a9',0xcba883],
 ['#6589a7','#bed3d3',0x91aab4],['#9ab9cd','#e5edf0',0xbdccda],
 ['#353756','#ce8f93',0x827788],['#679299','#f1d5ae',0x8fa7a2],
 ['#7d7695','#f9bc90',0xa78891]
];
export const chapterSky = index => skyColors[index];

export function chapterLandmark(parent,chapter) {
 const root=group(parent,0,0,-64);
 root.name=['Gatehouse','Canvas market','Cargo terminal','Weather station','City skyline','Cable station','Flight terminal'][chapter];
 const steel=mat(0x424e58,.55,.35), concrete=mat(0xa49c8e), timber=mat(0x846c52);
 const light=new T.MeshStandardMaterial({color:0xffd8aa,emissive:0xffad73,emissiveIntensity:1.2});
 if(chapter===0){
  for(const x of [-9,9]){box(root,4,9,4,timber,x,4.5,0);box(root,5,.45,5,steel,x,9,0)}
  box(root,20,.8,2,timber,0,7.3,0);box(root,7,.22,.18,light,0,7.55,1.1);
 }else if(chapter===1){
  for(let i=0;i<5;i++){
   const x=(i-2)*6, z=-Math.abs(i-2)*2;
   for(const a of [-2.4,2.4])box(root,.15,5,.15,timber,x+a,2.5,z);
   const canopy=mesh(new T.ConeGeometry(4,2.8,4),mat(i%2?0xa65d47:0xe5c894),root,x,5,z);
   canopy.rotation.y=Math.PI/4;
  }
 }else if(chapter===2){
  for(const x of [-13,13]){
   box(root,.8,19,1,steel,x,9.5,0);box(root,14,.7,1,steel,x,19,0);
   box(root,.09,8,.09,steel,x+5,15,0);
  }
  for(let i=0;i<9;i++)box(root,5,2.2,2.7,mat([0x657b82,0xa6634b,0x64766c][i%3]),(i%5-2)*5.3,.9+Math.floor(i/5)*2.4,2);
 }else if(chapter===3){
  for(const x of [-12,10]){
   cyl(root,.45,.7,8,steel,x,4,0);
   const dish=mesh(new T.SphereGeometry(4,20,10,0,2*Math.PI,0,.85),mat(0xe4eced),root,x,8,0);
   dish.rotation.x=1.06;
  }
  box(root,8,3.5,4,concrete,0,1.75,-2);
 }else if(chapter===4){
  for(let i=0;i<7;i++){
   const x=(i-3)*5,h=[10,17,13,23,18,12,16][i];
   box(root,4.3,h,5,steel,x,h/2,-5);
   for(let y=3;y<h;y+=3)box(root,3.7,.28,.08,light,x,y,-2.42);
  }
 }else if(chapter===5){
  for(const x of [-16,16]){box(root,1,15,1.2,steel,x,7.5,0);box(root,6,.48,2,steel,x,15,0)}
  for(const z of [-.6,.6])box(root,38,.10,.10,steel,0,14.8,z);
  for(const x of [-7,5]){box(root,.14,2,.14,steel,x,13.9,0);box(root,3,2.3,2,mat(0x9d4d42),x,12,0);box(root,2.7,.7,.06,mat(0x7ba9ad),x,12.3,1.04)}
 }else{
  box(root,29,5.5,7,concrete,-1,2.75,0);box(root,31,.6,8,steel,-1,5.8,0);
  for(let i=0;i<8;i++)box(root,2.6,1,.06,light,-12+i*3.1,4.3,3.55);
  box(root,3.5,13,3.5,concrete,12,6.5,-2);box(root,6,2.6,6,steel,12,14,-2);
 }
 return root;
}
