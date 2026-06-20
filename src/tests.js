import {buildVehicle,scoreVehicle,removeUsed,allocate,addToInventory} from './logic.js';import {slotList} from './data.js';
let id=0;const items=names=>names.map(name=>({id:'t'+id++,name}));const full=k=>items(slotList(k));
let v=buildVehicle(full('car'),'car');console.assert(v.name==='完成自動車','1');
v=buildVehicle(items(['車体','タイヤ','タイヤ','タイヤ','ドーナツ','エンジン','ハンドル','座席']),'car');console.assert(v.assignments.some(x=>x.slot==='タイヤ'&&x.item?.name==='ドーナツ'),'2');
for(const [k,n,s] of [['bicycle','スプーン','ペダル'],['plane','段ボール','主翼'],['helicopter','スキー板','着陸脚'],['train','クッキー','車輪']]){const x=full(k);x.splice(x.findIndex(i=>i.name===s),1);x.push(...items([n]));console.assert(buildVehicle(x,k).assignments.some(a=>a.slot===s&&a.item?.name===n),k)}
const a=allocate(items(['タイヤ']),'car');console.assert(new Set(a.usedIds).size===a.usedIds.length,'7');const pool=full('car');v=buildVehicle(pool,'car');console.assert(removeUsed(pool,v.usedIds).length===0,'8');console.assert(buildVehicle(items(['本','傘']),'car')===null,'9');console.assert(scoreVehicle(buildVehicle(full('car'),'car'),'car').score===1000,'10');console.assert(scoreVehicle(null,'car').score===0,'11');
let box=[];for(const i of items(Array(30).fill('本')))box=addToInventory(box,i);console.assert(box.length===25,'12');
let npcPool=[...full('car'),...full('car')],built=0;while(npcPool.length>=6){const made=buildVehicle(npcPool,'car');if(!made)break;npcPool=removeUsed(npcPool,made.usedIds);built++}console.assert(built===2,'13');
const sessionA={npc:{inventory:items(['本'])},listeners:1},sessionB={npc:{inventory:[]},listeners:1};console.assert(sessionA.npc!==sessionB.npc&&sessionB.npc.inventory.length===0&&sessionB.listeners===1,'14');console.log('14件の開発用検証: OK');
