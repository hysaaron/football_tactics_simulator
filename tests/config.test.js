import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_PARAMETERS,resolveParameters} from '../dist/config.js';
import {simulate,batch} from '../dist/engine.js';

test('parameters default, preserve zero, clamp bounds and reject non-numeric values',()=>{
 assert.deepEqual(resolveParameters(),DEFAULT_PARAMETERS);
 assert.deepEqual(resolveParameters({passDepthWeight:0,catchAbility:0,breakTackleChance:0,shedBlockChance:0}),{passDepthWeight:0,catchAbility:0,breakTackleChance:0,shedBlockChance:0});
 assert.deepEqual(resolveParameters({passDepthWeight:-5,catchAbility:Infinity,breakTackleChance:5,shedBlockChance:'bad'}),{passDepthWeight:0,catchAbility:DEFAULT_PARAMETERS.catchAbility,breakTackleChance:1,shedBlockChance:DEFAULT_PARAMETERS.shedBlockChance});
 assert.deepEqual(resolveParameters(null),DEFAULT_PARAMETERS);
});
test('depth weighting changes automatic selection but not manual targeting',()=>{
 const run=(weight,target='auto')=>simulate({offense:'mesh',release:1.5,target,seed:42,parameters:{passDepthWeight:weight,shedBlockChance:0}});
 const target=s=>s.events.find(e=>e.text.startsWith('出手')).text.split(' · ')[0];
 assert.equal(target(run(0)),'出手 → RB');assert.equal(target(run(2)),'出手 → Z');
 assert.equal(target(run(0,1)),target(run(2,1)));
});
test('catch ability changes completions without changing interception outcomes',()=>{
 let completions=0,flights=0;
 for(let seed=1;seed<=40;seed++){
  const run=catchAbility=>simulate({seed,offense:'mesh',release:1.5,parameters:{catchAbility,shedBlockChance:0}});
  const low=run(0),normal=run(1),high=run(2);
  assert.equal(low.result.passComplete,false);
  assert.equal(low.result.turnover,high.result.turnover);
  if(normal.result.passComplete)assert.equal(high.result.passComplete,true);
  completions+=high.result.passComplete;flights+=high.frames.some(f=>f.flight);
 }
 assert.ok(flights>30);assert.ok(completions>20);
});
test('tackle escape probability endpoints affect both run and pass carriers',()=>{
 for(const offense of ['inside','mesh']){
  const run=breakTackleChance=>simulate({offense,release:1.7,seed:42,parameters:{breakTackleChance,shedBlockChance:0,catchAbility:2}});
  const low=run(0),high=run(1);
  assert.equal(low.result.outcome,'被擒抱');
  assert.equal(low.events.some(e=>e.text.includes('挣脱')),false);
  assert.notEqual(high.result.outcome,'被擒抱');
  assert.ok(high.events.some(e=>e.text.includes('挣脱')));
  assert.ok(high.result.gain>low.result.gain);
 }
});
test('block shedding affects rush movement and is not rolled every frame',()=>{
 const run=shedBlockChance=>simulate({offense:'verts',release:4.5,seed:42,parameters:{shedBlockChance}});
 const low=run(0),high=run(1);
 assert.equal(low.events.some(e=>e.text.includes('摆脱')),false);
 assert.ok(high.events.some(e=>e.text.includes('摆脱')));
 assert.notDeepEqual(low.frames[20].players.slice(11,15),high.frames[20].players.slice(11,15));
 // At most one success per rusher/blocker pair during the initial contact.
 assert.ok(high.events.filter(e=>e.time<=0.4&&e.text.includes('摆脱')).length<=20);
});
test('configured simulation and batch use the same settings reproducibly',()=>{
 const config={offense:'drawn-cross',defense:'cover6-w-blitz',seed:73,parameters:{passDepthWeight:0.8,catchAbility:1.5,breakTackleChance:0.7,shedBlockChance:0.8}};
 const a=simulate(config),b=simulate(config),mirrored=simulate({...config,mirror:true});
 assert.deepEqual(a,b);assert.deepEqual(a.config.parameters,config.parameters);assert.deepEqual(a.result,mirrored.result);
 const results=Array.from({length:10},(_,i)=>simulate({...config,seed:73+i}).result);
 const summary=batch(config,10);assert.equal(summary.avgGain,results.reduce((sum,r)=>sum+r.gain,0)/10);
});
