import {browserSaveLock,progressWriter} from './progress.js?v=studio';
import {GameAudio} from './audio.js?v=studio';
import {SPECIES,LAND_COST,ROLES,adoptFarm,buyAnimal,feedAnimal,collectAnimal,feedHerd,buyFeed,buyLand,hireWorker,assignWorker,harvestField,workFarm,inventoryValue,loadTruck,settleFarm} from './farm-business.js?v=studio';
import {T} from './visuals.js?v=studio';
import {Farm,CROPS} from './farm.js?v=studio';
import {Sniper} from './sniper.js?v=studio';
import {UrbanRescue,URBAN_MISSION} from './urban-rescue.js?v=studio';
import {config,finish,loadState,FARM_CHAPTERS,SNIPER_CHAPTERS,operationFor} from './state.js?v=studio';
import {contractFor,deliver,rating,adoptExtras} from './economy.js?v=studio';

const $=id=>document.getElementById(id);
let storage;
try { storage=globalThis.localStorage; } catch {}
function readProgress(){
 const current=adoptExtras(loadState(storage));
 adoptFarm(current.farm);
 return current;
}
const state=readProgress();
let urbanMode=true,campMode=true;
function missionSpec(){return game==='sniper'&&urbanMode?URBAN_MISSION:config(game,state[game].level)}
let game='farm',world=null,pick=null,crop=0,messageTimer=0,renderer,modalPause=null,panelPause=null;
let prefs={quality:'balanced',sound:true,sensitivity:1};
try{prefs={...prefs,...JSON.parse(localStorage.getItem('seven-world-settings')||'{}')}}catch{}
const viewport=$('viewport'),map=$('minimap').getContext('2d');
function toast(t){if($('panel').open){$('panelNotice').hidden=false;$('panelNotice').textContent=t}$('worldMessage').textContent=t;$('worldMessage').classList.add('show');clearTimeout(messageTimer);messageTimer=setTimeout(()=>$('worldMessage').classList.remove('show'),3600)}
const save=progressWriter({
 state,read:readProgress,lock:browserSaveLock(),
 write:latest=>storage.setItem('seven3d-v2',JSON.stringify(latest)),
 onChange(keys,conflicts){
  if(keys.includes(game)){
   if(game==='farm'||!world?.round||conflicts.includes(game))switchGame(game);
   else update();
  }
  if(conflicts.length)toast('Another tab saved this world first. Its latest progress is now open.');
 },
 onError(){toast('Device storage is unavailable. Progress is kept in this session.')}
});
window.addEventListener('storage',event=>{if(event.key==='seven3d-v2'||event.key===null)save()});
function savePrefs(){try{localStorage.setItem('seven-world-settings',JSON.stringify(prefs))}catch{}}
const audio=new GameAudio();audio.setEnabled(prefs.sound);
function sound(kind='tap',pan=0){if(!prefs.sound)return;if(!audio.context)audio.unlock().then(ok=>{if(ok)audio.play(kind,pan)});else audio.play(kind,pan)}
function audioUI(){for(const id of ['briefSound']){const el=document.getElementById(id);if(el)el.checked=prefs.sound}$('combatSound').textContent=prefs.sound?'♫':'♪̸';$('combatSound').setAttribute('aria-label',prefs.sound?'Mute sound':'Enable sound');$('combatSound').setAttribute('aria-pressed',String(prefs.sound));}
function setSound(v){prefs.sound=!!v;audio.setEnabled(prefs.sound);savePrefs();audioUI();if(v)audio.unlock().then(ok=>{if(ok)sound();else toast('Sound could not start. Check browser audio permissions.');});}
$('briefSound').onchange=e=>setSound(e.target.checked);$('combatSound').onclick=()=>setSound(!prefs.sound);
try{
 renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
 renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 viewport.appendChild(renderer.domElement);
}catch(e){globalThis.sevenLobby?.setReady(false,'3D could not start. Open this game in a browser with WebGL enabled.');$('loading').textContent='3D could not start on this browser. Please enable WebGL or open in an updated Chrome browser.';throw e}
function quality(){renderer.setPixelRatio(Math.min(devicePixelRatio,prefs.quality==='low'?1:prefs.quality==='high'?2:1.4));renderer.shadowMap.enabled=prefs.quality!=='low';world?.setQuality?.(prefs.quality);resize()}
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();$('loading').hidden=false;$('loading').textContent='Graphics paused by the device. Reload to restore your saved progress.'});
function resize(){const w=Math.max(1,viewport.clientWidth),h=Math.max(1,viewport.clientHeight);renderer.setSize(w,h,false);world?.resize(w,h)}
new ResizeObserver(resize).observe(viewport);
function switchGame(k){
 audio.stop();$('routeAction').hidden=true;if(world)world.dispose();game=k;pick=null;down=null;activePointers.clear();const f=k==='farm';globalThis.sevenLobby?.setReady(false);document.body.classList.toggle('camp',!f&&urbanMode&&campMode);document.body.classList.toggle('sniper',!f);document.body.classList.remove('paused');document.body.classList.remove('playing');document.body.classList.remove('cinematic');document.body.classList.toggle('urban',!f&&urbanMode);$('urbanObjective').hidden=true;$('exitCombat').hidden=true;for(const id of ['armorPanel','threatWarning','zoomControl','cover','combatSound'])$(id).hidden=true;$('damageVignette').style.opacity=0;document.body.classList.remove('inCover');document.body.classList.remove('engaged');audioUI();
 for(const id of ['farmActions','farmHint','cameraHome','sell','contract'])$(id).hidden=!f;
 for(const id of ['sniperIntro','retry','compass'])$(id).hidden=f;
 for(const id of ['farmPick','seedBar','crosshair','scopeMask','targetInfo','breathBar','sniperActions','sniperHud'])$(id).hidden=true;
 $('farmTab').classList.toggle('selected',f);$('sniperTab').classList.toggle('selected',!f);$('brandTitle').textContent=f?'SEVEN FARM':'SEVEN SNIPER';$('loading').hidden=false;
 const MissionClass=urbanMode?UrbanRescue:Sniper;
 world=f?new Farm(renderer,state.farm,select):new MissionClass(renderer,state.sniper,{toast,change:roundUI,tick:tick,shot:shot,audio:sound,damage:()=>{},end:endMission,scan:scan,phase:(title,detail)=>{$('urbanPhase').textContent=title;$('urbanDetail').textContent=detail},cinema:(active,scoped)=>{document.body.classList.toggle('cinematic',active);$('scopeMask').hidden=active||!scoped;$('crosshair').hidden=active;$('breathBar').hidden=active;$('targetInfo').hidden=true;$('scopeLabel').textContent=scoped?'Scope ×1':'Scope ×3'},hit:()=>{$('crosshair').classList.add('hit');setTimeout(()=>$('crosshair').classList.remove('hit'),160)}},{theme:campMode?'camp':'city'});
 if(!f)world.sensitivity=Number(prefs.sensitivity)||1;world.setQuality?.(prefs.quality);resize();if(f)world.home();$('loading').hidden=true;update();drawMap();
 if(world.ready){const current=world;$('loading').textContent=campMode?'Preparing Mountain Outpost · textures, models and sunset lighting…':'Preparing Old Quarter · about 23 MB on your first visit…';$('loading').hidden=false;$('start').disabled=true;world.ready.then(()=>{if(world!==current)return;$('loading').hidden=true;$('start').disabled=false;globalThis.sevenLobby?.setReady(true);update()}).catch(()=>{if(world!==current)return;globalThis.sevenLobby?.setReady(false,'Loading failed. Retry to reload this operation.');$('loading').innerHTML='<b>The environment could not finish loading.</b><p>Check your connection and try again.</p><button id=retryWorld>Try again</button>';$('retryWorld').onclick=()=>switchGame('sniper')})}else{$('start').disabled=false;globalThis.sevenLobby?.setReady(true);}
}
function quickStats(){
 const s=state[game],f=game==='farm',chapter=Math.floor((s.level-1)/11),a=world?.round;
 $('quickLabel').textContent=f?'GROWING':'ACCURACY';$('quickLabelB').textContent=f?'READY TO HARVEST':'BEST RATING';
 $('quickA').textContent=f?`${s.plots.filter(p=>p&&p.end>Date.now()).length} / ${s.plots.length}`:a?.shots?Math.round(a.hits/a.shots*100)+'%':'—';
 $('readyCount').textContent=f?s.plots.filter(p=>p&&p.end<=Date.now()).length:0;
 $('quickB').textContent=f?s.plots.filter(p=>p&&p.end<=Date.now()).length:'★'.repeat(s.ratings[s.level]||0)||'—';
 $('quickC').textContent=`${s.completed.filter(l=>Math.floor((l-1)/11)===chapter).length} / 11`;
}
function update(){
 const s=state[game],f=game==='farm',c=missionSpec(),chapter=Math.floor((s.level-1)/11),name=(f?FARM_CHAPTERS:SNIPER_CHAPTERS)[chapter];
 $('level').textContent=s.level;$('coins').textContent=s.coins;$('chapter').textContent=name;$('worldLabel').textContent=`CHAPTER ${chapter+1} / 7 · ${name}`;
 $('missionName').textContent='Rescue the team';$('operationLabel').textContent=`OPERATION ${String(s.level).padStart(2,'0')} / 77`;$('briefTargets').textContent=String(c.target).padStart(2,'0');$('briefTime').textContent=c.seconds+'s';$('goalLine').textContent=f?`${s.score} / ${c.target} market coins`:`${c.target} hostiles · 2 teammates`;
 $('marketNavLabel').textContent=f?'Market':'Mission';$('equipmentNavLabel').textContent=f?'Farm shop':'Armory';$('panelEyebrow').textContent=f?'FARM MANAGEMENT':'MISSION CONTROL';
 $('equipmentArt').innerHTML=(f?$('openSeeds'):$('scope')).querySelector('svg').outerHTML;$('upgradeTiers').innerHTML=Array.from({length:5},(_,i)=>`<span class="${i<s.upgrade?'filled':''}"></span>`).join('');
 $('progress').style.width=Math.min(100,s.score/c.target*100)+'%';
 $('objectiveTitle').textContent=f?'Your harvest, your progress':'Extraction briefing';$('objectiveCount').textContent=f?`${s.score} / ${c.target}`:`${c.target} guards`;
 $('objectiveText').textContent=f?`Earn ${c.target} coins from produce or village deliveries to unlock the next level.`:`Neutralize ${c.target} red-marked guards. Two teammates must reach the helicopter within ${c.seconds} seconds.`;
 $('inventory').innerHTML=f?`<div>Harvest<b translate="no">${s.harvest}</b>Crops</div><div>Collected<b translate="no">${s.egg}</b>Eggs</div><div>Collected<b translate="no">${s.milk}</b>Milk</div><div>Collected<b translate="no">${s.goatMilk||0}</b>Goat milk</div>`:`<div>Optics<b translate="no">${s.upgrade+1}</b>Tier</div><div>Reward<b translate="no">${c.reward}</b>Game coins</div><div>Campaign<b translate="no">${s.completed.length}</b>Completed</div>`;
 $('shopTitle').textContent=f?'Build your farm':'Equipment';
 $('shopText').textContent=f?'Raise animals, hire help and turn your first fields into a growing estate.':'Optics upgrades steady your view and slow target movement in scoped aiming. Earn coins by completing new missions.';
 $('upgrade').textContent=s.upgrade>=5?'Fully upgraded':`${f?'Upgrade irrigation':'Upgrade optics'} · ${60*(s.upgrade+1)} coins`;
 $('upgrade').disabled=s.upgrade>=5||s.coins<60*(s.upgrade+1)||!!world.round;
 if(f){
  world.refresh();if(pick)showPick();const order=contractFor(s.level),done=s.deliveries.includes(s.level);
  $('contractNeeds').textContent=done?(s.shipment?.kind==='order'?'Order loaded. Payment arrives when the truck returns.':'Order delivered. The village thanks you.'):`${s.harvest}/${order.crops} crops · ${s.egg}/${order.eggs} eggs · ${s.milk}/${order.milk} milk. Receive their sale value + ${order.bonus} bonus coins.`;
  $('deliver').textContent=done?(s.shipment?.kind==='order'?'Order on the road':'Delivery complete'):'Deliver village order';$('deliver').disabled=done||s.harvest<order.crops||s.egg<order.eggs||s.milk<order.milk;
  $('plantAll').disabled=s.coins<CROPS[crop].cost||s.plots.every(Boolean);document.querySelectorAll('[data-crop]').forEach(b=>b.classList.toggle('selected',Number(b.dataset.crop)===crop));
  $('sell').disabled=!(s.harvest||s.egg||s.milk);
 }else if(!world.round){$('timer').textContent=c.seconds+'s';$('threats').textContent=c.target+' guards';$('health').textContent='Team safe';$('ammo').textContent='5/5';$('scopeLabel').textContent='Scope ×3';$('focusLabel').textContent='Hold breath';$('reloadLabel').textContent='Reload'}
 if(!f){$('urbanMode').classList.toggle('selected',urbanMode);$('campaignMode').classList.toggle('selected',!urbanMode);$('briefCopy').textContent=urbanMode?'Two civilians are trapped at the checkpoint. The guards return fire. Pick your opening, then get behind cover.':'Clear the outpost. Bring everyone home.';$('briefHint').textContent=urbanMode?'Drag to aim · C to cover · Z to scope · R to reload. Turn sideways for a wider view.':'Drag to aim · Scope for precision · Protect green markers';if(urbanMode){$('level').textContent='01';$('chapter').textContent='Old Quarter';$('worldLabel').textContent='OLD QUARTER · URBAN RESCUE';$('missionName').textContent=URBAN_MISSION.title;$('operationLabel').textContent='OLD QUARTER · RESCUE';$('objectiveText').textContent='Stop three armed threats and protect both civilians. Guards aim, fire bursts and retreat behind barriers. Take cover to avoid their shots and recover armor. Fire when they expose themselves. A civilian hit fails the mission.';$('shopText').textContent='The urban mission uses fixed equipment. Campaign optics upgrades apply to the 77-operation campaign.';$('upgrade').disabled=true;$('goalLine').textContent=world.round?`${world.round.hits} / 3 threats stopped`:'3 threats · 2 civilians · 100 seconds';$('progress').style.width=(world.round?world.round.hits/3*100:0)+'%';$('objectiveTitle').textContent='Old Quarter briefing';$('inventory').innerHTML='<div>Threats<b>3</b>Identify</div><div>Civilians<b>2</b>Protect</div><div>Objective<b>1</b>Rescue</div>'}}
 for(const id of ['fire','reload','scope','focus','pause'])$(id).disabled=f||!world.round;
 if(!f&&urbanMode&&campMode){$('level').textContent=s.level;$('chapter').textContent='Mountain Outpost';$('worldLabel').textContent='MOUNTAIN OUTPOST · SUNSET';$('missionName').textContent='Rescue the Team';$('goalLine').textContent=world.round?`${world.round.hits} / 3 threats stopped`:'3 guards · 2 teammates · 100 seconds';$('operationLabel').textContent='MOUNTAIN OUTPOST · RESCUE';
  $('briefCopy').textContent='Two field teammates are waiting in the outpost. Bring them to the evacuation pad.';
  $('objectiveTitle').textContent='Mountain Outpost';$('objectiveText').textContent=$('briefCopy').textContent;
  $('inventory').innerHTML='<div>Guards<b>3</b>Identify</div><div>Teammates<b>2</b>Protect</div><div>Evacuation pad<b>1</b>Reach</div>';}
 if(!f&&!urbanMode){
  const op=operationFor(s.level);$('missionName').textContent=op.title;
  $('objectiveTitle').textContent=op.title;$('objectiveText').textContent=op.brief;$('briefCopy').textContent=op.brief;
 }
 globalThis.sevenLobby?.sync(state.sniper,game,urbanMode?(campMode?'camp':'city'):'campaign',!!world.round);
 quickStats();renderFarmBusiness();
}
function select(p){if(p.kind==='truck'){openPanel('mission');return}pick=p;$('seedBar').hidden=true;world.select?.(p);showPick()}
function showPick(){
 let s=state.farm;$('farmPick').hidden=false;
 if(pick.kind==='plot'){
  let p=s.plots[pick.index];$('pickTitle').textContent=`FIELD ${pick.index+1} · ${p?CROPS[p.crop].name:CROPS[crop].name}`;
  if(!p){$('pickDetail').textContent=`Plant ${CROPS[crop].name.toLowerCase()} for ${CROPS[crop].cost} coins. Open Plant to choose another seed.`;$('pickAction').textContent='Plant seed';$('pickAction').disabled=s.coins<CROPS[crop].cost}
  else{let ready=p.end<=Date.now();$('pickDetail').textContent=ready?'Crop is ready to harvest.':`Growing · ${Math.ceil((p.end-Date.now())/1000)} seconds left`;$('pickAction').textContent=ready?'Harvest crop':p.watered?'Already watered':'Water · −3 seconds';$('pickAction').disabled=!ready&&p.watered}
 }else if(pick.kind==='land'){
  $('pickTitle').textContent='GROW YOUR ESTATE';$('pickDetail').textContent='Add 3 fields and more space for cows, chickens and goats.';$('pickAction').textContent=`Buy land · ${LAND_COST[s.land]} coins`;$('pickAction').disabled=s.land>=4||s.coins<LAND_COST[s.land];
 }else{
  const a=s.herd.find(x=>x.id===pick.id);if(!a){$('farmPick').hidden=true;return}const c=SPECIES[a.kind],ready=a.readyAt&&a.readyAt<=Date.now(),busy=a.readyAt>Date.now();
  $('pickTitle').textContent=c.name.toUpperCase();$('pickDetail').textContent=ready?'Produce ready. Collect it, then sell it with the market truck.':busy?`Producing · ${Math.ceil((a.readyAt-Date.now())/1000)} seconds left`:`${c.feed} feed from the silo → one produce. ${c.seconds} seconds. ${s.feedStock} feed available.`;
  $('pickAction').textContent=ready?'Collect produce':busy?'Producing…':`Feed · ${c.feed} feed`;$('pickAction').disabled=!!busy||(!ready&&s.feedStock<c.feed);
 }
}
function plant(i){const s=state.farm,c=CROPS[crop];if(s.plots[i]||s.coins<c.cost)return false;s.coins-=c.cost;s.plots[i]={crop,end:Date.now()+c.seconds*1000*(1-s.upgrade*.1)};return true}
function harvestOne(i){return harvestField(state.farm,i,Date.now(),CROPS)}
function farmFinish(){const s=state.farm;let reward=0,done=0;while(s.score>=config('farm',s.level).target){const left=s.score-config('farm',s.level).target,result=finish(s,'farm');reward+=result.reward;done++;s.score=result.level===77?0:left;if(result.level===77)break}if(done){sound('win');toast(`${done} farm ${done===1?'level':'levels'} complete! +${reward} game coins.`)}}
$('pickAction').onclick=()=>{if(!pick)return;if(pick.kind==='animal')return careFor(pick.id);if(pick.kind==='land')return farmAction(buyLand(state.farm),true);const s=state.farm,i=pick.index,p=s.plots[i];if(!p)plant(i);else if(!harvestOne(i)&&!p.watered){p.end-=3000;p.watered=true;toast('Field watered. Growth accelerated.')}sound();save();update()};
$('closePick').onclick=()=>{pick=null;$('farmPick').hidden=true;world.select?.(null)};
$('openSeeds').onclick=()=>{pick=null;$('farmPick').hidden=true;world.select?.(null);$('seedBar').hidden=!$('seedBar').hidden};$('closeSeeds').onclick=()=>{$('seedBar').hidden=true};
$('harvest').onclick=()=>{let n=0;for(let i=0;i<state.farm.plots.length;i++)if(harvestOne(i))n++;toast(n?`${n} crops harvested.`:'No ripe crops yet. Tap a field to plant or water.');if(n)sound();save();update()};
$('feed').onclick=()=>openPanel('ranch');
$('sell').onclick=()=>sendTruck();
$('deliver').onclick=()=>sendTruck(contractFor(state.farm.level));
$('plantAll').onclick=()=>{let n=0;for(let i=0;i<state.farm.plots.length;i++)if(plant(i))n++;if(n){$('seedBar').hidden=true;toast(`Planted ${n} fields with ${CROPS[crop].name.toLowerCase()}.`);sound();save();update()}};
for(const b of document.querySelectorAll('[data-crop]'))b.onclick=()=>{crop=Number(b.dataset.crop);update()};
$('upgrade').onclick=()=>{const s=state[game],cost=60*(s.upgrade+1);if(world.round||s.upgrade>=5||s.coins<cost)return;s.coins-=cost;s.upgrade++;sound();save();update();toast('Equipment upgraded.')};
$('farmTab').onclick=()=>switchGame('farm');$('sniperTab').onclick=()=>switchGame('sniper');$('cameraHome').onclick=()=>world.home();
$('urbanMode').onclick=()=>{urbanMode=true;campMode=false;switchGame('sniper')};$('campaignMode').onclick=()=>{urbanMode=false;switchGame('sniper')};$('exitCombat').onclick=()=>switchGame('sniper');
$('fullscreen').onclick=()=>{document.body.classList.toggle('immersive');$('fullscreen').setAttribute('aria-label',document.body.classList.contains('immersive')?'Exit expanded view':'Expand game');$('world').scrollIntoView({block:'start'});if(game==='sniper'&&document.body.classList.contains('immersive')){$('app').requestFullscreen?.().then(()=>{screen.orientation?.lock?.('landscape').catch(()=>{})}).catch(()=>{})}else if(document.fullscreenElement)document.exitFullscreen?.();resize()};

