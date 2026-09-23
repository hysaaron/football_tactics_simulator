import test from 'node:test';
import assert from 'node:assert/strict';
import {simulate,batch,outsideField} from '../dist/engine.js';
import {offense,defense,fronts,teams} from '../dist/data.js';
test('32 unique teams',()=>assert.equal(new Set(teams.map(t=>t.id)).size,32));
test('same seed reproduces complete trajectory',()=>assert.deepEqual(simulate({seed:23}),simulate({seed:23})));
test('passes lead moving receivers through breaks and route endings without teleporting',()=>{
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 let passes=0;
 for(const play of offense.filter(p=>p.type==='pass'))for(const target of [0,1,2,3,4])for(const release of [0.8,2.5,4.5])for(const mirror of [false,true]){
  const sim=simulate({offense:play.id,defense:'cover3',target,release,mirror,seed:42,parameters:{shedBlockChance:0}});
  const start=sim.frames.findIndex(f=>f.flight);if(start<0)continue;
  passes++;
  const end=sim.frames.findIndex((f,i)=>i>start&&!f.flight);assert.ok(end>start);
  const from=sim.frames[start].ball,landing=sim.frames[end].players[target];
  const out=sim.events.some(e=>e.text.includes('出界'));
  if(!out)assert.ok(distance(landing,sim.frames[start].players[target])>0.1,'receiver must leave release position');
  if(!out)assert.ok(distance(sim.frames[end].ball,landing)<1e-7,'ball and moving receiver meet at arrival');
  for(let i=start+1;i<=end;i++){
   for(let p=0;p<5;p++){
    const traveled=distance(sim.frames[i].players[p],sim.frames[i-1].players[p]);
    if(!outsideField(sim.frames[i-1].players[p],sim.config.los))assert.ok(traveled>1e-8,'in-bounds receivers keep running while ball is airborne');
    assert.ok(traveled<=7.3*0.05+1e-8,'no receiver teleportation');
   }
   const ratio=(sim.frames[i].time-sim.frames[start].time)/(sim.frames[end].time-sim.frames[start].time);
   const destination=out?sim.frames[end].ball:landing;
   const expected={x:from.x+(destination.x-from.x)*ratio,y:from.y+(destination.y-from.y)*ratio};
   assert.ok(distance(sim.frames[i].ball,expected)<1e-6,'pass keeps its release-time trajectory');
  }
 }
 assert.ok(passes>=80,'exercise early and late passes across all route concepts');
});
test('every play matchup ends with bounded positions and 11 players per side',()=>{
 for(const o of offense)for(const d of defense)for(const seed of [1,42,128]){
  const sim=simulate({offense:o.id,defense:d.id,seed});assert.ok(sim.result.duration>0);assert.ok(['传球未完成','传球被抄截','擒杀','被擒抱','达阵','持球出界'].includes(sim.result.outcome));
  for(const frame of sim.frames){assert.equal(frame.players.filter(p=>p.side==='o').length,11);assert.equal(frame.players.filter(p=>p.side==='d').length,11);for(const p of frame.players){assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));assert.ok(p.x>=-0.37&&p.x<=53.67);}}
 }
});
test('mirroring preserves results and reflects trajectories',()=>{const a=simulate({seed:73}),b=simulate({seed:73,mirror:true});assert.deepEqual(a.result,b.result);for(let i=0;i<a.frames.length;i++)for(let p=0;p<22;p++){assert.ok(Math.abs(a.frames[i].players[p].x+b.frames[i].players[p].x-53.3)<1e-8);}});
test('schemes and target choices change outcomes or trajectories',()=>{assert.notDeepEqual(simulate({defense:'blitz'}).frames,simulate({defense:'cover2'}).frames);assert.notDeepEqual(simulate({target:0,parameters:{shedBlockChance:0}}).frames,simulate({target:3,parameters:{shedBlockChance:0}}).frames);});
test('batch aggregates actual trials',()=>{const config={seed:8,offense:'flood',defense:'man'};const b=batch(config,20);const r=Array.from({length:20},(_,i)=>simulate({...config,seed:8+i}).result);assert.equal(b.avgGain,r.reduce((s,t)=>s+t.gain,0)/20);assert.equal(b.firstDown,r.filter(t=>t.firstDown).length/20);});
test('goal line caps gains and touchdowns convert goal-to-go',()=>{for(let seed=1;seed<20;seed++){const r=simulate({los:90,toGo:20,offense:'verts',seed}).result;assert.ok(r.gain<=10);if(r.outcome==='达阵')assert.equal(r.firstDown,true);}});
test('PDF coverage retains its mixed man/zone responsibilities and asymmetric deep zones',()=>{
 const docs=defense.filter(d=>d.tag==='PDF');assert.equal(docs.length,6);
 const man=docs.find(d=>d.id==='pdf-cover2-man');
 assert.deepEqual(man.assignments.filter(a=>a.mode==='man').map(a=>a.mark).sort(),[0,1,2,3,4]);
 assert.equal(man.assignments.filter(a=>a.mode==='zone').length,2);
 for(const [id,count] of [['pdf-cover2-zone',2],['pdf-cover2-invert',2],['pdf-cover3',3],['pdf-cover4',4],['pdf-cover6-left',3]]){
  const deep=docs.find(d=>d.id===id).assignments.filter(a=>a.target?.[1]>18);assert.equal(deep.length,count);
 }
 const six=docs.find(d=>d.id==='pdf-cover6-left');
 assert.equal(six.assignments.find(a=>a.role==='C-L').target[1],6);
 assert.equal(six.assignments.find(a=>a.role==='C-R').target[1],26);
 assert.ok(six.assignments.find(a=>a.role==='S-L').radius[0]>six.assignments.find(a=>a.role==='S-R').radius[0]);
});
test('Invert really rotates corners deep and safeties shallow after the snap',()=>{
 const sim=simulate({defense:'pdf-cover2-invert',release:4.5,seed:42});
 const before=sim.frames[0],after=sim.frames[20];
 for(const role of ['C-L','C-R'])assert.ok(after.players.find(p=>p.id===role).y>before.players.find(p=>p.id===role).y);
 for(const role of ['S-L','S-R'])assert.ok(after.players.find(p=>p.id===role).y<before.players.find(p=>p.id===role).y);
});
test('PDF fronts change the four linemen and preserve mirrored trajectories',()=>{
 for(const front of fronts)for(const def of defense.filter(d=>d.assignments)){
  const config={offense:'drawn-cross',defense:def.id,front:front.id,seed:73};
  const a=simulate(config),b=simulate({...config,mirror:true});
  assert.deepEqual(a.frames[0].players.slice(11,15).map(p=>p.x),front.xs);
  assert.deepEqual(a.result,b.result);
  assert.equal(a.frames.length,b.frames.length);
  a.frames.forEach((frame,i)=>frame.players.forEach((p,j)=>{
   assert.ok(Math.abs(p.x+b.frames[i].players[j].x-53.3)<1e-8);
   assert.ok(Math.abs(p.y-b.frames[i].players[j].y)<1e-8);
  }));
 }
});
test('hand-drawn offense uses its own alignment, with RB releasing left behind the line',()=>{
 const sim=simulate({offense:'drawn-cross',defense:'pdf-cover6-left',release:4.5});
 const initial=sim.frames[0].players,later=sim.frames[20].players;
 assert.deepEqual(initial.slice(0,5).map(p=>[p.x,p.y]),[[6,0],[13,-4],[17,-4],[47,0],[26.65,-10]]);
 assert.deepEqual([initial[10].x,initial[10].y],[26.65,-4]);
 assert.ok(later[4].x<initial[4].x&&later[4].y<0);
 assert.ok(later[1].y>initial[1].y&&later[2].y>initial[2].y);
 assert.equal(new Set(offense.map(p=>p.id)).size,offense.length);
 assert.equal(new Set(defense.map(p=>p.id)).size,defense.length);
});
test('W blitz variant has five rushers, four shallow zones and two deep halves',()=>{
 const d=defense.find(d=>d.id==='cover6-w-blitz');
 assert.equal(d.rush,5);assert.equal(d.front,'even');
 assert.equal(d.assignments.filter(a=>a.mode==='blitz').length,1);
 assert.equal(d.assignments.find(a=>a.role==='WLB').mode,'blitz');
 const zones=d.assignments.filter(a=>a.mode==='zone');assert.equal(zones.length,6);
 assert.equal(zones.filter(a=>a.target[1]<18).length,4);
 assert.deepEqual(zones.filter(a=>a.target[1]>18).map(a=>[a.role,a.target,a.radius]),[
  ['C-R',[40,26],[13,8]],['S-L',[13.3,26],[13,8]]
 ]);
 assert.deepEqual(d.assignments.find(a=>a.role==='S-R').target,[41,7]);
 const original=defense.find(d=>d.id==='pdf-cover6-left');assert.equal(original.rush,4);
 assert.equal(original.assignments.find(a=>a.role==='WLB').mode,'zone');
 assert.equal(original.assignments.find(a=>a.role==='S-R').target[1],26);
});
test('W attacks outside while safety is already aligned shallow before the snap',()=>{
 const sim=simulate({offense:'drawn-cross',defense:'cover6-w-blitz',release:4.5,seed:42});
 const before=sim.frames[0],after=sim.frames[20];
 const player=(frame,id)=>frame.players.find(p=>p.id===id);
 assert.equal(before.players.length,22);
 assert.ok(player(after,'WLB').y<player(before,'WLB').y);
 assert.ok(player(after,'WLB').x>player(before,'WLB').x);
 assert.deepEqual([player(before,'S-R').x,player(before,'S-R').y],[41,7]);
 assert.ok(player(after,'S-R').y<12);
 assert.ok(player(after,'C-R').y>player(before,'C-R').y);
 assert.ok(player(after,'C-R').x<player(before,'C-R').x);
 assert.ok(sim.frames.some(f=>player(f,'WLB').y<0),'W must cross the line rather than stop in a zone');
 const crossing=sim.frames.find(f=>player(f,'WLB').y<0);
 assert.ok(player(crossing,'WLB').x>35,'W crosses outside the right tackle, not through the A gap');
});
