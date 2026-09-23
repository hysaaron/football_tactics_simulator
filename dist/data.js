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
 {id:'outside',name:'Outside Zone',zh:'外侧区域跑',formation:'SINGLEBACK · 11',type:'run',tag:'外跑',desc:'横向拉伸前线后切向边路，观察边缘封堵与追击角度。',routes:[[[6,13]],[[17,10]],[[36,10]],[[48,13]],[[36,-4],[44,1],[47,22]]],time:0.65}
];
export const defense = [
 {id:'cover3',name:'Cover 3 Sky',zh:'三区联防',formation:'NICKEL · 4–2–5',tag:'区域',desc:'三人保护深区、四人守浅区。观察边线分层和接球后的补位。',rush:4,man:false,targets:[[8,22],[26.65,25],[45,22],[7,6],[20,9],[34,9],[46,6]]},
 {id:'cover2',name:'Cover 2',zh:'双高联防',formation:'NICKEL · 4–2–5',tag:'区域',desc:'两名安全卫保护纵深，五人分担浅区，测试深区中缝与边线空隙。',rush:4,man:false,targets:[[14,24],[40,24],[5,6],[15,9],[27,12],[39,9],[49,6]]},
 {id:'man',name:'Cover 1 Robber',zh:'单高盯人',formation:'NICKEL · 4–2–5',tag:'盯人',desc:'五人跟随接球目标，一人保护纵深，一人协防中路。',rush:4,man:true,targets:[[6,4],[17,4],[36,4],[47,4],[23,2],[27,24],[27,8]]},
 {id:'blitz',name:'Double A Blitz',zh:'双 A 缝突袭',formation:'NICKEL · 4–2–5',tag:'突袭',desc:'六人施压、五人盯防，用后场覆盖换取更短的四分卫决策窗口。',rush:6,man:true,targets:[[6,4],[17,4],[36,4],[47,4],[23,2]]}
];
export function teamDefaults(id) {
 const group = {KC:'mesh',SF:'outside',BAL:'inside',PHI:'inside',BUF:'verts',MIA:'flood',CIN:'slants',DET:'outside'};
 return {offense:group[id] || 'mesh',defense:['BAL','PIT','MIN'].includes(id)?'blitz':['SF','SEA'].includes(id)?'cover3':'cover2'};
}
