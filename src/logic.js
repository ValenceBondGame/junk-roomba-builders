import {VEHICLES,VEHICLE_ORDER,COMMON,SUBSTITUTES,slotList} from './data.js';
export function relation(item,slot){if(item.name===slot)return {type:'exact',value:100,junk:0};if((COMMON[item.name]||[]).includes(slot))return {type:'common',value:90,junk:.05};if((SUBSTITUTES[item.name]||[]).includes(slot))return {type:'substitute',value:50,junk:.45};return {type:'junk',value:10,junk:.85}}
export function allocate(items,vehicleKey,allowJunk=true){
 const used=new Set(), assignments=[];
 for(const slot of slotList(vehicleKey)){
  let best=null;
  for(const item of items){if(used.has(item.id))continue;const rel=relation(item,slot);if(!allowJunk&&rel.type==='junk')continue;if(!best||rel.value>best.rel.value)best={item,rel};}
  if(best){used.add(best.item.id);assignments.push({slot,item:best.item,...best.rel});}else assignments.push({slot,item:null,type:'missing',value:0,junk:1});
 }
 return {assignments,usedIds:[...used],rate:assignments.reduce((s,a)=>s+a.value,0)/assignments.length};
}
export function findBestVehicle(items,target){return VEHICLE_ORDER.map((key,order)=>{const a=allocate(items,key,false);return {key,order,...a,exact:a.assignments.filter(x=>x.type==='exact').length,slots:a.assignments.length}}).sort((a,b)=>b.rate-a.rate||(b.key===target)-(a.key===target)||b.exact-a.exact||a.slots-b.slots||a.order-b.order)[0]}
const suffix={car:'自動車',bicycle:'自転車',plane:'飛行機',helicopter:'ヘリコプター',train:'電車'};
export function vehicleName(key,a,mystery=false){const subs=[...new Set(a.filter(x=>x.type==='substitute').map(x=>x.item.name))].slice(0,2);const junk=a.filter(x=>x.type==='junk').length;if(mystery||junk>=3)return ({car:'ガラクタ自動車',bicycle:'謎の自転車',plane:'飛ぶかもしれない飛行機',helicopter:'危険なヘリコプター',train:'よく分からない列車'})[key];if(!subs.length)return '完成'+suffix[key];return subs.join('＆')+suffix[key]}
export function buildVehicle(items,target){if(items.length<6)return null;const best=findBestVehicle(items,target);let allocation=allocate(items,best.key,false);const useful=allocation.assignments.filter(x=>x.item).length;let mystery=useful<6;if(mystery)allocation=allocate(items,best.key,true);const chosen=allocation.assignments.filter(x=>x.item);if(chosen.length<6){const extra=items.filter(i=>!allocation.usedIds.includes(i.id)).slice(0,6-chosen.length);extra.forEach(i=>{const miss=allocation.assignments.find(a=>!a.item);if(miss){Object.assign(miss,{item:i,type:'junk',value:10,junk:.85});allocation.usedIds.push(i.id)}})}const used=allocation.assignments.filter(x=>x.item);return {id:'v'+Math.random().toString(36).slice(2),base:best.key,name:vehicleName(best.key,used,mystery),assignments:allocation.assignments,items:used.map(x=>x.item),usedIds:used.map(x=>x.item.id),mystery}}
export function scoreVehicle(vehicle,target){const items=vehicle?.items||[];const a=allocate(items,target,true).assignments;const counts={exact:0,common:0,substitute:0,junk:0,missing:0};a.forEach(x=>counts[x.type]++);const degree=a.reduce((s,x)=>s+x.junk,0)/a.length;return {score:Math.max(0,Math.min(1000,Math.round(1000*(1-degree)))),degree,counts,assignments:a}}
export function removeUsed(items,ids){const s=new Set(ids);return items.filter(x=>!s.has(x.id))}
export function addToInventory(inventory,item,capacity=25){return inventory.length>=capacity?inventory:[...inventory,item]}