function combatUI(a){
 if(game!=='sniper'||!urbanMode||!a)return;
 $('armorValue').textContent=Math.ceil(a.health??100);$('armorFill').style.width=(a.health??100)+'%';$('armorPanel').classList.toggle('low',(a.health??100)<35);$('armorStatus').textContent=a.covered?'IN COVER · RECOVERING':'ARMOR';
 $('coverLabel').textContent=a.covered?'Peek out':'Take cover';$('cover').setAttribute('aria-pressed',String(!!a.covered));$('cover').classList.toggle('selected',!!a.covered);document.body.classList.toggle('inCover',!!a.covered);
 $('cover').disabled=a.paused||!!a.cinematic||!!a.extract;$('scope').disabled=a.paused||!!a.cinematic||!!a.extract||!!a.covered;
 $('zoomControl').hidden=!world.scoped||a.cinematic||a.extract||a.covered;$('zoomRange').value=world.zoom||3;$('zoomValue').textContent=(world.zoom||3)+'×';$ ('scopeMask').querySelector('.scopeLabel').textContent='SEVEN OPTICS · '+(world.zoom||3)+'×';
 document.body.classList.toggle('engaged',a.shots>0||a.left<92);const warning=a.extract?(campMode?'TEAM EVACUATING':'CIVILIANS EVACUATING'):a.covered?'PROTECTED · PEEK WHEN READY':a.aiming?'INCOMING FIRE · TAKE COVER':a.alerted?'GUARDS REPOSITIONING':campMode?'IDENTIFY · PROTECT TEAMMATES':'IDENTIFY · PROTECT CIVILIANS';if($('threatWarning').textContent!==warning)$('threatWarning').textContent=warning;$('threatWarning').classList.toggle('danger',!!a.aiming&&!a.covered);$('damageVignette').style.opacity=world.damageFade||0;
}
function roundUI(a){
 if(!a)return;
 const action=$('routeAction');action.hidden=urbanMode||!(a.waitingBeacon||a.waitingCargo);
 action.textContent=a.waitingCargo?'Collect supplies':'Activate beacon';action.disabled=!!a.paused;
 $('ammo').textContent=a.ammo+'/5';$('threats').textContent=(missionSpec().target-a.hits)+' guards';$('health').textContent=a.waitingBeacon?'Beacon ready':a.waitingCargo?'At supply cache':a.extract?'Extracting…':urbanMode?(campMode?'Protect teammates':'Protect civilians'):a.mistakes?`Team hits ${a.mistakes}/3`:'Team safe';$('progress').style.width=a.hits/missionSpec().target*100+'%';$('upgrade').disabled=true;$('goalLine').textContent=`${a.hits} / ${missionSpec().target} cleared · ${a.shots?Math.round(a.hits/a.shots*100):0}% accuracy`;quickStats();combatUI(a);
}
function tick(a){
 $('timer').textContent=Math.ceil(a.left)+'s';$('timer').classList.toggle('urgent',a.left<15);$('reloadLabel').textContent=a.reload?`Reload ${a.reload.toFixed(1)}s`:'Reload';$('reload').disabled=!!a.reload||a.paused||a.ammo===5||!!a.extract||!!a.cinematic;
 $('fire').disabled=a.paused||!!a.reload||!!a.extract||!!a.cinematic||!!a.covered||a.waitingBeacon||a.waitingCargo||world.coverAmount>.12||world.cooldown>0;$('focus').disabled=a.paused||world.breath<=.1||!!a.extract||!!a.cinematic;
 $('focusLabel').textContent=world.holding?'Release breath':world.breathRecovery>0?`Recover ${Math.ceil(world.breathRecovery)}s`:'Hold breath';$('focus').classList.toggle('selected',world.holding);
 $('breathBar').querySelector('i').style.width=world.breath/3*100+'%';$('breathBar').querySelector('span').textContent=world.holding?'STEADY AIM':world.breathRecovery?'RECOVERING':'FOCUS';combatUI(a);
}
function scan(info){if(!world.round||world.round.paused||world.round.cinematic||world.round.covered)return;$('targetInfo').hidden=!info;if(info){$('targetInfo').textContent=`${info.friend?(urbanMode&&!campMode?'CIVILIAN · PROTECT':'TEAMMATE · PROTECT'):'ARMED THREAT'} / ${info.distance} m`;$('targetInfo').style.color=info.friend?'#a8efc8':'#ffbe9e'}}
function shot(){sound('shot');$('hitFlash').style.background='#ffe3a01c';setTimeout(()=>$('hitFlash').style.background='transparent',80)}
function start(){if(game!=='sniper')return;if(prefs.sound)audio.unlock().then(ok=>{if(!ok)toast('Sound is unavailable. Tap the sound button to retry.');});if(world.loaded===false){toast('The environment is still loading.');return}if(world.scoped)world.scope();$('scopeMask').hidden=true;$('scopeLabel').textContent='Scope ×3';world.start();$('urbanObjective').hidden=!urbanMode;$('exitCombat').hidden=false;for(const id of ['armorPanel','threatWarning','cover'])$(id).hidden=!urbanMode;$('combatSound').hidden=false;document.body.classList.remove('paused');$('sniperIntro').hidden=true;$('crosshair').hidden=false;$('breathBar').hidden=false;$('pause').innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 4v16m8-16v16"/></svg>';document.body.classList.remove('sniper-lobby');resize();document.body.classList.add('playing');$('sniperActions').hidden=false;$('sniperHud').hidden=false;$('pause').setAttribute('aria-label','Pause mission');update();roundUI(world.round)}
$('routeAction').onclick=()=>world?.routeAction?.();
function pause(){if(!world.round)return;audio.stop();const a=world.round;a.paused=!a.paused;$('routeAction').disabled=a.paused;document.body.classList.toggle('paused',a.paused);$('pause').innerHTML=a.paused?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m8 4 12 8-12 8z"/></svg>':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 4v16m8-16v16"/></svg>';$('pause').setAttribute('aria-label',a.paused?'Resume mission':'Pause mission');$('targetInfo').hidden=!a.paused;$('targetInfo').textContent='PAUSED';for(const id of ['fire','reload','focus'])$(id).disabled=a.paused;toast(a.paused?'Paused. Tap Resume to continue.':'Mission resumed.')}
$('start').onclick=start;$('retry').onclick=()=>{$('panel').close();start()};$('fire').onclick=()=>world.fire();$('reload').onclick=()=>world.reload();
$('scope').onclick=()=>{if(!world.round)return;let active=world.scope();$('scopeMask').hidden=!active;$('scopeLabel').textContent=active?'Unscope':'Scope ×'+(world.zoom||3);if(urbanMode)combatUI(world.round)};
$('cover').onclick=()=>{world.toggleCover?.();combatUI(world.round)};$('zoomRange').oninput=e=>{world.setZoom?.(e.target.value);combatUI(world.round)};
$('focus').onclick=()=>{world.holdBreath();tick(world.round)};$('pause').onclick=pause;
function endMission(win,round){
 if(urbanMode){const s=state.sniper,accuracy=round.shots?Math.round(round.hits/round.shots*100):0,key=campMode?'camp':'urban';if(win){s[key+'Best']=Math.max(s[key+'Best']||0,accuracy);s[key+'Cleared']=true;save();sound('win')}switchGame('sniper');modal(`<div class="result"><small>${campMode?'MOUNTAIN OUTPOST':'OLD QUARTER'} · RESCUE</small><h2>${win?'Team rescued':'Rescue incomplete'}</h2><p>${win?'Both survivors reached the evacuation point.':round.mistakes?'A friendly was injured. Identify your target before firing.':round.failure==='health'?'Your armor was depleted. Take cover during enemy bursts, then peek to fire.':'Time ran out. Clear the threats, then allow time for extraction.'}</p><div class="resultStats"><span><b>${accuracy}%</b>Accuracy</span><span><b>${round.shots}</b>Shots</span><span><b>${round.headshots||0}</b>Precision hits</span></div><p>Best clear: ${s[key+'Best']||0}% accuracy. Your 77-operation campaign progress and coins are unchanged.</p><button id="resultAction" class="gold wide">${win?'Play rescue again':'Retry rescue'}</button></div>`);$('resultAction').onclick=()=>{$('modal').close();if(world.loaded===false){const current=world;current.ready.then(()=>{if(world===current)start()}).catch(()=>toast('Use Retry loading to reopen this operation.'))}else start()};return}
 const s=state.sniper,level=s.level,stars=win?rating(round):0,accuracy=round.shots?Math.round(round.hits/round.shots*100):0;
 let reward=0;if(win){s.ratings[level]=Math.max(s.ratings[level]||0,stars);reward=finish(s,'sniper').reward;save();sound('win')}
 switchGame('sniper');modal(`<div class="result"><small>MISSION ${String(level).padStart(2,'0')}</small><h2>${win?'Team extracted':'Mission incomplete'}</h2><p>${win?'Both teammates reached the helicopter.':'Protect the team and clear the area before time runs out.'}</p><div class="stars" aria-label="${stars} of 3 stars">${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</div><div class="resultStats"><span><b>${accuracy}%</b>Accuracy</span><span><b>${round.shots}</b>Shots</span><span><b>${round.mistakes}</b>Friendly hits</span></div><p>${win?`+${reward} game coins${reward===0?' · Already completed':''}`:'Retry is free. Your coins are unchanged.'}</p><button id="resultAction" class="gold wide">${win?(level===77?'Play again':'Next mission'):'Retry mission'}</button></div>`);
 $('resultAction').onclick=()=>{$('modal').close();start()};
}
let down=null,activePointers=new Set();
renderer.domElement.addEventListener('pointerdown',e=>{activePointers.add(e.pointerId);down=activePointers.size===1?{id:e.pointerId,lastX:e.clientX,lastY:e.clientY,moved:0}:null;renderer.domElement.setPointerCapture(e.pointerId)});
renderer.domElement.addEventListener('pointermove',e=>{if(!down||activePointers.size!==1||down.id!==e.pointerId)return;let dx=e.clientX-down.lastX,dy=e.clientY-down.lastY;down.moved+=Math.abs(dx)+Math.abs(dy);if(game==='sniper')world.aim(dx,dy);down.lastX=e.clientX;down.lastY=e.clientY});
renderer.domElement.addEventListener('pointerup',e=>{if(down&&down.id===e.pointerId&&activePointers.size===1&&down.moved<10&&game==='farm'){const r=renderer.domElement.getBoundingClientRect();world.pick((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1)}activePointers.delete(e.pointerId);down=null});
renderer.domElement.addEventListener('pointercancel',e=>{activePointers.delete(e.pointerId);down=null});
window.addEventListener('keydown',e=>{if($('modal').open||$('panel').open||game!=='sniper'||!world?.round)return;if(e.code==='Space'){e.preventDefault();world.fire()}if(e.repeat&&!e.code.startsWith('Arrow'))return;if(e.code==='KeyE')world.routeAction?.();if(e.code==='KeyR')world.reload();if(e.code==='KeyC'&&urbanMode&&world.round)$('cover').click();if(e.code==='KeyZ')$('scope').click();if(e.code==='KeyP')pause();if(e.code==='KeyF'&&world.round)$('focus').click();if(e.code.startsWith('Arrow')){e.preventDefault();world.aim(e.code==='ArrowLeft'?-12:e.code==='ArrowRight'?12:0,e.code==='ArrowUp'?-12:e.code==='ArrowDown'?12:0)}});
function openPanel(kind){$('ranchCard').hidden=kind!=='ranch';$('panelNotice').hidden=true;$('missionCard').hidden=kind!=='mission';$('shopCard').hidden=kind!=='shop';$('quickStats').hidden=kind!=='mission';panelPause=world?.round&&!world.round.paused?world.round:null;if(panelPause)panelPause.paused=true;update();$('panel').showModal()}
$('marketButton').onclick=()=>openPanel('mission');$('equipmentButton').onclick=()=>openPanel('shop');$('closePanel').onclick=()=>$('panel').close();$('panel').addEventListener('close',()=>{if(panelPause&&panelPause===world?.round)panelPause.paused=false;panelPause=null});$('journeyShortcut').onclick=()=>$('levelsButton').click();
function modal(html){modalPause=world?.round&&!world.round.paused?world.round:null;if(modalPause)modalPause.paused=true;$('modalBody').innerHTML=html;$('modal').showModal()}
$('closeModal').onclick=()=>$('modal').close();
$('modal').addEventListener('close',()=>{if(modalPause&&modalPause===world?.round)modalPause.paused=false;modalPause=null});
$('settingsButton').onclick=()=>{
 modal(`<h2>Settings</h2><p>Adjust the game for your screen. Lower graphics can help on older phones.</p><div class="setting"><label for="quality">Graphics</label><select id="quality"><option value="low">Battery saver</option><option value="balanced">Balanced</option><option value="high">High</option></select></div><div class="setting"><label for="aimSpeed">Aim sensitivity</label><input id="aimSpeed" type="range" min="0.5" max="2" step="0.1"></div><div class="setting"><label for="audioToggle">Sound effects</label><input id="audioToggle" type="checkbox"></div><p>Settings and game progress stay on this browser.</p>`);
 $('quality').value=prefs.quality;$('aimSpeed').value=prefs.sensitivity;$('audioToggle').checked=prefs.sound;
 $('quality').onchange=e=>{prefs.quality=e.target.value;quality();savePrefs()};$('aimSpeed').oninput=e=>{prefs.sensitivity=Number(e.target.value);if(game==='sniper')world.sensitivity=prefs.sensitivity;savePrefs()};$('audioToggle').onchange=e=>{setSound(e.target.checked)};
};
$('levelsButton').onclick=()=>{
 const s=state[game],names=game==='farm'?FARM_CHAPTERS:SNIPER_CHAPTERS;
 modal(`<h2>Your 77-level journey</h2><p>7 chapters · 11 levels per chapter. Replaying a completed level does not pay its completion reward again.</p><div class="levels">${Array.from({length:77},(_,i)=>`${i%11===0?`<div class="chapterRow">${Math.floor(i/11)+1} · ${names[Math.floor(i/11)]}</div>`:''}<button class="${s.completed.includes(i+1)?'done':''} ${i+1===s.level?'current':''}" ${i+1>s.unlocked?'disabled':''} data-level="${i+1}">${i+1}${game==='sniper'&&s.ratings[i+1]?`<small>${'★'.repeat(s.ratings[i+1])}</small>`:''}</button>`).join('')}</div>`);
 $('modalBody').querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>{const l=Number(b.dataset.level);if(l>s.unlocked)return;if((s.score||world.round)&&!confirm('Leave this objective? Coins and completed levels will remain.'))return;s.level=l;s.score=0;if(game==='sniper')urbanMode=false;save();$('modal').close();switchGame(game)});
};
$('help').onclick=()=>modal(`<h2>Welcome to SEVEN Worlds</h2><p><b>Farm:</b> drag to rotate, pinch or scroll to zoom. Open Plant and pick a seed, then tap a field or plant all empty fields. Water once per crop to save 3 seconds. Harvest ripe crops. Feed cows, chickens and goats from your silo, then collect milk and eggs. The market truck sells your goods in an 8-second round trip. Buy animals, feed, workers and land in Farm shop. Workers act every 4 seconds while Farm is open; assign their role and pause them anytime.</p><p><b>Urban rescue:</b> stop three armed threats, protect two civilians and wait for their escape to the rescue vehicle. Guards return fire after your first shot or nine seconds. Use Take cover (C) during their aim warning and bursts; armor recovers while protected. You cannot fire from cover. Peek out, scope and pick your shot. A full rifle cycle takes 0.7 seconds. The zoom slider adjusts 2×–6×. Sound can be toggled on the briefing or in combat. One civilian hit fails this mission. Bullet camera follows confirmed hits; the mission timer pauses during it. This new mission saves your best accuracy separately from the 77-operation campaign. Use the mission selector to switch modes. The city loads its characters only when opened.</p><p><b>Sniper campaign:</b> drag to aim. Zoom, identify red-marked guards and fire. Green markers identify teammates. Hold breath to reduce scope sway. Reload after five shots. Clear the area, then protect your team during extraction. Three friendly hits or running out of time fails the mission.</p><p><b>Rating:</b> a clean rescue earns two stars; at least 80% accuracy earns three. A rescue with a friendly hit earns one. Stars improve your record, not your coin reward.</p><p>Keyboard: arrows aim, Space fires, R reloads, Z scopes, F holds breath, P pauses. Open Mission for your briefing, Armory for upgrades and Journey for the campaign. Use the expand button for more room. The minimap shows crops and animals on Farm, and living guards, teammates and extraction on Sniper.</p><p>77 progression levels per game across seven chapters. Original environments with imported, skinned character models in Urban rescue. <a href="credits.html" target="_blank" rel="noopener">Asset credits</a>. Progress is stored on this browser. Game coins are not SEVEN tokens, and no purchase or payout is connected.</p>`);
function animalIcon(kind){const body=kind==='cow'?'<path d="M20 34 9 24v16l10 7m41-13 11-10v16l-10 7"/><path d="M23 28h34l7 24-10 16H26L16 52z"/><path d="M28 28 25 13m27 15 3-15"/><ellipse cx="40" cy="56" rx="16" ry="9"/><circle cx="30" cy="43" r="2"/><circle cx="50" cy="43" r="2"/>':kind==='chicken'?'<ellipse cx="36" cy="49" rx="23" ry="18"/><circle cx="54" cy="30" r="13"/><path d="m66 29 10 5-11 3M49 17q-4-12 2-9l5 6q2-12 6-8l1 13M14 45 5 24l17 15M29 65v9m15-9v9"/><circle cx="58" cy="28" r="2"/>':'<path d="M24 30h32l5 20-21 20-21-20zM27 29Q10 3 23 8l11 20m12 0L57 8q13-5-4 21M22 35 7 28l9 17m42-10 15-7-9 17M36 65l4 10 4-10"/><circle cx="29" cy="44" r="2"/><circle cx="51" cy="44" r="2"/><path d="m35 57 5 3 5-3"/>';return `<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`}
function renderFarmBusiness(){
 const s=state.farm,now=Date.now();$('farmBusiness').hidden=game!=='farm';$('equipmentArt').hidden=game==='farm';if(game!=='farm')return;
 for(const k of Object.keys(SPECIES)){const n=s.herd.filter(a=>a.kind===k).length,cap=k==='chicken'?8+s.land*4:4+s.land*2,id=k[0].toUpperCase()+k.slice(1);$('buy'+id).disabled=s.coins<SPECIES[k].cost||n>=cap;$(k+'Art').innerHTML=animalIcon(k)}
 $('capacityLabel').textContent=`${s.herd.length} animals · ${s.plots.length} fields`;$('siloSummary').textContent=`${s.feedStock} feed available`;$('feedStock').textContent=s.feedStock+' FEED';$('buyFeed').disabled=s.coins<20;
 $('landSummary').textContent=`${s.land} / 4 expansions · ${s.plots.length} fields. Each purchase adds 3 fields, space for 2 cows, 2 goats and 4 chickens.`;
 $('buyLand').textContent=s.land>=4?'Estate fully expanded':`Buy next land · ${LAND_COST[s.land]} coins`;$('buyLand').disabled=s.land>=4||s.coins<LAND_COST[s.land];
 $('hireWorker').textContent=s.workers.length>=3?'Team complete':`Hire · ${140+s.workers.length*100} coins`;$('hireWorker').disabled=s.workers.length>=3||s.coins<140+s.workers.length*100;
 const workerHTML=s.workers.length?s.workers.map((w,i)=>`<label class="workerRow"><span><b>Worker ${i+1}</b><small>${s.workerEnabled?'On duty':'Resting'}</small></span><select data-worker="${w.id}">${Object.entries(ROLES).map(([key,label])=>`<option value="${key}" ${w.role===key?'selected':''}>${label}</option>`).join('')}</select></label>`).join(''):'<p class="emptyTeam">Hire your first farm hand to help with daily work.</p>';
 if($('workerList').dataset.signature!==workerHTML){$('workerList').innerHTML=workerHTML;$('workerList').dataset.signature=workerHTML}
 $('runWorkers').textContent=s.workerEnabled?'Pause all workers':'Resume workers';$('runWorkers').disabled=!s.workers.length;
 $('herdSummary').innerHTML=Object.entries(SPECIES).map(([kind,c])=>`<div>${animalIcon(kind)}<b>${s.herd.filter(a=>a.kind===kind).length}</b><small>${c.plural}</small></div>`).join('');
 $('herdList').innerHTML=s.herd.map(a=>{const c=SPECIES[a.kind],ready=a.readyAt&&a.readyAt<=now,busy=a.readyAt>now;return `<div class="animalRow"><span class="animalAvatar ${a.kind}Art">${animalIcon(a.kind)}</span><span><b>${c.name} ${a.id.split('-').pop()}</b><small>${ready?'Produce ready':busy?Math.ceil((a.readyAt-now)/1000)+'s until ready':c.feed+' feed · '+c.seconds+' seconds'}</small></span><button data-animal="${a.id}" ${busy||(!ready&&s.feedStock<c.feed)?'disabled':''}>${ready?'Collect':busy?'Producing':'Feed'}</button></div>`}).join('');
 const ready=s.herd.filter(a=>a.readyAt&&a.readyAt<=now).length;$('feedLabel').textContent=ready?`${ready} ready · Animals`:'Animals';
 $('feedAll').disabled=!ready&&!s.herd.some(a=>!a.readyAt&&s.feedStock>=SPECIES[a.kind].feed);
 const v=inventoryValue(s);$('sell').textContent=s.shipment?'Truck on delivery':`Load & sell · ${v} coins`;$('sell').disabled=!!s.shipment||v<=0;
 $('truckStatus').textContent=s.shipment?`Returning in ${Math.max(0,Math.ceil((s.shipment.arrivesAt-now)/1000))}s · ${s.shipment.value} coins pending`:'Parked at your farm gate';
 $('truckCargo').textContent=s.shipment?`${s.shipment.items.crops} crops · ${s.shipment.items.eggs} eggs · ${s.shipment.items.milk} milk · ${s.shipment.items.goatMilk} goat milk. Payment arrives with the truck.`:`${s.harvest} crops · ${s.egg} eggs · ${s.milk} milk · ${s.goatMilk} goat milk ready to sell. An 8-second round trip.`;
 if(s.shipment)$('deliver').disabled=true;
}
function farmAction(result,rebuild=false){toast(result.ok?result.reason||'Done.':result.reason);if(result.ok){sound();save();if(rebuild)switchGame('farm');else update()}}
for(const kind of Object.keys(SPECIES))$('buy'+kind[0].toUpperCase()+kind.slice(1)).onclick=()=>farmAction(buyAnimal(state.farm,kind));
$('buyFeed').onclick=()=>farmAction(buyFeed(state.farm));$('buyLand').onclick=()=>farmAction(buyLand(state.farm),true);$('hireWorker').onclick=()=>farmAction(hireWorker(state.farm));
$('runWorkers').onclick=()=>{state.farm.workerEnabled=!state.farm.workerEnabled;save();update()};
$('workerList').addEventListener('change',e=>{if(e.target.dataset.worker)farmAction(assignWorker(state.farm,e.target.dataset.worker,e.target.value))});
$('herdList').addEventListener('click',e=>{const b=e.target.closest('[data-animal]');if(b)careFor(b.dataset.animal)});
function careFor(id){const s=state.farm,now=Date.now(),a=s.herd.find(x=>x.id===id);if(!a)return;const ready=a.readyAt&&a.readyAt<=now,result=ready?collectAnimal(s,id,now):feedAnimal(s,id,now);if(result.ok)result.reason=ready?'Produce collected into your market inventory.':SPECIES[a.kind].name+' fed. Production started.';farmAction(result)}
$('feedAll').onclick=()=>{const r=feedHerd(state.farm,Date.now());save();update();toast(`${r.collected} produce collected · ${r.fed} animals fed.`)};
function sendTruck(order=null){const r=loadTruck(state.farm,Date.now(),order);if(!r.ok)return toast(r.reason);save();update();toast(`Truck loaded. ${r.value} game coins arrive in 8 seconds.`)}

function drawMap(){
 if(!map||!world)return;const c=map,f=game==='farm',s=state[game];c.clearRect(0,0,140,140);c.fillStyle='#111d29d9';c.fillRect(0,0,140,140);c.strokeStyle='#ffffff0f';c.lineWidth=1;
 for(let i=20;i<140;i+=20){c.beginPath();c.moveTo(i,0);c.lineTo(i,140);c.moveTo(0,i);c.lineTo(140,i);c.stroke()}
 c.font='8px system-ui';c.fillStyle='#a9bec9';c.fillText('N',67,13);
 const pos=(x,z)=>f?[70+x*2.8,48+z*2.5]:[70+x*2.6,28+(z+65)*1.15];
 const dot=(x,z,color,r=3)=>{let p=pos(x,z);c.fillStyle=color;c.beginPath();c.arc(p[0],p[1],r,0,Math.PI*2);c.fill()};
 if(f){for(let i=0;i<world.plots.length;i++){let p=world.plots[i].group.position,a=s.plots[i];dot(p.x,p.z,a?a.end<=Date.now()?'#eec774':'#8bbd80':'#727f7b',4)}for(let a of [...world.animals,...world.chickens,...(world.goats||[])])dot(a.position.x,a.position.z,'#d5dfdd',2);dot(-8,-8,'#b49fd6',6)}
 else{for(let t of world.targets)if(t.alive)dot(t.model.position.x,t.model.position.z,t.friend?'#91e7ba':'#f59d7c',3);let e=pos(world.exit?.x??8,world.exit?.z??5);c.strokeStyle='#e0c580';c.beginPath();c.arc(...e,6,0,Math.PI*2);c.stroke();let p=pos(world.camera?.position?.x??0,world.camera?.position?.z??22);c.save();c.translate(...p);c.rotate(world.yaw*-1);c.strokeStyle='#9ecedc66';c.beginPath();c.moveTo(-12,-22);c.lineTo(0,0);c.lineTo(12,-22);c.stroke();c.fillStyle='#c5edf4';c.beginPath();c.moveTo(0,-5);c.lineTo(-4,3);c.lineTo(4,3);c.closePath();c.fill();c.restore()}
}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&world?.round&&!world.round.paused)pause()});
let last=performance.now(),elapsed=0,mapClock=0,audioPaused=false;
function frame(now){let dt=Math.min(.05,(now-last)/1000);last=now;elapsed+=dt;if(!document.body.classList.contains('sniper-lobby'))world?.update(dt,elapsed);const nowPaused=!!world?.round?.paused;if(nowPaused&&!audioPaused)audio.stop();audioPaused=nowPaused;audio.setActive(game==='sniper'&&!!world?.round&&!world.round.paused&&!world.round.cinematic&&!document.hidden);if(world&&!document.body.classList.contains('sniper-lobby'))renderer.render(world.scene,world.camera);mapClock+=dt;if(mapClock>.2){drawMap();mapClock=0}requestAnimationFrame(frame)}
globalThis.sevenGameUI={start,farm:()=>switchGame('farm'),mode:value=>{urbanMode=value!=='campaign';campMode=value==='camp';switchGame('sniper')},settings:()=>$('settingsButton').click(),journey:()=>{$('levelsButton').click()},upgrade:()=>{const s=state.sniper,cost=60*(s.upgrade+1);if(s.upgrade>=5||s.coins<cost||world.round)return false;s.coins-=cost;s.upgrade++;save();update();return true}};
quality();const arrival=settleFarm(state.farm,Date.now());if(arrival.value)farmFinish();switchGame(typeof location!=='undefined'&&new URLSearchParams(location.search).get('game')!=='farm'?'sniper':'farm');save();requestAnimationFrame(frame);
let workerTick=0;
setInterval(()=>{const settlement=settleFarm(state.farm,Date.now());let changed=settlement.changed;if(settlement.value){farmFinish();toast(`Market truck returned. +${settlement.value} game coins.`)}if(game==='farm'){workerTick++;if(workerTick%4===0)changed=workFarm(state.farm,Date.now(),CROPS)||changed;if(changed)update();else{if(pick)showPick();quickStats();if($('panel').open)renderFarmBusiness();const n=state.farm.herd.filter(a=>a.readyAt&&a.readyAt<=Date.now()).length;$('feedLabel').textContent=n?`${n} ready · Animals`:'Animals'}$('harvest').disabled=!state.farm.plots.some(p=>p&&p.end<=Date.now())}if(changed)save()},1000);
