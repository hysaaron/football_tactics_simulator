export const teams = [
 ['ARI','Arizona Cardinals','亚利桑那红雀'],['ATL','Atlanta Falcons','亚特兰大猎鹰'],['BAL','Baltimore Ravens','巴尔的摩乌鸦'],['BUF','Buffalo Bills','布法罗比尔'],
 ['CAR','Carolina Panthers','卡罗来纳黑豹'],['CHI','Chicago Bears','芝加哥熊'],['CIN','Cincinnati Bengals','辛辛那提猛虎'],['CLE','Cleveland Browns','克利夫兰布朗'],
 ['DAL','Dallas Cowboys','达拉斯牛仔'],['DEN','Denver Broncos','丹佛野马'],['DET','Detroit Lions','底特律雄狮'],['GB','Green Bay Packers','绿湾包装工'],
 ['HOU','Houston Texans','休斯顿得州人'],['IND','Indianapolis Colts','印第安纳波利斯小马'],['JAX','Jacksonville Jaguars','杰克逊维尔美洲虎'],['KC','Kansas City Chiefs','堪萨斯城酋长'],
 ['LAC','Los Angeles Chargers','洛杉矶闪电'],['LAR','Los Angeles Rams','洛杉矶公羊'],['LV','Las Vegas Raiders','拉斯维加斯突袭者'],['MIA','Miami Dolphins','迈阿密海豚'],
 ['MIN','Minnesota Vikings','明尼苏达维京人'],['NE','New England Patriots','新英格兰爱国者'],['NO','New Orleans Saints','新奥尔良圣徒'],['NYG','New York Giants','纽约巨人'],
 ['NYJ','New York Jets','纽约喷气机'],['PHI','Philadelphia Eagles','费城老鹰'],['PIT','Pittsburgh Steelers','匹兹堡钢人'],['SEA','Seattle Seahawks','西雅图海鹰'],
 ['SF','San Francisco 49ers','旧金山49人'],['TB','Tampa Bay Buccaneers','坦帕湾海盗'],['TEN','Tennessee Titans','田纳西泰坦'],['WAS','Washington Commanders','华盛顿指挥官']
].map(([id,name,zh])=>({id,name,zh}));
// Shared educational concepts, not licensed or season-specific team playbooks.
export const offense = [
 {id:'mesh',name:'Mesh Cross',zh:'交叉穿越',formation:'SHOTGUN · 11',type:'pass',tag:'短传',desc:'两条浅交叉路线制造横向空间，观察追防与区域交接。',routes:[[[7,6],[37,6]],[[13,15],[28,15]],[[42,7],[13,7]],[[46,18],[46,30]],[[20,-3],[12,2],[8,7]]],time:2.5},
 {id:'verts',name:'Four Verticals',zh:'四路纵深',formation:'SHOTGUN · 11',type:'pass',tag:'长传',desc:'四路纵向拉伸后场，比较双高安全卫与单高覆盖的空隙。',routes:[[[6,35]],[[19,35]],[[34,35]],[[47,35]],[[22,-2],[15,2]]],time:3.3},
 {id:'flood',name:'Flood Right',zh:'右侧分层',formation:'SHOTGUN · 11',type:'pass',tag:'中传',desc:'在右侧形成深、中、浅三层接球点，迫使区域防守做选择。',routes:[[[10,16],[41,26]],[[19,12],[48,12]],[[38,4],[49,4]],[[46,32]],[[24,-2],[35,1]]],time:2.9},
 {id:'slants',name:'Quick Slants',zh:'快速斜插',formation:'SHOTGUN · 11',type:'pass',tag:'快传',desc:'快速切入内侧，以更短的出手时间应对施压；注意中路防守者。',routes:[[[7,3],[26,15]],[[18,3],[33,12]],[[35,3],[22,12]],[[47,3],[29,16]],[[20,-2],[11,3]]],time:1.7},
 {id:'inside',name:'Inside Zone',zh:'内侧区域跑',formation:'SINGLEBACK · 11',type:'run',tag:'内跑',desc:'跑卫向内侧缺口推进，观察内线人数与线卫补位对推进的影响。',routes:[[[6,12]],[[17,9]],[[36,9]],[[48,12]],[[25,-2],[29,3],[27,20]]],time:0.65},
 {id:'outside',name:'Outside Zone',zh:'外侧区域跑',formation:'SINGLEBACK · 11',type:'run',tag:'外跑',desc:'横向拉伸前线后切向边路，观察边缘封堵与追击角度。',routes:[[[6,13]],[[17,10]],[[36,10]],[[48,13]],[[36,-4],[44,1],[47,22]]],time:0.65},
 {id:'drawn-cross',name:'Custom Left Cross',zh:'手绘左侧交叉',formation:'CUSTOM · 左侧双槽位',type:'pass',tag:'手绘',source:'用户红线图',
  desc:'按红线图转为向上进攻：X 深交叉向内，H 向左外切，Y 短内切，Z 右侧内切；RB 从后场向左横移。图中最上方圆圈按 RB、中锋后方无红线圆圈按 QB 解释；距离为示意估算。',
  starts:[[6,0],[13,-4],[17,-4],[47,0],[26.65,-10]],qbStart:[26.65,-4],
  routes:[[[6,9],[11,12],[16,17],[19,20]],[[13,2],[12.5,4],[10,8],[8,13],[7,17]],[[17,2],[21,5],[23.5,7.5]],[[46,6],[43,8],[42,10]],[[21,-9.8],[15,-8],[11,-7]]],time:2.8}
];
// PDF page 1: technique numbers in the source diagram's left-to-right order.
export const fronts = [
 {id:'even',name:'Even · 5–2–2–5',xs:[21.65,24.65,28.65,31.65]},
 {id:'over',name:'Over · 5–3–1–5',xs:[21.65,23.65,27.65,31.65]},
 {id:'under',name:'Under · 5–1–3–5',xs:[21.65,25.65,29.65,31.65]},
 {id:'wide',name:'Wide · 9–3–1–5',xs:[18.65,23.65,27.65,31.65]},
 {id:'wide9',name:'Wide · 9–3–1–9',xs:[18.65,23.65,27.65,34.65]}
];
const positions425=[['C-L',6,5],['C-R',47,5],['EG',16,7],['SLB',24,5],['WLB',31,5],['S-L',14,18],['S-R',40,18]];
const zone=(x,y,rx=6,ry=5)=>({mode:'zone',target:[x,y],radius:[rx,ry]});
const mark=i=>({mode:'man',mark:i});
function pdfDefense(id,name,zh,page,desc,responsibilities){
 const assignments=positions425.map(([role,x,y],i)=>({role,start:[x,y],...responsibilities[i]}));
 return {id,name,zh,formation:'PDF · 4–2–5',tag:'PDF',source:`4-2-5 Defense Sample explanation · 第 ${page} 页`,page,
  desc,front:'even',rush:4+assignments.filter(a=>a.mode==='blitz').length,man:false,assignments,targets:assignments.filter(a=>a.mode==='zone').map(a=>a.target)};
}
export const defense = [
 {id:'cover3',name:'Cover 3 Sky',zh:'三区联防',formation:'NICKEL · 4–2–5',tag:'区域',desc:'三人保护深区、四人守浅区。观察边线分层和接球后的补位。',rush:4,man:false,targets:[[8,22],[26.65,25],[45,22],[7,6],[20,9],[34,9],[46,6]]},
 {id:'cover2',name:'Cover 2',zh:'双高联防',formation:'NICKEL · 4–2–5',tag:'区域',desc:'两名安全卫保护纵深，五人分担浅区，测试深区中缝与边线空隙。',rush:4,man:false,targets:[[14,24],[40,24],[5,6],[15,9],[27,12],[39,9],[49,6]]},
 {id:'man',name:'Cover 1 Robber',zh:'单高盯人',formation:'NICKEL · 4–2–5',tag:'盯人',desc:'五人跟随接球目标，一人保护纵深，一人协防中路。',rush:4,man:true,targets:[[6,4],[17,4],[36,4],[47,4],[23,2],[27,24],[27,8]]},
 {id:'blitz',name:'Double A Blitz',zh:'双 A 缝突袭',formation:'NICKEL · 4–2–5',tag:'突袭',desc:'六人施压、五人盯防，用后场覆盖换取更短的四分卫决策窗口。',rush:6,man:true,targets:[[6,4],[17,4],[36,4],[47,4],[23,2]]},
 pdfDefense('pdf-cover2-man','425 Cover 2 Man','双高盯人',3,'两角卫盯 X/Z，EG 盯 H，强侧线卫盯 RB、弱侧线卫盯 Y；两名安全卫各守半场纵深。球员编号按图中职责映射。',[mark(0),mark(3),mark(1),mark(4),mark(2),zone(13.3,26,13,8),zone(40,26,13,8)]),
 pdfDefense('pdf-cover2-zone','425 Cover 2 Zone','双高区域',4,'两角卫守两侧浅区；EG、强侧和弱侧线卫分担三个中短区；两名安全卫保护两个深半场。',[zone(6,6),zone(47,6),zone(16,10),zone(26.65,9),zone(37,10),zone(13.3,26,13,8),zone(40,26,13,8)]),
 pdfDefense('pdf-cover2-invert','425 Cover 2 Invert','双高职责反转',5,'角卫由浅区回撤至深半场，两名安全卫下压至边线浅区；EG 与两名线卫保持中短区职责。',[zone(13.3,26,13,8),zone(40,26,13,8),zone(16,10),zone(26.65,9),zone(37,10),zone(6,6),zone(47,6)]),
 pdfDefense('pdf-cover3','425 Cover 3','三区轮转',6,'两角卫回撤深侧区，左安全卫转深中区；EG 补左浅区，右安全卫补右浅区，两线卫分守中短区。',[zone(8.9,26,8.8,8),zone(44.4,26,8.8,8),zone(6,6),zone(18,11),zone(36,11),zone(26.65,26,8.8,8),zone(47,6)]),
 pdfDefense('pdf-cover4','425 Cover 4 Zone','四深区域',7,'两角卫与两名安全卫各守四分之一深区；EG 补左浅区，强侧线卫补左中区，弱侧线卫覆盖较宽的右浅区。',[zone(6.66,26,6.6,8),zone(46.64,26,6.6,8),zone(6,6),zone(20,10,7,5),zone(40,8,12,5),zone(20,26,6.6,8),zone(33.3,26,6.6,8)]),
 pdfDefense('pdf-cover6-left','425 Cover 6 Left','左半场＋右四分区',8,'按原图左右：左角卫守浅区、左安全卫守深半场；右角卫与右安全卫各守一个深四分区，弱侧线卫向右侧浅区展开。',[zone(6,6),zone(46.64,26,6.6,8),zone(16,10),zone(26.65,9),zone(41,7,11,5),zone(13.3,26,13,8),zone(33.3,26,6.6,8)]),
 {...pdfDefense('cover6-w-blitz','425 C6 W Blitz','W 突袭 · 双深轮转',8,
  'W（WLB）沿右侧平滑弧线绕过 C/D 缝外缘，再收向 QB；右安全卫 S-R 开球前就站在右浅区（距开球线 7 码）。左安全卫 S-L 与右角卫 C-R 各守一个深半场，形成 Cover 2 式双深覆盖；左角卫、EG 和强侧线卫保持原浅区职责。共五人施压、四浅区、两深区。',
  [zone(6,6),zone(40,26,13,8),zone(16,10),zone(26.65,9),{mode:'blitz',curve:[[40,4],[40,-5]],target:[32,-6]},zone(13.3,26,13,8),{...zone(41,7,11,5),start:[41,7]}]),
  formation:'CUSTOM · 4–2–5',tag:'突袭',source:'用户示意图 · Cover 6 Left 的 W Blitz 变体',page:null}
];
// The diagram and runner share this sampled cubic Bézier curve.
export function assignmentPath(a){
 if(!a.curve)return a.path||[a.target];
 const [p0,p1,p2,p3]=[a.start,...a.curve,a.target];
 return Array.from({length:80},(_,i)=>{
  const t=(i+1)/80,u=1-t;
  return [0,1].map(axis=>u*u*u*p0[axis]+3*u*u*t*p1[axis]+3*u*t*t*p2[axis]+t*t*t*p3[axis]);
 });
}
export function teamDefaults(id) {
 const group = {KC:'mesh',SF:'outside',BAL:'inside',PHI:'inside',BUF:'verts',MIA:'flood',CIN:'slants',DET:'outside'};
 return {offense:group[id] || 'mesh',defense:['BAL','PIT','MIN'].includes(id)?'blitz':['SF','SEA'].includes(id)?'cover3':'cover2'};
}
