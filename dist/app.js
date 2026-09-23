import {teams,offense,defense,fronts,teamDefaults,assignmentPath} from './data.js';
import {simulate,batch,WIDTH} from './engine.js';
import {parameterDefinitions,DEFAULT_PARAMETERS,DEFAULT_MATCHUP,resolveParameters} from './config.js';
const $=id=>document.getElementById(id);
const state={offTeam:'KC',defTeam:'SF',...DEFAULT_MATCHUP,seed:42,los:35,toGo:10,release:offense.find(p=>p.id===DEFAULT_MATCHUP.offense).time,target:'auto',mirror:false,parameters:{...DEFAULT_PARAMETERS}};
state.release=state.parameters.releaseTime;
$('release').value=state.release;
let tab='o',simulation,playing=false,time=0,previous=0,batchResult=null;
const fmt=n=>Number(n).toFixed(2),percent=n=>`${Math.round(n*100)}%`;
const currentPlay=()=>offense.find(p=>p.id===state.offense);
$('target').parentElement.insertAdjacentHTML('beforebegin','<label id="frontLabel">防守前线 · 4–2–5<select id="front" aria-label="防守前线"></select></label>');
$('front').innerHTML=fronts.map(f=>`<option value="${f.id}">${f.name}</option>`).join('');
$('front').onchange=()=>{state.front=$('front').value;resetSimulation();};
 $('frontLabel').insertAdjacentHTML('afterend',`<details class="model-parameters"><summary>模拟参数</summary><p>本页调节即时生效；刷新后恢复配置文件默认值。参数对双方对应角色统一生效。</p>${Object.entries(parameterDefinitions).filter(([key])=>key!=='releaseTime').map(([key,d])=>`<label>${d.label}<output id="parameter-value-${key}"></output><input id="parameter-${key}" type="range" min="${d.min}" max="${d.max}" step="${d.step}" value="${d.default}" aria-label="${d.label}"><small>${d.help}</small></label>`).join('')}<div id="releaseParameterHelp">${parameterDefinitions.releaseTime.help}</div><button id="resetParameters" class="quiet" type="button">恢复默认参数</button></details>`);
