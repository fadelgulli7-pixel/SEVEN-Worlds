// Deterministic encounter timing. Rendering, visibility and damage stay with the world.
export class TacticalEncounter {
 constructor(count=3){this.reset(count)}
 reset(count=this.guards.length){this.time=0;this.alerted=false;this.guards=Array.from({length:count},(_,i)=>({index:i,phase:'patrol',left:0,elapsed:0,shots:0,cycles:0}));}
 alert(){if(this.alerted)return false;this.alerted=true;for(const g of this.guards)this.enter(g,'aim',2.2+g.index*.75);return true}
 enter(g,phase,duration){g.phase=phase;g.left=duration;g.duration=duration;g.elapsed=0;if(phase==='burst')g.shots=0}
 update(dt,{alive,canShoot,shot}){
  // Small fixed substeps keep burst counts invariant across frame rates and stalls.
  let remaining=Math.max(0,dt);
  while(remaining>1e-8){const step=Math.min(.05,remaining);remaining-=step;this.time+=step;if(this.time>=9)this.alert();
   for(const g of this.guards){
    if(!alive(g.index)){g.phase='down';continue}if(!this.alerted)continue;
    g.elapsed+=step;g.left-=step;
    if(g.phase==='burst'){
     while(g.shots<3&&g.elapsed+1e-8>=g.shots*.16){g.shots++;shot(g.index,canShoot(g.index));}
    }
    if(g.left>1e-8)continue;
    if(g.phase==='aim')this.enter(g,'burst',.52);
    else if(g.phase==='burst')this.enter(g,'move',.9);
    else if(g.phase==='move')this.enter(g,'cover',2.1+g.index*.2);
    else if(g.phase==='cover'){g.cycles++;this.enter(g,'peek',.45)}
    else if(g.phase==='peek')this.enter(g,'aim',1.65+g.index*.25);
   }
  }
 }
}
