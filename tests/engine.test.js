import test from 'node:test';
import assert from 'node:assert/strict';
import {simulate,batch} from '../dist/engine.js';
import {offense,defense,teams} from '../dist/data.js';
test('32 unique teams',()=>assert.equal(new Set(teams.map(t=>t.id)).size,32));
test('same seed reproduces complete trajectory',()=>assert.deepEqual(simulate({seed:23}),simulate({seed:23})));
test('passes lead moving receivers through breaks and route endings without teleporting',()=>{
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 let passes=0;
 for(const play of offense.filter(p=>p.type==='pass'))for(const target of [0,1,2,3,4])for(const release of [0.8,2.5,4.5])for(const mirror of [false,true]){
  const sim=simulate({offense:play.id,defense:'cover3',target,release,mirror,seed:42});
  const start=sim.frames.findIndex(f=>f.flight);if(start<0)continue;
  passes++;
  const end=sim.frames.findIndex((f,i)=>i>start&&!f.flight);assert.ok(end>start);
  const from=sim.frames[start].ball,landing=sim.frames[end].players[target];
  assert.ok(distance(landing,sim.frames[start].players[target])>0.1,'receiver must leave release position');
  assert.ok(distance(sim.frames[end].ball,landing)<1e-7,'ball and moving receiver meet at arrival');
  for(let i=start+1;i<=end;i++){
   for(let p=0;p<5;p++){
    const traveled=distance(sim.frames[i].players[p],sim.frames[i-1].players[p]);
    assert.ok(traveled>1e-8,'eligible receivers keep running while ball is airborne');
    assert.ok(traveled<=7.3*0.05+1e-8,'no receiver teleportation');
   }
   const ratio=(sim.frames[i].time-sim.frames[start].time)/(sim.frames[end].time-sim.frames[start].time);
   const expected={x:from.x+(landing.x-from.x)*ratio,y:from.y+(landing.y-from.y)*ratio};
   assert.ok(distance(sim.frames[i].ball,expected)<1e-6,'pass keeps its release-time trajectory');
  }
 }
 assert.ok(passes>=80,'exercise early and late passes across all route concepts');
});
test('every play matchup ends with bounded positions and 11 players per side',()=>{
 for(const o of offense)for(const d of defense)for(const seed of [1,42,128]){
  const sim=simulate({offense:o.id,defense:d.id,seed});assert.ok(sim.result.duration>0&&sim.result.duration<=8);assert.ok(sim.result.outcome);
  for(const frame of sim.frames){assert.equal(frame.players.filter(p=>p.side==='o').length,11);assert.equal(frame.players.filter(p=>p.side==='d').length,11);for(const p of frame.players){assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));assert.ok(p.x>=0&&p.x<=53.3);}}
 }
});
test('mirroring preserves results and reflects trajectories',()=>{const a=simulate({seed:73}),b=simulate({seed:73,mirror:true});assert.deepEqual(a.result,b.result);for(let i=0;i<a.frames.length;i++)for(let p=0;p<22;p++){assert.ok(Math.abs(a.frames[i].players[p].x+b.frames[i].players[p].x-53.3)<1e-8);}});
test('schemes and target choices change outcomes or trajectories',()=>{assert.notDeepEqual(simulate({defense:'blitz'}).frames,simulate({defense:'cover2'}).frames);assert.notDeepEqual(simulate({target:0}).frames,simulate({target:3}).frames);});
test('batch aggregates actual trials',()=>{const config={seed:8,offense:'flood',defense:'man'};const b=batch(config,20);const r=Array.from({length:20},(_,i)=>simulate({...config,seed:8+i}).result);assert.equal(b.avgGain,r.reduce((s,t)=>s+t.gain,0)/20);assert.equal(b.firstDown,r.filter(t=>t.firstDown).length/20);});
test('goal line caps gains and touchdowns convert goal-to-go',()=>{for(let seed=1;seed<20;seed++){const r=simulate({los:90,toGo:20,offense:'verts',seed}).result;assert.ok(r.gain<=10);if(r.outcome==='达阵')assert.equal(r.firstDown,true);}});