const releaseControl=$('release').parentElement;
releaseControl.firstChild.textContent=parameterDefinitions.releaseTime.label+' ';
releaseControl.insertAdjacentHTML('beforeend',`<small>${parameterDefinitions.releaseTime.help}</small>`);
$('releaseParameterHelp').before(releaseControl);
function showParameter(key){const d=parameterDefinitions[key],v=state.parameters[key];$('parameter-value-'+key).textContent=d.unit==='%'?`${Math.round(v*100)}%`:`${v.toFixed(2)}${d.unit}`;}
for(const key of Object.keys(parameterDefinitions)){
 showParameter(key);
 $('parameter-'+key).oninput=()=>{state.parameters=resolveParameters({...state.parameters,[key]:Number($('parameter-'+key).value)});showParameter(key);resetSimulation();};
}
$('resetParameters').onclick=()=>{state.parameters={...DEFAULT_PARAMETERS};state.release=state.parameters.releaseTime;$('release').value=state.release;$('releaseValue').textContent=`${state.release.toFixed(1)} s`;for(const key of Object.keys(parameterDefinitions).filter(key=>key!=='releaseTime')){$('parameter-'+key).value=state.parameters[key];showParameter(key);}resetSimulation();};
for(const id of ['offTeam','defTeam']){
 $(''+id).innerHTML=teams.map(t=>`<option value="${t.id}">${t.id} · ${t.zh}</option>`).join('');$(id).value=state[id];
 $(id).addEventListener('change',()=>{state[id]=$(id).value;const side=id==='offTeam'?'offense':'defense';state[side]=teamDefaults(state[id])[side];if(side==='offense'){state.release=currentPlay().time;state.parameters.releaseTime=state.release;$('release').value=state.release;$('releaseValue').textContent=`${state.release.toFixed(1)} s`;}$(id==='offTeam'?'offAbbr':'defAbbr').textContent=state[id];resetSimulation();renderCards();});
}
function miniature(play,isOff){
 const paths=isOff?play.routes.map((r,i)=>{const start=(play.starts||[[6,0],[17,-1],[36,-1],[47,0],[23,-6]])[i];return `<polyline points="${[start,...r].map(([x,y])=>`${x*3.5+3},${31-y*.75}`).join(' ')}" fill="none" stroke="${i===4?'#da938e':i===2?'#f7cc6a':'#aaaf87'}" stroke-width="1.3"/><circle cx="${start[0]*3.5+3}" cy="${31-start[1]*.75}" r="2.5" fill="#e0ba7a"/>`;}).join(''):play.assignments?play.assignments.map(a=>{
  const end=a.target||[[6,0],[17,-1],[36,-1],[47,0],[23,-6]][a.mark];
  return `<polyline points="${[a.start,...(a.mode==='blitz'?assignmentPath(a):[end])].map(([x,y])=>`${x*3.5+3},${31-y*.75}`).join(' ')}" fill="none" stroke="${a.mode==='blitz'?'#ff8875':'#8ab4c5'}" stroke-width="${a.mode==='blitz'?2:.8}"/>${a.mode==='zone'?`<ellipse cx="${end[0]*3.5+3}" cy="${31-end[1]*.75}" rx="${a.radius[0]*3.5}" ry="${a.radius[1]*.75}" stroke="#8ab4c5" fill="#8ab4c522"/>`:''}`;
 }).join(''):play.targets.map(([x,y])=>`<${play.man?'circle':'ellipse'} cx="${x*3.5+3}" cy="${35-y*.85}" ${play.man?'r="3"':'rx="13" ry="6"'} stroke="#8ab4c5" fill="${play.man?'#8ab4c5':'#8ab4c522'}"/>`).join('');
 return `<svg viewBox="0 0 194 42" aria-hidden="true"><path d="M0 31H194" stroke="#576a4c" stroke-dasharray="3 4"/>${paths}</svg>`;
}
function renderCards(){const key=tab==='o'?'offense':'defense';const list=[...(tab==='o'?offense:defense)].sort((a,b)=>Number(b.id===DEFAULT_MATCHUP[key])-Number(a.id===DEFAULT_MATCHUP[key]));
 $('playCount').textContent=`${String(list.length).padStart(2,'0')} PLAYS`;
 $('cards').innerHTML=list.map(p=>`<button class="card ${state[key]===p.id?(tab==='o'?'selected':'def-selected'):''}" aria-pressed="${state[key]===p.id}" data-id="${p.id}"><div class="card-top"><span class="card-title">${p.name}</span><span class="tag">${p.tag}</span></div><div class="formation">${p.formation}</div>${miniature(p,tab==='o')}</button>`).join('');
 $('cards').querySelectorAll('button').forEach(el=>el.addEventListener('click',()=>{state[key]=el.dataset.id;if(tab==='o'){state.release=currentPlay().time;state.parameters.releaseTime=state.release;$('release').value=state.release;$('releaseValue').textContent=`${state.release.toFixed(1)} s`;}resetSimulation();renderCards();}));
}
function selectTab(side){tab=side;for(const s of ['o','d']){$(`tab-${s}`).classList.toggle('active',s===side);$(`tab-${s}`).setAttribute('aria-selected',String(s===side));$(`tab-${s}`).tabIndex=s===side?0:-1;}renderCards();}
for(const s of ['o','d']){$(`tab-${s}`).onclick=()=>selectTab(s);$(`tab-${s}`).onkeydown=e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();const next=tab==='o'?'d':'o';selectTab(next);$(`tab-${next}`).focus();}};}
function updateDetails(){const o=currentPlay(),d=defense.find(p=>p.id===state.defense);$('matchTitle').innerHTML=`${o.name} <span>vs</span> ${d.name}`;
 $('offName').textContent=`${o.name} · ${o.zh}`;$('offDesc').textContent=o.desc;$('defName').textContent=`${d.name} · ${d.zh}`;$('defDesc').textContent=d.desc+(d.source?` 来源：${d.page?`PDF 第 ${d.page} 页`:d.source}。前线 ${fronts.find(f=>f.id===state.front).name}；E 封边收尾，T 沿缝突进。`:'');
 $('frontLabel').hidden=!d.assignments;
 $('target').disabled=o.type==='run';$('release').disabled=o.type==='run';$('releaseValue').textContent=o.type==='run'?'交球 0.65 s':`${Number(state.release).toFixed(1)} s`;
}
function resetSimulation(){playing=false;time=0;simulation=simulate(state);batchResult=null;$('timeline').max=simulation.result.duration;$('duration').textContent=`${fmt(simulation.result.duration)} s`;updateDetails();renderMetrics();render();}
const bounds={seed:[1,999999],los:[5,90],toGo:[1,30]};
for(const id of Object.keys(bounds))$(id).addEventListener('change',()=>{const [min,max]=bounds[id];const v=Number($(id).value);state[id]=Math.max(min,Math.min(max,Number.isFinite(v)?v:min));if(id!=='release')state[id]=Math.round(state[id]);$(id).value=state[id];resetSimulation();});
 $('release').addEventListener('input',()=>{state.release=Number($('release').value);state.parameters.releaseTime=state.release;$('releaseValue').textContent=`${state.release.toFixed(1)} s`;});
 $('release').addEventListener('change',()=>resetSimulation());
 $('target').onchange=()=>{state.target=$('target').value==='auto'?'auto':Number($('target').value);resetSimulation();};
 $('mirror').onchange=()=>{state.mirror=$('mirror').checked;resetSimulation();};
