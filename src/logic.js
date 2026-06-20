import { ALL_ITEM_NAMES, BLUEPRINTS, CATEGORY, ITEM_SPAWN_CONFIG, NPC_DIFFICULTY, SUBSTITUTE_MAP, WORLD } from './data.js';

export function normalizeDifficulty(value) { return Object.hasOwn(NPC_DIFFICULTY, value) ? value : 'normal'; }
export function chooseRespawnName(pool, collectedName, random = Math.random) {
  if (!pool.length) return null;
  const choices = pool.length > 1 ? pool.filter(n => n !== collectedName) : pool;
  return choices[Math.floor(random() * choices.length)];
}
export function circleRectOverlap(x,y,r,o) { return x+r>o.x && x-r<o.x+o.w && y+r>o.y && y-r<o.y+o.h; }
export function isValidItemPosition(pos, { obstacles=[], actors=[], items=[], width=WORLD.width, height=WORLD.height, actorSafeDistance=ITEM_SPAWN_CONFIG.actorSafeDistance, itemDistance=ITEM_SPAWN_CONFIG.minItemDistance }) {
  const r=18;
  return pos.x>=r && pos.x<=width-r && pos.y>=r && pos.y<=height-r &&
    !obstacles.some(o=>circleRectOverlap(pos.x,pos.y,r,o)) &&
    !actors.some(a=>Math.hypot(pos.x-a.x,pos.y-a.y)<actorSafeDistance) &&
    !items.some(i=>Math.hypot(pos.x-i.x,pos.y-i.y)<itemDistance);
}
export function findFreePosition(context, random=Math.random, attempts=ITEM_SPAWN_CONFIG.maxPositionAttempts) {
  for(let i=0;i<attempts;i++){ const p={x:30+random()*(context.width-60),y:30+random()*(context.height-60)}; if(isValidItemPosition(p,context)) return p; }
  for(let y=35;y<context.height;y+=35) for(let x=35;x<context.width;x+=35) { const p={x,y}; if(isValidItemPosition(p,context)) return p; }
  return {x:context.width/2,y:35};
}
export function scoreVehicle(vehicle) {
  const bp=BLUEPRINTS[vehicle.base]; if(!bp) return {score:0,regular:0,junk:vehicle.parts?.length||0,completion:0};
  const needs=[...bp.parts], parts=vehicle.parts||[]; let regular=0, substitute=0;
  for(const name of parts){ let i=needs.indexOf(name); if(i>=0){needs.splice(i,1);regular++;continue;} const mapped=SUBSTITUTE_MAP[name]; i=needs.indexOf(mapped); if(i>=0){needs.splice(i,1);substitute++;} }
  const junk=parts.filter(n=>CATEGORY(n)==='junk').length;
  const completion=(regular+substitute*.65)/bp.parts.length;
  return {score:Math.max(0,Math.round(completion*900+regular*35-substitute*8-junk*18)),regular,junk,completion};
}
export function getBestGarageVehicle(garage=[]) {
  let best=null;
  for(const vehicle of garage){ const scoreData=scoreVehicle(vehicle); if(!best || scoreData.score>best.scoreData.score || (scoreData.score===best.scoreData.score && scoreData.regular>best.scoreData.regular) || (scoreData.score===best.scoreData.score && scoreData.regular===best.scoreData.regular && scoreData.junk<best.scoreData.junk)) best={vehicle,scoreData}; }
  return best;
}
export function chooseBestBlueprint(parts=[]) {
  return Object.keys(BLUEPRINTS).map(base=>({base,score:scoreVehicle({base,parts}).score})).sort((a,b)=>b.score-a.score)[0]?.base||'car';
}
export function createVehicle(parts, id, owner='player') { const base=chooseBestBlueprint(parts); const s=scoreVehicle({base,parts}); const flavor=s.completion>=.95?'完成':parts.some(n=>n==='ドーナツ')?'ドーナツ':'ガラクタ'; return {id,owner,base,parts:[...parts],name:`${flavor}${BLUEPRINTS[base].name}`}; }
export function queueRespawn(game, collectedName){ game.respawnQueue.push({remaining:ITEM_SPAWN_CONFIG.respawnDelay,collectedName}); }
export function updateRespawns(game, dt, random=Math.random) {
  if(game.paused||game.phase!=='playing') return [];
  const spawned=[];
  for(let i=game.respawnQueue.length-1;i>=0;i--){ const q=game.respawnQueue[i]; q.remaining-=dt; if(q.remaining>0) continue; if(game.items.length>=game.maxStageItems){q.remaining=.3;continue;}
    const name=chooseRespawnName(ALL_ITEM_NAMES,q.collectedName,random); const pos=findFreePosition({obstacles:game.obstacles,actors:[game.player,game.npc],items:game.items,width:WORLD.width,height:WORLD.height},random);
    const item={id:++game.nextItemId,name,...pos,spawnAge:0,collectLock:.25}; game.items.push(item); spawned.push(item); game.respawnQueue.splice(i,1);
  } return spawned;
}
function weightedNames(count, random){
  const regular=ALL_ITEM_NAMES.filter(n=>CATEGORY(n)==='regular'), subs=ALL_ITEM_NAMES.filter(n=>CATEGORY(n)==='substitute'), junk=ALL_ITEM_NAMES.filter(n=>CATEGORY(n)==='junk');
  const result=[]; const take=(pool,n)=>{for(let i=0;i<n;i++){let choices=pool.filter(x=>x!==result.at(-1));result.push(choices[Math.floor(random()*choices.length)]);}};
  take(regular,Math.round(count*.55));take(subs,Math.round(count*.25));take(junk,count-result.length); return result.sort(()=>random()-.5);
}
export function generateInitialItems(game, random=Math.random, count=ITEM_SPAWN_CONFIG.defaultInitial){
  count=Math.max(ITEM_SPAWN_CONFIG.initialMin,Math.min(ITEM_SPAWN_CONFIG.initialMax,count)); const items=[]; const names=weightedNames(count,random);
  const addNear=(actor,n)=>{const inward=actor.x<WORLD.width/2?0:Math.PI;for(let i=0;i<n;i++){const angle=inward-1.2+i*.8, radius=108+i*8; const p={x:actor.x+Math.cos(angle)*radius,y:actor.y+Math.sin(angle)*radius}; const context={obstacles:game.obstacles,actors:[game.player,game.npc],items,width:WORLD.width,height:WORLD.height,actorSafeDistance:80,itemDistance:28}; const pos=isValidItemPosition(p,context)?p:findFreePosition(context,random); items.push({id:++game.nextItemId,name:names.shift(),...pos,spawnAge:1,collectLock:0});}};
  addNear(game.player,4);addNear(game.npc,4);
  while(items.length<count){const pos=findFreePosition({obstacles:game.obstacles,actors:[game.player,game.npc],items,width:WORLD.width,height:WORLD.height,actorSafeDistance:70,itemDistance:28},random);items.push({id:++game.nextItemId,name:names.shift(),...pos,spawnAge:1,collectLock:0});}
  game.items=items;game.initialItemCount=count;game.maxStageItems=count;return items;
}
