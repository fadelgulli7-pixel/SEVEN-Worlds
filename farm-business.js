// The farm economy is local play currency. Each mutating operation is atomic and checked.
export const SPECIES={cow:{name:'Cow',plural:'Cows',cost:90,feed:2,seconds:24,item:'milk',price:9,color:'#b9c7ab'},chicken:{name:'Chicken',plural:'Chickens',cost:35,feed:1,seconds:16,item:'egg',price:5,color:'#efc77c'},goat:{name:'Goat',plural:'Goats',cost:70,feed:2,seconds:28,item:'goatMilk',price:12,color:'#c6ab93'}};
export const LAND_COST=[180,340,560,850];
export const ROLES={harvest:'Harvest ripe fields',ranch:'Feed & collect animals',plant:'Plant wheat (keeps 20 coins)'};
export function adoptFarm(s){
 if(!Array.isArray(s.herd)){s.herd=[];for(const [kind,n] of [['cow',3],['chicken',5]])for(let i=0;i<n;i++)s.herd.push({id:kind+'-'+(i+1),kind,readyAt:0});s.feedStock=30;s.nextAnimalId=9;s.land=0;s.workers=[];s.goatMilk=0;s.workerEnabled=true;s.shipment=null;s.salesTotal=0;}
 s.feedStock=Math.max(0,Number(s.feedStock)||0);s.goatMilk=Math.max(0,Number(s.goatMilk)||0);s.land=Math.max(0,Math.min(4,Math.floor(Number(s.land)||0)));s.workers??=[];s.workerEnabled??=true;s.nextAnimalId??=s.herd.length+1;s.salesTotal??=0;
 // Existing field timers are retained; expansion increases capacity instead of replacing fields.
 s.plots=Array.isArray(s.plots)?s.plots:[];while(s.plots.length<6+s.land*3)s.plots.push(null);
 return s;
}
const fail=reason=>({ok:false,reason});
export function buyAnimal(s,kind){const a=SPECIES[kind];if(!a)return fail('Unknown animal.');const n=s.herd.filter(x=>x.kind===kind).length,capacity=kind==='chicken'?8+s.land*4:4+s.land*2;if(n>=capacity)return fail('Buy more land to increase the animal capacity.');if(s.coins<a.cost)return fail('Earn more game coins from your farm first.');s.coins-=a.cost;s.herd.push({id:kind+'-'+s.nextAnimalId++,kind,readyAt:0});return {ok:true,reason:a.name+' added to your farm.'}}
export function feedAnimal(s,id,now){const a=s.herd.find(x=>x.id===id);if(!a)return fail('Animal not found.');if(a.readyAt)return fail(a.readyAt<=now?'Collect this animal’s produce first.':'This animal is still producing.');const cfg=SPECIES[a.kind];if(s.feedStock<cfg.feed)return fail('Not enough feed. Buy a feed bag in the Farm shop.');s.feedStock-=cfg.feed;a.readyAt=now+cfg.seconds*1000;return {ok:true}}
export function collectAnimal(s,id,now){const a=s.herd.find(x=>x.id===id);if(!a?.readyAt||a.readyAt>now)return fail('Produce is not ready yet.');const item=SPECIES[a.kind].item;s[item]=(s[item]||0)+1;a.readyAt=0;return {ok:true,item}}
export function feedHerd(s,now){let fed=0,collected=0;for(const a of s.herd)if(a.readyAt&&a.readyAt<=now){collectAnimal(s,a.id,now);collected++}for(const a of s.herd)if(!a.readyAt&&feedAnimal(s,a.id,now).ok)fed++;return {fed,collected}}
export function buyFeed(s){if(s.coins<20)return fail('A bag of 10 feed costs 20 game coins.');s.coins-=20;s.feedStock+=10;return {ok:true,reason:'10 feed added to the silo.'}}
export function buyLand(s){if(s.land>=4)return fail('All four land expansions are owned.');const cost=LAND_COST[s.land];if(s.coins<cost)return fail('Not enough game coins for this land.');s.coins-=cost;s.land++;s.plots.push(null,null,null);return {ok:true,reason:'Land expanded: 3 new fields and more animal space.'}}
export function hireWorker(s){if(s.workers.length>=3)return fail('Your team already has three workers.');const cost=140+s.workers.length*100;if(s.coins<cost)return fail('Not enough game coins to hire a worker.');s.coins-=cost;const roles=['harvest','ranch','plant'];s.workers.push({id:'worker-'+(s.workers.length+1),role:roles[s.workers.length]});return {ok:true,reason:'Worker hired. Choose their job below.'}}
export function assignWorker(s,id,role){if(!Object.hasOwn(ROLES,role))return fail('Unknown job.');const w=s.workers.find(x=>x.id===id);if(!w)return fail('Worker not found.');w.role=role;return {ok:true}}
export function harvestField(s,i,now,crops){const p=s.plots[i];if(!p||p.end>now)return false;s.harvest++;s.bagValue=(s.bagValue||0)+crops[p.crop].value;s.plots[i]=null;return true}
export function workFarm(s,now,crops){
 let changed=false;if(!s.workerEnabled)return changed;
 // One bounded action per worker/tick. No background/offline catch-up or unlimited earning.
 for(const w of s.workers){if(w.role==='harvest'){const i=s.plots.findIndex(p=>p&&p.end<=now);if(i>=0)changed=harvestField(s,i,now,crops)||changed}
  if(w.role==='ranch'){const ready=s.herd.find(a=>a.readyAt&&a.readyAt<=now),hungry=s.herd.find(a=>!a.readyAt&&SPECIES[a.kind].feed<=s.feedStock);if(ready)changed=collectAnimal(s,ready.id,now).ok||changed;else if(hungry)changed=feedAnimal(s,hungry.id,now).ok||changed}
  if(w.role==='plant'){const i=s.plots.findIndex(p=>!p),c=crops[0];if(i>=0&&s.coins>=20+c.cost){s.coins-=c.cost;s.plots[i]={crop:0,end:now+c.seconds*1000*(1-s.upgrade*.1)};changed=true}}
 }
 return changed;
}
export function inventoryValue(s){return (s.bagValue||0)+s.egg*5+s.milk*9+(s.goatMilk||0)*12}
export function loadTruck(s,now,order=null){
 if(s.shipment)return fail('The truck is already on a delivery.');let value=0,items;
 if(order){s.deliveries??=[];if(s.deliveries.includes(s.level))return fail('This level’s order is already loaded or delivered.');if(s.harvest<order.crops||s.egg<order.eggs||s.milk<order.milk)return fail('Collect the required crops, eggs and milk first.');const cv=Math.floor((s.bagValue||0)*order.crops/s.harvest);items={crops:order.crops,eggs:order.eggs,milk:order.milk,goatMilk:0};value=cv+order.eggs*5+order.milk*9+order.bonus;s.harvest-=order.crops;s.bagValue-=cv;s.egg-=order.eggs;s.milk-=order.milk;s.deliveries.push(s.level);}
 else{value=inventoryValue(s);if(value<=0)return fail('Collect crops, eggs or milk before loading the truck.');items={crops:s.harvest,eggs:s.egg,milk:s.milk,goatMilk:s.goatMilk||0};s.harvest=s.bagValue=s.egg=s.milk=s.goatMilk=0;}
 s.shipment={startedAt:now,arrivesAt:now+8000,value,items,kind:order?'order':'market'};return {ok:true,value};
}
export function settleFarm(s,now){let changed=false,value=0,legacy=false;
 // Honor produce that was already paid for in the previous version.
 if(s.animalReady&&s.animalReady<=now){s.egg+=2;s.milk++;s.animalReady=0;legacy=changed=true}
 if(s.shipment&&now>=s.shipment.arrivesAt){value=s.shipment.value;s.coins+=value;s.score+=value;s.salesTotal+=value;s.shipment=null;changed=true}
 return {changed,value,legacy};
}
