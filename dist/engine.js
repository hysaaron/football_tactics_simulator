import {offense,defense} from './data.js';
export const DT=0.05, MAX_TIME=8, WIDTH=53.3;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function rng(seed){let v=seed>>>0;return()=>{v+=0x6D2B79F5;let t=v;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
function move(p,target,speed){const d=dist(p,target);if(d>0){const f=Math.min(1,speed*DT/d);p.x+= (target.x-p.x)*f;p.y+=(target.y-p.y)*f;}p.x=clamp(p.x,0.5,52.8);}
function advanceRoute(p,speed=p.speed,continueRoute=false){
 const target=p.route[p.leg];if(!target)return;
 if(continueRoute&&p.leg===p.route.length-1&&(p.continuing||dist(p,target)<0.2)){
  // Continue the final route direction; turn upfield at a sideline.
  const previous=p.route[p.leg-1]||p.start;
  const dx=target.x-previous.x,dy=target.y-previous.y;
  const atSideline=(dx<0&&p.x<=0.5)||(dx>0&&p.x>=52.8);
  move(p,atSideline||Math.hypot(dx,dy)<0.01?{x:p.x,y:p.y+10}:{x:p.x+dx,y:p.y+dy},speed);
  p.continuing=true;
 }else {move(p,target,speed);if(dist(p,target)<0.2&&p.leg<p.route.length-1)p.leg++;}
}
function leadPass(qb,receiver){
 // Predict with the same fixed-step movement used by the live receiver.
 const projected={...receiver};
 for(let steps=1;steps<=MAX_TIME/DT;steps++){
  advanceRoute(projected,projected.speed,true);
  const duration=steps*DT;
  if(duration>=0.3&&dist(qb,projected)<=28*duration){
   return {to:{x:projected.x,y:projected.y},duration};
  }
 }
 throw new Error('Unable to find a reachable pass target');
}
export function simulate(config={}){
 const play=offense.find(p=>p.id===config.offense)||offense[0],def=defense.find(p=>p.id===config.defense)||defense[0];
 const random=rng(config.seed??42), los=clamp(Number(config.los)||35,5,90), toGo=clamp(Number(config.toGo)||10,1,30), release=clamp(Number(config.release)||play.time,0.8,4.5);
 const mirrored=Boolean(config.mirror),mx=x=>mirrored?WIDTH-x:x;
 const starts=[[6,0],[17,-1],[36,-1],[47,0],[23,-6]];
 const players=starts.map(([x,y],i)=>({id:['X','H','Y','Z','RB'][i],side:'o',x:mx(x),y,start:{x:mx(x),y},route:play.routes[i].map(([x,y])=>({x:mx(x),y})),leg:0,speed:6.5+random()*0.8}));
 for(let i=0;i<5;i++)players.push({id:['LT','LG','C','RG','RT'][i],side:'o',x:mx(22.65+i*2),y:0,speed:3});
 players.push({id:'QB',side:'o',x:mx(26.65),y:play.type==='run'?-2:-5,speed:4});
 for(let i=0;i<def.rush;i++)players.push({id:i<4?['E','T','T','E'][i]:'B',side:'d',x:mx(i<4?21+i*3.8:24+(i-4)*5),y:i<4?1.8:4,speed:5+random()*0.7,rusher:true});
 def.targets.forEach(([x,y],i)=>players.push({id:def.man&&i<5?'M':y>18?'S':'B',side:'d',x:mx(def.man&&i<5?starts[i][0]:x),y:def.man&&i<5?Math.max(2,starts[i][1]+2):Math.min(y,14),speed:6.6+random()*0.8,target:{x:mx(x),y},mark:def.man&&i<5?i:null}));
 const qb=players[10], defenders=players.filter(p=>p.side==='d'), frames=[],events=[{time:0,text:'开球 · 路线开始展开'}];
 let carrier=10,flight=null,terminalBall=null,thrown=false,done=false,outcome='',gain=0,passComplete=false,turnover=false,selected=null;
 const ball=()=>terminalBall|| (flight?{x:flight.from.x+(flight.to.x-flight.from.x)*flight.progress,y:flight.from.y+(flight.to.y-flight.from.y)*flight.progress}:{x:players[carrier].x,y:players[carrier].y});
 const save=t=>frames.push({time:+t.toFixed(2),players:players.map(({id,side,x,y})=>({id,side,x,y})),ball:ball(),carrier:flight?null:carrier,flight:!!flight,phase:done?outcome:flight?'传球飞行中':carrier===10?'战术展开':`持球推进 · ${players[carrier].id}`});
 const end=(text,y)=>{done=true;outcome=text;gain=Math.round(clamp(y,-los,100-los));};
 save(0);
 for(let step=1;step<=MAX_TIME/DT&&!done;step++){
  const t=step*DT;
  players.slice(0,5).forEach((p,i)=>{
   if(i===carrier&&thrown&&!flight&&(play.type==='pass'||(p.leg===p.route.length-1&&dist(p,p.route[p.leg])<0.3))){move(p,{x:p.x,y:105-los},p.speed*0.84);return;}
   advanceRoute(p,p.speed*(i===carrier?0.88:1),play.type==='pass');
  });
  if(!thrown&&play.type==='pass')move(qb,{x:mx(26.65),y:-7},1.4);
  else if(flight)move(qb,flight.to,0.8);
  players.slice(5,10).forEach((p,i)=>{const enemy=defenders[i%def.rush];move(p,{x:enemy.x,y:Math.min(play.type==='run'?6:1,enemy.y)},play.type==='run'?3.8:2.2);});
  defenders.forEach((p,i)=>{
   if(carrier!==10&&!flight){const blocked=p.rusher&&players.slice(5,10).some(b=>dist(p,b)<2.5);move(p,players[carrier],p.speed*(blocked?0.22:1));return;}
   if(p.rusher){const blocked=players.slice(5,10).some(b=>dist(p,b)<2.3);move(p,qb,p.speed*(blocked?0.16:0.85));}
   else if(p.mark!==null){move(p,players[p.mark],p.speed*0.94);}
   else {const nearby=players.slice(0,5).filter(r=>dist(r,p.target)<7).sort((a,b)=>dist(a,p)-dist(b,p))[0];move(p,nearby||p.target,p.speed*0.88);}
  });
  if(!thrown&&play.type==='run'&&t>=play.time){carrier=4;thrown=true;events.push({time:t,text:'交球 · RB 进入跑球路线'});}
  if(!thrown&&play.type==='pass'){
   if(defenders.some(p=>dist(p,qb)<0.85)){end('擒杀',qb.y);events.push({time:t,text:'压力到达 · 四分卫被擒杀'});}
   else if(t>=release){
    const options=players.slice(0,5).map((p,i)=>({i,space:Math.min(...defenders.map(d=>dist(d,p))),depth:p.y}));
    selected=Number.isInteger(config.target)&&config.target>=0&&config.target<5?options[config.target]:options.sort((a,b)=>(b.space+Math.min(b.depth,toGo)*0.16)-(a.space+Math.min(a.depth,toGo)*0.16))[0];
    const receiver=players[selected.i];
    flight={from:{x:qb.x,y:qb.y},...leadPass(qb,receiver),progress:0,start:t,index:selected.i};
    thrown=true;events.push({time:t,text:`出手 → ${receiver.id} · 出手时分离 ${selected.space.toFixed(1)} 码`});
   }
  }
  if(flight){flight.progress=clamp((t-flight.start+1e-9)/flight.duration,0,1);
   if(flight.progress>=1){const p=players[flight.index],space=Math.min(...defenders.map(d=>dist(d,p))),roll=random();
    const interception=space<1.7?0.12:0.015,completion=clamp(0.48+space*0.075-Math.max(0,p.y-12)*0.008,0.3,0.94);
    if(dist(p,flight.to)>1.2){terminalBall={...flight.to};end('传球未完成',0);events.push({time:t,text:'传球未完成 · 球未进入接球范围'});}
    else if(roll<interception){terminalBall={x:p.x,y:p.y};turnover=true;end('传球被抄截',0);events.push({time:t,text:'防守者完成抄截'});}
    else if(roll>completion){terminalBall={x:p.x,y:p.y};end('传球未完成',0);events.push({time:t,text:'传球未完成 · 本档结束'});}
    else {carrier=flight.index;passComplete=true;events.push({time:t,text:`${p.id} 接球 · 向前推进`});}
    flight=null;
   }
  }
  if(!done&&carrier!==10&&!flight){const p=players[carrier];
   if(p.y>=100-los){end('达阵',100-los);events.push({time:t,text:'持球越过达阵线'});}
   else if(defenders.some(d=>dist(d,p)<0.85)){end('被擒抱',p.y);events.push({time:t,text:`擒抱 · 推进 ${Math.round(p.y)} 码`});}
  }
  if(step===MAX_TIME/DT&&!done)end('时间上限',players[carrier].y);
  save(t);
 }
 return {frames,events,result:{outcome,gain,passComplete,turnover,firstDown:!turnover&&gain>=Math.min(toGo,100-los),duration:frames.at(-1).time,limited:outcome==='时间上限'},config:{...config,los,toGo,release}};
}
export function batch(config,count=100){
 const results=Array.from({length:count},(_,i)=>simulate({...config,seed:(config.seed??42)+i}).result);
 return {count,avgGain:results.reduce((a,r)=>a+r.gain,0)/count,firstDown:results.filter(r=>r.firstDown).length/count,completion:results.filter(r=>r.passComplete).length/count,turnovers:results.filter(r=>r.turnover).length/count,limited:results.filter(r=>r.limited).length};
}
