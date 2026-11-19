import {loadState,SNIPER_CHAPTERS,operationFor} from './state.js?v=studio';
const $=id=>document.getElementById(id);
const art=(view,cls='')=>`<svg class="${cls}" viewBox="${view}" aria-hidden="true"><image href="assets/sniper-reference.png" width="1024" height="1536"/></svg>`;
const icons={missions:'<circle cx="12" cy="12" r="7"/><path d="M12 1v6m0 10v6M1 12h6m10 0h6"/><circle cx="12" cy="12" r="1"/>',gear:'<path d="M3 8h18v13H3zM8 8V3h8v5M3 13h18M9 11v4m6-4v4"/>',shop:'<path d="M2 3h3l3 13h11l3-10H6M8 21h1m9 0h1"/>',team:'<circle cx="9" cy="6" r="3"/><circle cx="18" cy="8" r="2"/><path d="M2 22v-6a7 7 0 0 1 14 0v6zM16 13a5 5 0 0 1 7 5v4h-5"/>'};
const icon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
const lobby=document.createElement('section');lobby.id='sniperLobby';lobby.setAttribute('aria-label','SEVEN Sniper mission headquarters');
const operations={
 camp:{name:'Mountain Outpost',type:'Mountain rescue',objective:'Bring both teammates to the evacuation pad.'},
 city:{name:'Old Quarter',type:'Urban rescue',objective:'Guide two civilians out of the old city.'},
 campaign:{name:'Campaign',type:'77 operations',objective:'Choose an operation and bring your team home.'}
};
lobby.innerHTML=`<div class="sl-shell">
 <header class="sl-header"><div class="sl-wordmark">${art('213 0 115 113','sl-logo')}<strong>SEVEN <em>WORLDS</em></strong></div>
 <div class="sl-status"><button id="slSettings" aria-label="Graphics and sound settings">⚙</button><span>Level <b id="slLevel">1</b></span><span class="sl-xp" role="progressbar" aria-label="Campaign progress" aria-valuemin="0" aria-valuemax="77" id="slProgress"><i></i></span><button id="slCoinInfo" aria-label="Game coin balance and information"><i>7</i><b id="slCoins">100</b></button></div></header>
 <main class="sl-main"><section class="sl-hero" aria-labelledby="slTitle"><img id="slHeroImage" src="assets/camp-cover.webp" alt="" fetchpriority="high"><div class="sl-hero-inner"><p class="sl-kicker" id="slOperation">Mountain rescue</p><h1 id="slTitle">Mountain Outpost</h1><p id="slObjective">Bring both teammates to the evacuation pad.</p><div class="sl-launch"><button id="slStart" class="sl-start" disabled><span>Start mission</span><b aria-hidden="true">→</b></button><button id="slRetry" hidden>Retry loading</button></div><p id="slReady" role="status">Loading environment…</p></div></section>
 <section class="sl-ops" aria-labelledby="slOpsTitle"><div class="sl-section-head"><h2 id="slOpsTitle">Operations</h2><button class="sl-text" id="slLevels">Campaign levels ↗</button></div>
 <div class="sl-cards">${Object.entries(operations).map(([key,op])=>`<button class="sl-card" data-operation="${key}" aria-pressed="false"><img src="assets/${key}-cover.webp" alt=""><span><strong>${op.name}</strong><small>${op.type}</small></span><b aria-hidden="true">✓</b></button>`).join('')}</div></section>
 <div class="sl-lower"><section class="sl-equipment" id="slEquipment"><h2>Equipment</h2><div class="sl-equipment-grid"><button data-gear="rifle">${art('36 1112 292 126')}<b>Field rifle</b></button><button data-gear="scope">${art('353 1110 212 125')}<b>Optics</b></button><button data-gear="outfit">${art('590 1108 208 128')}<b>Outfit</b></button></div></section>
 <button id="slFarm" class="sl-farm"><img src="assets/farm-cover.webp" alt=""><span><small>Switch world</small><strong>SEVEN Farm ↗</strong></span></button></div></main>
 <nav class="sl-nav" aria-label="Sniper menus"><button data-menu="missions">${icon('missions')}Missions</button><button data-menu="gear">${icon('gear')}Gear</button><button id="slShop">${icon('shop')}Shop</button><button data-menu="team">${icon('team')}Team</button></nav>
 </div>`;
