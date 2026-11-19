export const FARM_CHAPTERS=['Meadow beginnings','Orchard valley','River terraces','Golden plains','Highland harvest','Moonlit gardens','Royal estate'];
export const SNIPER_CHAPTERS=['Outpost dawn','Desert crossing','Harbor watch','Winter signal','City shadows','Mountain passage','Final extraction'];
export const fresh=()=>({level:1,unlocked:1,coins:100,upgrade:0,score:0,harvest:0,egg:0,milk:0,plots:Array(6).fill(null),completed:[],animalReady:0});
export function config(game,level){return game==='farm'?{target:35+level*15,reward:25+level*5}:{target:2+Math.floor(level/6),seconds:75+Math.floor(level/11)*10,reward:20+level*4,speed:.2+level*.012}}
export function finish(s,game){let l=s.level,first=!s.completed.includes(l);if(first){s.completed.push(l);s.coins+=config(game,l).reward;s.unlocked=Math.min(77,Math.max(s.unlocked,l+1))}s.score=0;s.level=Math.min(77,l+1);return {first,level:l,reward:first?config(game,l).reward:0}}
export function loadState(storage){let base={farm:fresh(),sniper:fresh()};try{const v=JSON.parse(storage.getItem('seven3d-v2')||storage.getItem('seven77v1'));for(const k of ['farm','sniper'])if(v?.[k]){let a=v[k];base[k]={...fresh(),...a,level:Math.max(1,Math.min(77,Number(a.level)||1)),unlocked:Math.max(1,Math.min(77,Number(a.unlocked)||1)),completed:Array.isArray(a.completed)?a.completed.filter(l=>l>=1&&l<=77):[],plots:Array.isArray(a.plots)&&a.plots.length>=6&&a.plots.length<=18?a.plots:Array(6).fill(null)}}}catch{}return base}

const operations=[
 {type:'extract',title:'Team extraction',brief:'Clear the route, then escort both teammates to the aircraft.'},
 {type:'relay',title:'Signal relay',brief:'Clear the route and activate the rescue beacon to call the aircraft.'},
 {type:'supply',title:'Supply recovery',brief:'Escort the team to the supply cache, collect the cargo and reach the aircraft.'}
];
export function operationFor(level){return operations[(level-1)%operations.length]}
