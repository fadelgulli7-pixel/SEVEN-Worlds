// Original procedural audio: no external recordings or download on the critical path.
// Noise transients, low-frequency body, mechanical clicks and a short room response.
export class GameAudio {
 constructor(){this.enabled=true;this.active=false;this.voices=new Set();this.available=true}
 async unlock(){
  if(!this.enabled)return false;
  try{
   if(!this.context){
    const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;
    if(!Audio){this.available=false;return false}const c=this.context=new Audio();
    this.master=c.createGain();this.master.gain.value=.6;
    this.limit=c.createDynamicsCompressor();this.limit.threshold.value=-16;this.limit.knee.value=18;this.limit.ratio.value=6;this.limit.attack.value=.003;this.limit.release.value=.18;
    this.master.connect(this.limit);this.limit.connect(c.destination);
    this.noise=c.createBuffer(1,c.sampleRate*2,c.sampleRate);const samples=this.noise.getChannelData(0);
    let x=87321;for(let i=0;i<samples.length;i++){x=(Math.imul(x,1664525)+1013904223)|0;samples[i]=(x>>>0)/2147483648-1}
    const impulse=c.createBuffer(2,Math.floor(c.sampleRate*.7),c.sampleRate);
    for(let ch=0;ch<2;ch++){const d=impulse.getChannelData(ch);for(let i=0;i<d.length;i++)d[i]=samples[(i+ch*193)%samples.length]*Math.pow(1-i/d.length,3)*.32}
    this.room=c.createConvolver();this.room.buffer=impulse;this.room.connect(this.master);
   }
   await this.context.resume();this.available=this.context.state==='running';return this.available;
  }catch{this.available=false;return false}
 }
 setEnabled(v){this.enabled=!!v;if(!v)this.stop();if(this.master)this.master.gain.value=v ? .6 : 0}
 voice(source,nodes,end){const item={source,nodes};this.voices.add(item);source.onended=()=>{this.voices.delete(item);source.disconnect();for(const n of nodes)n.disconnect()};source.stop(end);return item}
 noiseBurst(start,duration,volume,frequency=2000,pan=0,wet=.1){
  const c=this.context,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain(),p=c.createStereoPanner();s.buffer=this.noise;
  f.type='lowpass';f.frequency.setValueAtTime(frequency,start);f.frequency.exponentialRampToValueAtTime(Math.max(140,frequency*.18),start+duration);
  g.gain.setValueAtTime(.0001,start);g.gain.exponentialRampToValueAtTime(volume,start+.003);g.gain.exponentialRampToValueAtTime(.0001,start+duration);
  p.pan.value=Math.max(-1,Math.min(1,pan));s.connect(f);f.connect(g);g.connect(p);p.connect(this.master);
  const send=c.createGain();send.gain.value=wet;p.connect(send);send.connect(this.room);s.start(start,.3);this.voice(s,[f,g,p,send],start+duration+.02);
 }
 tone(start,duration,frequency,endFrequency,volume){const c=this.context,o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(frequency,start);o.frequency.exponentialRampToValueAtTime(endFrequency,start+duration);g.gain.setValueAtTime(volume,start);g.gain.exponentialRampToValueAtTime(.0001,start+duration);o.connect(g);g.connect(this.master);o.start(start);this.voice(o,[g],start+duration+.01)}
 play(kind='tap',pan=0){
  if(!this.enabled||this.context?.state!=='running')return;
  const t=this.context.currentTime;
  if(kind==='shot'||kind==='enemy'){
   const v=kind==='shot'?1:.3;this.noiseBurst(t,.19,.62*v,kind==='shot'?7200:3200,pan,.2);this.noiseBurst(t+.025,.45,.16*v,650,pan,.24);this.tone(t,.2,125,38,.43*v);
   if(kind==='shot'){this.noiseBurst(t+.28,.045,.13,4200,0,.02);this.noiseBurst(t+.43,.07,.1,2300,0,.02)}
  }else if(kind==='reload'){
   for(const [delay,duration,vol,hz] of [[0,.08,.16,2900],[.35,.12,.18,1700],[.95,.09,.22,3900],[1.25,.07,.14,2600]])this.noiseBurst(t+delay,duration,vol,hz,0,.03);
  }else if(kind==='impact'){this.noiseBurst(t,.12,.16,1600,pan,.1)}
  else if(kind==='hurt'){this.noiseBurst(t,.17,.23,500,pan,0);this.tone(t,.22,70,35,.18)}
  else if(kind==='win'){[0,.12,.24].forEach((d,i)=>this.tone(t+d,.3,440+i*110,440+i*110,.06))}
  else this.tone(t,.06,580,320,.035);
 }
 setActive(v){
  v=!!(v&&this.enabled&&this.context?.state==='running');if(v===this.active)return;this.active=v;
  if(this.wind){this.wind.source.stop();this.wind=null}
  if(!v)return;const c=this.context,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=this.noise;s.loop=true;f.type='lowpass';f.frequency.value=230;g.gain.value=.045;s.connect(f);f.connect(g);g.connect(this.master);s.start();const item={source:s,nodes:[f,g]};this.wind=item;this.voices.add(item);s.onended=()=>{this.voices.delete(item);s.disconnect();f.disconnect();g.disconnect()};
 }
 stop(){this.active=false;this.wind=null;for(const v of this.voices){try{v.source.stop()}catch{}v.source.disconnect();for(const n of v.nodes)n.disconnect()}this.voices.clear()}
}