document.body.prepend(lobby);
const sheet=document.createElement('dialog');sheet.id='sniperSheet';sheet.innerHTML='<button id="slClose" aria-label="Close">×</button><div id="slSheetBody"></div>';document.body.append(sheet);
let initialStorage;try{initialStorage=globalThis.localStorage}catch{}
let state=loadState(initialStorage).sniper,mode='camp',ready=false;
function showSheet(html){$('slSheetBody').innerHTML=html;sheet.showModal()}
function sync(s,game,selected,playing){state=s;mode=selected;document.body.classList.toggle('sniper-lobby',game==='sniper'&&!playing);$('app').inert=game==='sniper'&&!playing;$('slLevel').textContent=s.level;$('slCoins').textContent=Number(s.coins).toLocaleString();$('slProgress').setAttribute('aria-valuenow',s.completed.length);$('slProgress').querySelector('i').style.width=`${s.completed.length/77*100}%`;
 const selectedOp=operations[mode];
 $('slOperation').textContent=mode==='campaign'?`Operation ${s.level} / 77 · ${operationFor(s.level).title}`:selectedOp.type;
 $('slTitle').textContent=mode==='campaign'?SNIPER_CHAPTERS[Math.floor((s.level-1)/11)]:selectedOp.name;
 $('slObjective').textContent=mode==='campaign'?operationFor(s.level).brief:selectedOp.objective;
 const hero=$('slHeroImage'),cover=`assets/${mode}-cover.webp`;
 if(hero.getAttribute('src')!==cover)hero.src=cover;
 for(const card of lobby.querySelectorAll('[data-operation]'))card.setAttribute('aria-pressed',String(card.dataset.operation===mode));

}
function setReady(value,message){ready=value;$('slStart').disabled=!ready;$('slReady').textContent=message||(ready?'Ready to play':'Loading environment…');$('slRetry').hidden=value||!message?.includes('failed');}
globalThis.sevenLobby={sync,setReady};
const launch=(action,...args)=>{if(!globalThis.sevenGameUI){setReady(false,'3D could not start. Open this game in a browser with WebGL enabled.');return false}return globalThis.sevenGameUI[action](...args)!==false};
$('slStart').onclick=()=>{if(ready)launch('start')};$('slFarm').onclick=()=>launch('farm');$('slRetry').onclick=()=>launch('mode',mode);$('slClose').onclick=()=>sheet.close();
sheet.addEventListener('click',e=>{if(e.target===sheet)sheet.close()});
const gear={rifle:['Field rifle','Five rounds per magazine. Reload between bursts. Each shot has recoil, a visible impact and positional sound. The live weapon is a detailed 3D model.'],scope:['Precision optics','Switch between 2×, 3×, 4× and 6× magnification. Hold your breath to steady the view. Release it to recover.'],outfit:['Rescue operator','First-person aiming keeps the center of your screen clear. Your field armor starts at 100. Take cover to block enemy fire and recover armor. Friendly soldiers carry green markers.']};
function gearInfo(name){const [title,copy]=gear[name];showSheet(`<p class="sl-eyebrow">FIELD EQUIPMENT</p><h2>${title}</h2><p>${copy}</p><div class="sl-sheet-note">Included · Ready for deployment</div>`)}
for(const b of lobby.querySelectorAll('[data-gear]'))b.onclick=()=>gearInfo(b.dataset.gear);
$('slSettings').onclick=()=>launch('settings');
$('slLevels').onclick=()=>launch('journey');
for(const card of lobby.querySelectorAll('[data-operation]'))card.onclick=()=>{if(card.dataset.operation!==mode)launch('mode',card.dataset.operation)};
function missions(){showSheet(`<p class="sl-eyebrow">CHOOSE YOUR OPERATION</p><h2>Operations</h2><button class="sl-choice" data-mode="camp"><strong>Mountain Outpost</strong><span>Sunset camp · 3 guards · 2 teammates · 100 seconds</span></button><button class="sl-choice" data-mode="city"><strong>Old Quarter</strong><span>City rescue · 3 guards · 2 civilians</span></button><button class="sl-choice" data-mode="campaign"><strong>77-operation campaign</strong><span>${state.completed.length} completed · Level ${state.level} selected</span></button><button class="sl-secondary" id="slJourney">Choose campaign level</button>`);sheet.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{sheet.close();launch('mode',b.dataset.mode)});$('slJourney').onclick=()=>{sheet.close();launch('journey')}}
function shop(){showSheet(`<p class="sl-eyebrow">CAMPAIGN OPTICS</p><h2>Field Shop</h2><p>Use earned game coins to steady your aim in the 77-operation campaign. Special rescue operations use fixed equipment.</p><div class="sl-sheet-note">Optics tier ${state.upgrade} / 5<br>Balance: ${Number(state.coins).toLocaleString()} game coins</div><button class="sl-secondary" id="slBuy" ${state.upgrade>=5||state.coins<60*(state.upgrade+1)?'disabled':''}>${state.upgrade>=5?'Fully upgraded':`Upgrade optics · ${60*(state.upgrade+1)} coins`}</button><p id="slBuyResult" role="status"></p>`);$('slBuy').onclick=()=>{if(launch('upgrade')){shop();$('slBuyResult').textContent='Optics upgraded.'}}}
function team(){showSheet(`<p class="sl-eyebrow">RESCUE SQUAD</p><h2>Rescue squad</h2><div class="sl-team-member"><span>7</span><div><strong>You · Overwatch</strong><p>Clear threats and protect the extraction route.</p></div></div><div class="sl-team-member"><span>02</span><div><strong>Field team</strong><p>Two green-marked teammates. Both must reach evacuation.</p></div></div><div class="sl-sheet-note">Mountain Outpost: ${state.campCleared?'Completed':'Awaiting rescue'}<br>Best accuracy: ${state.campBest||0}%</div>`)}
for(const b of lobby.querySelectorAll('[data-menu]'))b.onclick=()=>{const k=b.dataset.menu;if(k==='missions')missions();if(k==='gear'){$('slEquipment').scrollIntoView({behavior:'smooth',block:'center'});lobby.querySelector('[data-gear]').focus({preventScroll:true})}if(k==='shop')shop();if(k==='team')team();};
$('slShop').onclick=shop;$('slCoinInfo').onclick=()=>showSheet('<p class="sl-eyebrow">GAME COINS</p><h2>Earn through play.</h2><p>Complete new campaign missions to earn game coins. Spend them on campaign optics. These coins stay inside the game and cannot be withdrawn.</p>');
sync(state,new URLSearchParams(location.search).get('game')==='farm'?'farm':'sniper','camp',false);