for(const id of ['routes','zones'])$(id).onchange=()=>render();
 $('play').onclick=()=>{if(time>=simulation.result.duration)time=0;playing=!playing;previous=performance.now();render();};
 $('reset').onclick=()=>{playing=false;time=0;render();};
 $('step').onclick=()=>{playing=false;time=Math.min(simulation.result.duration,time+0.1);render();};
 $('timeline').oninput=()=>{playing=false;time=Number($('timeline').value);render();};
 $('help').onclick=()=>$('modelDialog').showModal();$('closeHelp').onclick=()=>$('modelDialog').close();
 $('modelDialog').addEventListener('click',e=>{if(e.target===$('modelDialog')){const r=$('modelDialog').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('modelDialog').close();}});
function renderMetrics(){const m=batchResult;const pass=currentPlay().type==='pass';$('metrics').innerHTML=`<div><strong>${m?m.avgGain.toFixed(1):'—'}</strong><span>平均推进 / 码</span></div><div><strong>${m?percent(m.firstDown):'—'}</strong><span>首攻达成率</span></div><div><strong>${m?(pass?percent(m.completion):'不适用'):'—'}</strong><span>传球完成率</span></div>`;}
 $('batch').onclick=()=>{const button=$('batch');button.disabled=true;button.textContent='正在推演…';setTimeout(()=>{try{batchResult=batch(state,100);renderMetrics();button.innerHTML='重新运行 100 次 <span>↗</span>';button.title=`抄截率 ${percent(batchResult.turnovers)}；全部回合按死球事件结束。`;}finally{button.disabled=false;}},20);};
