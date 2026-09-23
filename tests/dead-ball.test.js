import test from 'node:test';
import assert from 'node:assert/strict';
import {simulate,batch,WIDTH,DT} from '../dist/engine.js';
import {offense,defense,assignmentPath} from '../dist/data.js';
import {DEFAULT_MATCHUP} from '../dist/config.js';

test('custom matchup defaults exist and custom safety starts in shallow coverage',()=>{
 assert.equal(DEFAULT_MATCHUP.offense,'drawn-cross');assert.equal(DEFAULT_MATCHUP.defense,'cover6-w-blitz');
 const sim=simulate(DEFAULT_MATCHUP),s=sim.frames[0].players.find(p=>p.id==='S-R');
 assert.deepEqual([s.x,s.y],[41,7]);
 const original=simulate({defense:'pdf-cover6-left'}).frames[0].players.find(p=>p.id==='S-R');assert.equal(original.y,18);
});
test('unopposed pass and run carriers play beyond eight seconds until touchdown',()=>{
 for(const play of ['mesh','inside','outside','drawn-cross']){
  const sim=simulate({offense:play,seed:42,release:1.7,parameters:{breakTackleChance:1,catchAbility:2,shedBlockChance:0}});
  assert.ok(sim.result.duration>8);assert.equal(sim.result.outcome,'达阵');assert.equal(sim.result.gain,65);
  assert.equal(sim.frames.at(-1).phase,'达阵');
  assert.equal('limited' in sim.result,false);
 }
 const summary=batch({offense:'inside',parameters:{breakTackleChance:1}},10);assert.equal('limited' in summary,false);
});
test('a run crossing the sideline ends immediately and mirrors correctly',()=>{
 // Isolate the boundary with a short test-only run, without altering production plays.
 const fixture={...offense.find(p=>p.id==='outside'),id:'test-sideline',starts:[[6,0],[17,-1],[36,-1],[47,0],[52,-4]],routes:[[[6,12]],[[17,9]],[[36,9]],[[48,12]],[[52,-4],[60,-4]]]};
 offense.push(fixture);
 try{
  for(const mirror of [false,true]){
   const sim=simulate({offense:fixture.id,mirror,parameters:{breakTackleChance:1}});
   assert.equal(sim.result.outcome,'持球出界');
   const last=sim.frames.at(-1),before=sim.frames.at(-2);
   assert.ok(mirror?last.ball.x<=0:last.ball.x>=WIDTH);
   assert.ok(before.ball.x>0&&before.ball.x<WIDTH);
   assert.equal(last.time,sim.result.duration);
  }
 }finally{offense.pop();}
});
test('a pass leaving the field is incomplete, not a catch outside the boundary',()=>{
 const fixture={...offense[0],id:'test-out-pass',starts:[[52,0],[17,-1],[36,-1],[47,0],[23,-6]],routes:[[[62,8]],...offense[0].routes.slice(1)]};
 offense.push(fixture);
 try{
  const sim=simulate({offense:fixture.id,target:0,release:0.8,parameters:{catchAbility:2,shedBlockChance:0}});
  assert.equal(sim.result.outcome,'传球未完成');assert.equal(sim.result.passComplete,false);assert.equal(sim.result.gain,0);
  assert.ok(sim.events.some(e=>e.text.includes('出界')));
 }finally{offense.pop();}
});
test('W follows the displayed smooth arc, crosses outside and preserves speed',()=>{
 const assignment=defense.find(d=>d.id===DEFAULT_MATCHUP.defense).assignments.find(a=>a.role==='WLB');
 const path=[assignment.start,...assignmentPath(assignment)];
 assert.ok(path.length>50);
 assert.ok(path.find(p=>p[1]<0)[0]>35);
 const sim=simulate({...DEFAULT_MATCHUP,release:4.5,parameters:{shedBlockChance:1}});
 const points=sim.frames.filter(f=>f.time<=2).map(f=>f.players.find(p=>p.id==='WLB'));
 let previousDirection;
 for(let i=1;i<points.length;i++){
  const dx=points[i].x-points[i-1].x,dy=points[i].y-points[i-1].y;
  assert.ok(Math.hypot(dx,dy)<=7.4*DT+1e-8);
  const direction=Math.atan2(dy,dx);
  if(previousDirection!==undefined){const turn=Math.abs(Math.atan2(Math.sin(direction-previousDirection),Math.cos(direction-previousDirection)));assert.ok(turn<0.3,'no abrupt right-angle corner');}
  previousDirection=direction;
 }
});
