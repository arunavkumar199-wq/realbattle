// YAHAN APNA SUPABASE URL AUR KEY DALO
const SUPABASE_URL = 'https://azxnvrbjqszzcuekcbqs.supabase.co';   // https://xxxx.supabase.co
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6eG52cmJqcXN6emN1ZWtjYnFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MTU3NzgsImV4cCI6MjA4NzE5MTc3OH0.5onT-qjNZCXCWts-i79rGylroTOLk57yMoyEb-EwzYI';   // long string

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  realtime: { params: { eventsPerSecond: 30 } }
});

// 10 GUNS - FREE FIRE EXACT STATS
const GUNS = {
  desert:   {id:'desert',   name:'Desert Eagle', short:'DEAGLE',  type:'Pistol',  dmg:51,  hs:2.0, rate:0.30, reload:2.2, ammo:7,  range:60,  drop:0.008, spread:1, charge:false},
  m1887:    {id:'m1887',    name:'M1887',        short:'M1887',   type:'Shotgun', dmg:90,  hs:1.5, rate:0.80, reload:2.5, ammo:2,  range:20,  drop:0.060, spread:8, charge:false},
  woodpeck: {id:'woodpeck', name:'Woodpecker',   short:'WDPKR',   type:'AR',      dmg:85,  hs:1.8, rate:0.35, reload:3.0, ammo:20, range:100, drop:0.003, spread:1, charge:false},
  ump:      {id:'ump',      name:'UMP',          short:'UMP',     type:'SMG',     dmg:48,  hs:1.6, rate:0.09, reload:2.0, ammo:30, range:50,  drop:0.012, spread:1, charge:false},
  mp40:     {id:'mp40',     name:'MP40',         short:'MP40',    type:'SMG',     dmg:48,  hs:1.6, rate:0.07, reload:1.8, ammo:30, range:45,  drop:0.014, spread:1, charge:false},
  m10:      {id:'m10',      name:'M10',          short:'M10',     type:'SMG',     dmg:36,  hs:1.5, rate:0.08, reload:1.7, ammo:30, range:40,  drop:0.016, spread:1, charge:false},
  awm:      {id:'awm',      name:'AWM',          short:'AWM',     type:'Sniper',  dmg:120, hs:2.5, rate:1.50, reload:3.5, ammo:5,  range:200, drop:0.001, spread:1, charge:false},
  mp5:      {id:'mp5',      name:'MP5',          short:'MP5',     type:'SMG',     dmg:45,  hs:1.5, rate:0.10, reload:2.0, ammo:30, range:48,  drop:0.013, spread:1, charge:false},
  charge:   {id:'charge',   name:'Charge Buster',short:'CHARGE',  type:'Special', dmg:90,  hs:2.0, rate:1.20, reload:2.5, ammo:4,  range:30,  drop:0.040, spread:1, charge:true},
  spas:     {id:'spas',     name:'SPAS-12',      short:'SPAS12',  type:'Shotgun', dmg:90,  hs:1.5, rate:0.70, reload:2.2, ammo:6,  range:22,  drop:0.055, spread:6, charge:false}
};
const GUN_LIST = ['desert','m1887','woodpeck','ump','mp40','m10','awm','mp5','charge','spas'];

const MODES = [
  {id:'1v1',label:'1 v 1',t1:1,t2:1,total:2},
  {id:'1v2',label:'1 v 2',t1:1,t2:2,total:3},
  {id:'1v3',label:'1 v 3',t1:1,t2:3,total:4},
  {id:'1v4',label:'1 v 4',t1:1,t2:4,total:5},
  {id:'2v2',label:'2 v 2',t1:2,t2:2,total:4},
  {id:'2v3',label:'2 v 3',t1:2,t2:3,total:5},
  {id:'2v4',label:'2 v 4',t1:2,t2:4,total:6},
  {id:'3v3',label:'3 v 3',t1:3,t2:3,total:6},
  {id:'3v4',label:'3 v 4',t1:3,t2:4,total:7},
  {id:'4v4',label:'4 v 4',t1:4,t2:4,total:8}
];

function calcDmg(gun, distM, isHead) {
  const ex = Math.max(0, distM - gun.range);
  const mul = Math.max(0.15, 1 - ex * gun.drop);
  let dmg = Math.round(gun.dmg * mul);
  if (isHead) dmg = Math.round(dmg * gun.hs);
  if (gun.spread > 1) {
    const hits = Math.floor(Math.random() * (gun.spread - 2)) + 2;
    dmg = Math.round(dmg * hits / gun.spread * 1.8);
  }
  return Math.max(1, dmg);
}

function gpsDist(la1,lo1,la2,lo2) {
  const R=6371000, dL=(la2-la1)*Math.PI/180, dO=(lo2-lo1)*Math.PI/180;
  const a=Math.sin(dL/2)**2+Math.cos(la1*Math.PI/180)*Math.cos(la2*Math.PI/180)*Math.sin(dO/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

function gpsBear(la1,lo1,la2,lo2) {
  const p1=la1*Math.PI/180,p2=la2*Math.PI/180,dl=(lo2-lo1)*Math.PI/180;
  const y=Math.sin(dl)*Math.cos(p2),x=Math.cos(p1)*Math.sin(p2)-Math.sin(p1)*Math.cos(p2)*Math.cos(dl);
  return (Math.atan2(y,x)*180/Math.PI+360)%360;
}

function angDiff(a,b) { let d=((a-b)+360)%360; return d>180?360-d:d; }

function isAiming(mLa,mLo,mHd,tLa,tLo,tol=15) {
  if(!mLa&&!tLa) return true;
  return angDiff(mHd, gpsBear(mLa,mLo,tLa,tLo)) <= tol;
}

function isHeadshot(pitch,distM) {
  const ideal = Math.atan2(1.7, Math.max(1,distM)) * 180/Math.PI;
  return Math.abs(pitch - ideal) < 22;
}

function tap(f=800) {
  try {
    const c=new(window.AudioContext||window.webkitAudioContext)();
    const o=c.createOscillator(),g=c.createGain();
    o.connect(g);g.connect(c.destination);
    o.frequency.value=f;o.type='sine';
    g.gain.setValueAtTime(0.07,c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.07);
    o.start();o.stop(c.currentTime+0.07);
  }catch(e){}
}

function vib(p=25) { try{navigator.vibrate(p);}catch(e){} }

function shootSnd(type) {
  try {
    const c=new(window.AudioContext||window.webkitAudioContext)();
    const dur=type==='Sniper'?0.3:type==='Shotgun'?0.2:0.12;
    const buf=c.createBuffer(1,c.sampleRate*dur,c.sampleRate);
    const d=buf.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,type==='Sniper'?1.2:2.5);
    const s=c.createBufferSource();s.buffer=buf;
    const g=c.createGain();
    g.gain.value=type==='Sniper'?0.9:type==='Shotgun'?0.8:type==='SMG'?0.4:0.6;
    s.connect(g);g.connect(c.destination);s.start();
  }catch(e){}
}