function drawField(frame){
 const viewBottom=Math.min(-12,...frame.players.map(p=>p.y-4)),viewTop=Math.max(42,...frame.players.map(p=>p.y+5));
 const scale=Math.min(10.6,580/(viewTop-viewBottom)),x=v=>64+v*(592/WIDTH),y=v=>38+(viewTop-v)*scale;
 let content=`<defs><marker id="arrow" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="none" stroke="#e8b666" stroke-width="1.2"/></marker><pattern id="grain" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 0H6" stroke="#719269" stroke-opacity=".035"/></pattern></defs><rect width="720" height="660" fill="#172d20"/><rect width="720" height="660" fill="url(#grain)"/>`;
 for(let absolute=Math.ceil((state.los+viewBottom)/5)*5;absolute<=Math.min(100,state.los+viewTop);absolute+=5){if(absolute<0)continue;const yy=y(absolute-state.los),major=absolute%10===0;content+=`<line x1="64" x2="656" y1="${yy}" y2="${yy}" stroke="#6a8e6a" stroke-opacity="${major?.42:.18}"/>`;
  if(major){const label=absolute<=50?absolute:100-absolute;content+=`<text x="29" y="${yy+5}" fill="#648168" font-family="monospace" font-size="16">${label===0?'G':label}</text><text x="676" y="${yy+5}" fill="#648168" font-family="monospace" font-size="16">${label===0?'G':label}</text>`;}}
 for(let a=Math.ceil(viewBottom);a<viewTop;a++){if(state.los+a<0||state.los+a>100)continue;for(const xx of [23.58,29.72])content+=`<line x1="${x(xx)-3}" x2="${x(xx)+3}" y1="${y(a)}" y2="${y(a)}" stroke="#6b886b" stroke-opacity=".45"/>`;}
 content+=`<path d="M64 26V622M656 26V622" stroke="#7e9a76" stroke-width="2" opacity=".6"/>`;
 const first=Math.min(state.toGo,100-state.los);
 content+=`<line x1="64" x2="656" y1="${y(first)}" y2="${y(first)}" stroke="#d7b76a" stroke-opacity=".7" stroke-dasharray="6 5"/><text x="69" y="${y(first)-8}" fill="#d6b96c" font-size="10" letter-spacing="1">${first===100-state.los?'GOAL LINE':'FIRST DOWN'}</text><line x1="64" x2="656" y1="${y(0)}" y2="${y(0)}" stroke="#6facc6" stroke-width="2" opacity=".8"/><text x="69" y="${y(0)+17}" fill="#88b9c8" font-size="10" letter-spacing="1">LINE OF SCRIMMAGE</text>`;
 const def=defense.find(p=>p.id===state.defense),mirror=v=>state.mirror?WIDTH-v:v;
 if($('zones').checked&&def.assignments){
  def.assignments.forEach(a=>{
   const target=a.target||[frame.players[a.mark].x,frame.players[a.mark].y];
   const tx=a.mode==='man'?target[0]:mirror(target[0]),ty=target[1];
   if(a.mode==='zone')content+=`<ellipse cx="${x(tx)}" cy="${y(ty)}" rx="${a.radius[0]*592/WIDTH}" ry="${a.radius[1]*scale}" fill="#81b4d1" fill-opacity=".055" stroke="#87b9d1" stroke-opacity=".3" stroke-dasharray="5 5"/>`;
   const points=[[mirror(a.start[0]),a.start[1]],...(a.mode==='blitz'?assignmentPath(a).map(([px,py])=>[mirror(px),py]):[[tx,ty]])];
   content+=`<polyline points="${points.map(([px,py])=>`${x(px)},${y(py)}`).join(' ')}" stroke="${a.mode==='blitz'?'#ff8875':'#87b9d1'}" stroke-width="${a.mode==='blitz'?2.5:1}" stroke-opacity=".75" stroke-dasharray="${a.mode==='blitz'?'none':'4 4'}" ${a.mode==='blitz'?'marker-end="url(#arrow)"':''} fill="none"/><text x="${x(tx)}" y="${y(ty)-10}" fill="#9dc6d6" font-size="11" text-anchor="middle">${a.role}${a.mode==='blitz'?' BLITZ':''}</text>`;
  });
 }else if($('zones').checked&&!def.man){for(const [zx,zy]of def.targets)content+=`<ellipse cx="${x(mirror(zx))}" cy="${y(zy)}" rx="${zy>18?80:56}" ry="${zy>18?70:42}" fill="#81b4d1" fill-opacity=".055" stroke="#87b9d1" stroke-opacity=".19" stroke-dasharray="5 5"/>`;}
 if($('routes').checked){const starts=simulation.frames[0].players;currentPlay().routes.forEach((route,i)=>{const points=[[starts[i].x,starts[i].y],...route.map(([xx,yy])=>[mirror(xx),yy])];content+=`<polyline points="${points.map(([xx,yy])=>`${x(xx)},${y(yy)}`).join(' ')}" fill="none" stroke="${i===2?'#eecd72':'#d39e5b'}" stroke-width="${i===2?2.2:1.6}" opacity="${time===0?.85:.38}" marker-end="url(#arrow)" stroke-linejoin="round"/>`;});}
 frame.players.forEach((p,i)=>{const xx=x(p.x),yy=y(p.y),isCarrier=frame.carrier===i&&time>0;content+=`<g transform="translate(${xx} ${yy})">`;
 if(isCarrier)content+='<circle r="15" stroke="#eee9b0" fill="none" stroke-width="1" opacity=".8"/>';
 if(p.side==='o')content+=`<circle r="10.4" fill="${p.id==='QB'?'#f8d484':'#f1a566'}" stroke="#172b20" stroke-width="2"/><text text-anchor="middle" dominant-baseline="central" font-family="sans-serif" font-size="${p.id.length===1?9:7}" font-weight="800" fill="#293122">${p.id}</text>`;
 else {content+='<circle r="11" fill="#1a322b" fill-opacity=".8"/><path d="M-6 -6L6 6M6 -6L-6 6" stroke="#88c3df" stroke-width="2.3" stroke-linecap="round"/>';if(def.assignments)content+=`<text text-anchor="middle" y="22" font-size="10" fill="#b5d7e6">${p.id}</text>`;}
 content+='</g>';});
 content+=`<ellipse cx="${x(frame.ball.x)+8}" cy="${y(frame.ball.y)-8}" rx="5" ry="3" transform="rotate(-35 ${x(frame.ball.x)+8} ${y(frame.ball.y)-8})" fill="#fff1c1" stroke="#64533a" stroke-width="1"/>`;
 $('field').innerHTML=content;
}
function render(){const index=Math.min(simulation.frames.length-1,Math.floor((time+0.00001)/0.05));const frame=simulation.frames[index],finished=time>=simulation.result.duration;
 drawField(frame);$('timeline').value=time;$('clock').textContent=`${fmt(time)} s`;$('play').textContent=playing?'Ⅱ 暂停':finished?'▶ 再次回放':time>0?'▶ 继续模拟':'▶ 开始模拟';$('status').textContent=finished?'回合结束':playing?'模拟中':time>0?'已暂停':'布阵中';
 $('resultTitle').textContent=finished?`${simulation.result.gain>0?'+':''}${simulation.result.gain} 码`:time===0?'等待开球':frame.phase;
 $('resultDetail').textContent=finished?`${simulation.result.outcome} · ${simulation.result.firstDown?'达成首攻':simulation.result.turnover?'球权转换':'未达成首攻'}`:time===0?'选择战术，然后开始模拟。':'拖动时间轴，观察空间与防守变化。';
 $('events').innerHTML=simulation.events.filter(e=>e.time<=time+0.001).map(e=>`<li><time>${fmt(e.time)}</time><span>${e.text}</span></li>`).join('');
}
function tick(now){if(playing){time=Math.min(simulation.result.duration,time+(now-previous)/1000*Number($('speed').value));if(time>=simulation.result.duration)playing=false;render();}previous=now;requestAnimationFrame(tick);}
renderCards();resetSimulation();requestAnimationFrame(tick);
// Optional imperative interface; unsupported browsers continue normally.
if(document.modelContext?.registerTool){try{Promise.resolve(document.modelContext.registerTool({name:'simulate_matchup',description:'配置攻防战术并显示完整模拟回放终点和结果。',inputSchema:{type:'object',properties:{offense:{type:'string',enum:offense.map(p=>p.id)},defense:{type:'string',enum:defense.map(p=>p.id)},seed:{type:'integer',minimum:1,maximum:999999}},required:['offense','defense','seed'],additionalProperties:false},annotations:{readOnlyHint:false},execute(input){if(!input||!offense.some(p=>p.id===input.offense)||!defense.some(p=>p.id===input.defense)||!Number.isInteger(input.seed)||input.seed<1||input.seed>999999)throw new Error('Invalid matchup');Object.assign(state,{offense:input.offense,defense:input.defense,seed:input.seed});state.release=currentPlay().time;state.parameters.releaseTime=state.release;$('seed').value=state.seed;$('release').value=state.release;$('releaseValue').textContent=`${state.release.toFixed(1)} s`;resetSimulation();renderCards();time=simulation.result.duration;render();return {...simulation.result};}})).catch(()=>{});}catch{}}
