// Shared defaults for the simulation and the on-page parameter controls.
// Edit `default` to change the initial value; page adjustments last until refresh.
export const DEFAULT_MATCHUP=Object.freeze({offense:'drawn-cross',defense:'cover6-w-blitz',front:'even'});
export const parameterDefinitions = Object.freeze({
 releaseTime: {label:'出手时机',default:2.8,min:0.8,max:4.5,step:0.1,unit:' s',help:'出手前 QB 等待的秒数；同时影响压力到达的机会。选择其他战术时会载入该战术的默认时机。'},
 passDepthWeight: {label:'传球深度权重',default:0.20,min:0,max:2,step:0.01,unit:'',help:'自动选目标时，每码推进深度增加的分数；0 表示只看分离距离。'},
 catchAbility: {label:'接球能力倍率',default:1,min:0,max:2,step:0.05,unit:'×',help:'缩放原模型的接球成功概率；0 无法接住，1 为原模型，2 为两倍（受抄截概率上限约束）。'},
 breakTackleChance: {label:'持球手挣脱擒抱',default:0.15,min:0,max:1,step:0.05,unit:'%',help:'每次与防守者接触时挣脱的概率；成功后对手短暂停顿。适用于接球与跑球后的持球者。'},
 shedBlockChance: {label:'冲传手摆脱阻挡',default:0.25,min:0,max:1,step:0.05,unit:'%',help:'每次与一名阻挡者接触时摆脱的概率；成功后本次持续接触不再减速。'}
});
export const DEFAULT_PARAMETERS=Object.freeze(Object.fromEntries(Object.entries(parameterDefinitions).map(([key,d])=>[key,d.default])));
export const contactRules=Object.freeze({
 tackleRadius:0.85,
 tackleResetDistance:1.5,
 missedTackleRecovery:0.6, // seconds
 blockResetDistance:3,
});
export function resolveParameters(overrides={}){
 return Object.fromEntries(Object.entries(parameterDefinitions).map(([key,d])=>{
  const v=overrides?.[key];
  return [key,typeof v==='number'&&Number.isFinite(v)?Math.max(d.min,Math.min(d.max,v)):d.default];
 }));
}
