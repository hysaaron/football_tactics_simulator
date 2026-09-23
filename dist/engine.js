import {offense,defense,fronts,assignmentPath} from './data.js';
import {resolveParameters,contactRules} from './config.js';
export const DT=0.05, WIDTH=53.3;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function rng(seed){let v=seed>>>0;return()=>{v+=0x6D2B79F5;let t=v;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
function move(p,target,speed){const d=dist(p,target);if(d>0){const f=Math.min(1,speed*DT/d);p.x+= (target.x-p.x)*f;p.y+=(target.y-p.y)*f;}if(p.side!=='o')p.x=clamp(p.x,0.5,52.8);}
export function outsideField(p,los){return p.x<=0||p.x>=WIDTH||p.y>=110-los||p.y<=-10-los;}
function rushAlongPath(p,qb,speed){
 let budget=speed*DT;
 while(budget>0){
  const target=p.blitzRoute?.[p.blitzLeg]||qb,d=dist(p,target);
  if(d>budget){move(p,target,budget/DT);return;}
  p.x=target.x;p.y=target.y;budget-=d;
  if(!p.blitzRoute?.[p.blitzLeg])return;
  p.blitzLeg++;
 }
}
function advanceRoute(p,speed=p.speed,continueRoute=false){
 if(p.x<=0||p.x>=WIDTH)return;
 const target=p.route[p.leg];if(!target)return;
 if(continueRoute&&p.leg===p.route.length-1&&(p.continuing||dist(p,target)<0.2)){
  // Continue the final route direction, allowing a receiver to go out of bounds.
  const previous=p.route[p.leg-1]||p.start;
  const dx=target.x-previous.x,dy=target.y-previous.y;
  move(p,Math.hypot(dx,dy)<0.01?{x:p.x,y:p.y+10}:{x:p.x+dx,y:p.y+dy},speed);
  p.continuing=true;
 }else {move(p,target,speed);if(dist(p,target)<0.2&&p.leg<p.route.length-1)p.leg++;}
}
function leadPass(qb,receiver){
 // Predict with the same fixed-step movement used by the live receiver.
 const projected={...receiver};
 for(let steps=1;;steps++){
  advanceRoute(projected,projected.speed,true);
  const duration=steps*DT;
  if(duration>=0.3&&dist(qb,projected)<=28*duration){
   return {to:{x:projected.x,y:projected.y},duration};
  }
 }
}
export function simulate(config={}){
 const parameters=resolveParameters(config.parameters);
 const play=offense.find(p=>p.id===config.offense)||offense[0],def=defense.find(p=>p.id===config.defense)||defense[0];
 const random=rng(config.seed??42), los=clamp(Number(config.los)||35,5,90), toGo=clamp(Number(config.toGo)||10,1,30), release=clamp(Number(config.release??parameters.releaseTime??play.time)||play.time,0.8,4.5);
 const mirrored=Boolean(config.mirror),mx=x=>mirrored?WIDTH-x:x;
 const starts=play.starts||[[6,0],[17,-1],[36,-1],[47,0],[23,-6]];
 const players=starts.map(([x,y],i)=>({id:['X','H','Y','Z','RB'][i],side:'o',x:mx(x),y,start:{x:mx(x),y},route:play.routes[i].map(([x,y])=>({x:mx(x),y})),leg:0,speed:6.5+random()*0.8}));
 for(let i=0;i<5;i++)players.push({id:['LT','LG','C','RG','RT'][i],side:'o',x:mx(22.65+i*2),y:0,speed:3});
 const qbStart=play.qbStart||[26.65,play.type==='run'?-2:-5];
 players.push({id:'QB',side:'o',x:mx(qbStart[0]),y:qbStart[1],speed:4});
 const front=fronts.find(f=>f.id===(config.front||def.front))||fronts[0];
 for(let i=0;i<(def.assignments?4:def.rush);i++){
  const x=def.assignments?front.xs[i]:i<4?21+i*3.8:24+(i-4)*5;
  players.push({id:i<4?['E','T','T','E'][i]:'B',side:'d',x:mx(x),y:i<4?1.8:4,speed:5+random()*0.7,rusher:true,
   duty:def.assignments?(i===0||i===3?'contain':'penetrate'):null,rushLane:mx(x)});
 }
 if(def.assignments){
  def.assignments.forEach(a=>players.push({id:a.role,side:'d',x:mx(a.start[0]),y:a.start[1],speed:6.6+random()*0.8,
   target:a.target?{x:mx(a.target[0]),y:a.target[1]}:null,radius:a.radius,mark:a.mode==='man'?a.mark:null,rotating:a.mode==='zone',
   rusher:a.mode==='blitz',blitzRoute:a.mode==='blitz'?assignmentPath(a).map(([x,y])=>({x:mx(x),y})):null,blitzLeg:0}));
 }else def.targets.forEach(([x,y],i)=>players.push({id:def.man&&i<5?'M':y>18?'S':'B',side:'d',x:mx(def.man&&i<5?starts[i][0]:x),y:def.man&&i<5?Math.max(2,starts[i][1]+2):Math.min(y,14),speed:6.6+random()*0.8,target:{x:mx(x),y},mark:def.man&&i<5?i:null}));
 const qb=players[10], defenders=players.filter(p=>p.side==='d'), rushers=defenders.filter(p=>p.rusher), frames=[],events=[{time:0,text:'开球 · 路线开始展开'}];
 if(def.assignments?.some(a=>a.mode==='blitz'))events.push({time:0,text:'W 弧线外侧突袭 · 右安全卫已前移至浅区，左安全卫与右角卫守双深半场'});
 const blockers=players.slice(5,10),blockContacts=new Map(),tackleContacts=new Set();
 const isBlocked=(rusher,radius,t)=>{
  let held=false;
  blockers.forEach((blocker,i)=>{
   const key=`${defenders.indexOf(rusher)}:${i}`,distance=dist(rusher,blocker);
   if(distance>contactRules.blockResetDistance)blockContacts.delete(key);
   if(distance>=radius)return;
   if(!blockContacts.has(key)){
    const escaped=random()<parameters.shedBlockChance;blockContacts.set(key,escaped);
    if(escaped)events.push({time:t,text:`${rusher.id} 摆脱 ${blocker.id} 阻挡`});
   }
   if(!blockContacts.get(key))held=true;
  });
  return held;
 };
 let carrier=10,flight=null,terminalBall=null,thrown=false,done=false,outcome='',gain=0,passComplete=false,turnover=false,selected=null;
 const ball=()=>terminalBall|| (flight?{x:flight.from.x+(flight.to.x-flight.from.x)*flight.progress,y:flight.from.y+(flight.to.y-flight.from.y)*flight.progress}:{x:players[carrier].x,y:players[carrier].y});
 const save=t=>frames.push({time:+t.toFixed(2),players:players.map(({id,side,x,y})=>({id,side,x,y})),ball:ball(),carrier:flight?null:carrier,flight:!!flight,phase:done?outcome:flight?'传球飞行中':carrier===10?'战术展开':`持球推进 · ${players[carrier].id}`});
 const end=(text,y)=>{done=true;outcome=text;gain=Math.round(clamp(y,-los,100-los));};
 save(0);
 for(let step=1;!done;step++){
  const t=step*DT;
  players.slice(0,5).forEach((p,i)=>{
   if(outsideField(p,los))return;
   if(i===carrier&&thrown&&!flight){
    if(play.type==='pass'||(p.leg===p.route.length-1&&dist(p,p.route[p.leg])<0.3))p.upfield=true;
    if(p.upfield){move(p,{x:p.x,y:105-los},p.speed*0.84);return;}
   }
   advanceRoute(p,p.speed*(i===carrier?0.88:1),play.type==='pass');
  });
  if(!thrown&&play.type==='pass')move(qb,{x:mx(26.65),y:-7},1.4);
  else if(flight)move(qb,flight.to,0.8);
  players.slice(5,10).forEach((p,i)=>{const enemy=rushers[i%rushers.length];move(p,{x:enemy.x,y:Math.min(play.type==='run'?6:1,enemy.y)},play.type==='run'?3.8:2.2);});
  defenders.forEach((p,i)=>{
   if(t<(p.recoverUntil||0))return;
   if(carrier!==10&&!flight){const blocked=p.rusher&&isBlocked(p,2.5,t);move(p,players[carrier],p.speed*(blocked?0.22:1));return;}
   if(p.rusher){const blocked=isBlocked(p,2.3,t);
    // PDF tackles penetrate their lane; ends maintain the edge before closing.
    if(p.blitzRoute){rushAlongPath(p,qb,p.speed*(blocked?0.16:0.85));}
    else {const rushTarget=p.duty&&p.y>(p.duty==='contain'?-3:-1)?{x:p.rushLane,y:-4}:qb;
     move(p,rushTarget,p.speed*(blocked?0.16:0.85));}}
   else if(p.mark!==null){move(p,players[p.mark],p.speed*0.94);}
   else {
    if(p.rotating&&dist(p,p.target)<1)p.rotating=false;
    const nearby=p.rotating?null:players.slice(0,5).filter(r=>p.radius?
     Math.hypot((r.x-p.target.x)/p.radius[0],(r.y-p.target.y)/p.radius[1])<=1:dist(r,p.target)<7).sort((a,b)=>dist(a,p)-dist(b,p))[0];
    move(p,nearby||p.target,p.speed*0.88);
   }
  });
  if(!thrown&&play.type==='run'&&t>=play.time){carrier=4;thrown=true;events.push({time:t,text:'交球 · RB 进入跑球路线'});}
  if(!thrown&&play.type==='pass'){
   if(defenders.some(p=>dist(p,qb)<0.85)){end('擒杀',qb.y);events.push({time:t,text:'压力到达 · 四分卫被擒杀'});}
   else if(t>=release){
    const options=players.slice(0,5).map((p,i)=>({i,space:outsideField(p,los)?-Infinity:Math.min(...defenders.map(d=>dist(d,p))),depth:p.y}));
    selected=Number.isInteger(config.target)&&config.target>=0&&config.target<5?options[config.target]:options.sort((a,b)=>(b.space+Math.min(b.depth,toGo)*parameters.passDepthWeight)-(a.space+Math.min(a.depth,toGo)*parameters.passDepthWeight))[0];
    const receiver=players[selected.i];
    flight={from:{x:qb.x,y:qb.y},...leadPass(qb,receiver),progress:0,start:t,index:selected.i};
    thrown=true;events.push({time:t,text:`出手 → ${receiver.id} · 出手时分离 ${selected.space.toFixed(1)} 码`});
   }
  }
  if(flight){flight.progress=clamp((t-flight.start+1e-9)/flight.duration,0,1);
   if(outsideField(ball(),los)){terminalBall=ball();flight=null;end('传球未完成',0);events.push({time:t,text:'传球出界 · 本档结束'});}
   else if(flight.progress>=1){const p=players[flight.index],space=Math.min(...defenders.map(d=>dist(d,p))),roll=random();
    const interception=space<1.7?0.12:0.015,completion=clamp(0.48+space*0.075-Math.max(0,p.y-12)*0.008,0.3,0.94);
    const catchProbability=clamp((completion-interception)*parameters.catchAbility,0,1-interception);
    if(outsideField(p,los)||dist(p,flight.to)>1.2){terminalBall={...flight.to};end('传球未完成',0);events.push({time:t,text:'传球未完成 · 接球目标出界或球未进入接球范围'});}
    else if(roll<interception){terminalBall={x:p.x,y:p.y};turnover=true;end('传球被抄截',0);events.push({time:t,text:'防守者完成抄截'});}
    else if(roll>=interception+catchProbability){terminalBall={x:p.x,y:p.y};end('传球未完成',0);events.push({time:t,text:'传球未完成 · 本档结束'});}
    else {carrier=flight.index;passComplete=true;events.push({time:t,text:`${p.id} 接球 · 向前推进`});}
    flight=null;
   }
  }
  if(!done&&carrier!==10&&!flight){const p=players[carrier];
   if(outsideField(p,los)){end('持球出界',p.y);events.push({time:t,text:`持球出界 · 推进 ${Math.round(p.y)} 码`});}
   else if(p.y>=100-los){end('达阵',100-los);events.push({time:t,text:'持球越过达阵线'});}
   else {
    for(const d of defenders){
     const distance=dist(d,p);
     if(distance>contactRules.tackleResetDistance)tackleContacts.delete(d);
     if(distance>=contactRules.tackleRadius||tackleContacts.has(d)||t<(d.recoverUntil||0))continue;
     tackleContacts.add(d);
     if(random()<parameters.breakTackleChance){d.recoverUntil=t+contactRules.missedTackleRecovery;events.push({time:t,text:`${p.id} 挣脱 ${d.id} 擒抱`});}
     else {end('被擒抱',p.y);events.push({time:t,text:`擒抱 · 推进 ${Math.round(p.y)} 码`});break;}
    }
   }
  }
  save(t);
 }
 return {frames,events,result:{outcome,gain,passComplete,turnover,firstDown:!turnover&&gain>=Math.min(toGo,100-los),duration:frames.at(-1).time},config:{...config,los,toGo,release,parameters}};
}
export function batch(config,count=100){
 const results=Array.from({length:count},(_,i)=>simulate({...config,seed:(config.seed??42)+i}).result);
 return {count,avgGain:results.reduce((a,r)=>a+r.gain,0)/count,firstDown:results.filter(r=>r.firstDown).length/count,completion:results.filter(r=>r.passComplete).length/count,turnovers:results.filter(r=>r.turnover).length/count};
}
