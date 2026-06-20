import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ALL_ITEM_NAMES, BLUEPRINTS, ITEM_SPAWN_CONFIG, NPC_DIFFICULTY, OBSTACLES, WORLD } from './data.js';
import { chooseRespawnName, createVehicle, generateInitialItems, getBestGarageVehicle, isValidItemPosition, normalizeDifficulty, queueRespawn, scoreVehicle, updateRespawns } from './logic.js';

const actor=(x,y)=>({x,y,inventory:[],garage:[],buildCooldown:0});
function gameFixture(){return {phase:'playing',paused:false,items:[],obstacles:OBSTACLES.map(x=>({...x})),player:actor(100,360),npc:actor(1100,360),respawnQueue:[],nextItemId:0,maxStageItems:40};}
const zero=()=>0;

test('難易度の初期値と段階差',()=>{
  assert.equal(normalizeDifficulty(null),'normal');
  assert.ok(NPC_DIFFICULTY.easy.speed<NPC_DIFFICULTY.normal.speed&&NPC_DIFFICULTY.normal.speed<NPC_DIFFICULTY.strong.speed);
  assert.ok(NPC_DIFFICULTY.easy.thinkMin>NPC_DIFFICULTY.normal.thinkMin&&NPC_DIFFICULTY.normal.thinkMin>NPC_DIFFICULTY.strong.thinkMin);
});

test('再出現名は原則として回収名と異なる',()=>{
  assert.notEqual(chooseRespawnName(ALL_ITEM_NAMES,'タイヤ',zero),'タイヤ');
  assert.equal(chooseRespawnName(['タイヤ'],'タイヤ',zero),'タイヤ');
});

test('空garageは未生成、生成後は最高得点を保持する',()=>{
  assert.equal(getBestGarageVehicle([]),null);
  const good=createVehicle(BLUEPRINTS.car.parts,1),bad=createVehicle(['長靴','枕'],2);
  const best=getBestGarageVehicle([good]);assert.equal(best.vehicle.id,1);assert.ok(best.scoreData.score>0);
  assert.equal(getBestGarageVehicle([good,bad]).vehicle.id,1);
});

test('車両は自身のbase設計図で採点される',()=>{
  const plane={id:1,base:'airplane',parts:[...BLUEPRINTS.airplane.parts]};
  assert.equal(scoreVehicle(plane).completion,1);
});

test('回収予約は5秒後だけ一意IDの別アイテムとして出現する',()=>{
  const g=gameFixture();queueRespawn(g,'タイヤ');assert.equal(g.respawnQueue.length,1);
  updateRespawns(g,4.99,zero);assert.equal(g.items.length,0);
  updateRespawns(g,.01,zero);assert.equal(g.items.length,1);assert.notEqual(g.items[0].name,'タイヤ');assert.ok(g.items[0].id>0);assert.equal(g.respawnQueue.length,0);
  assert.ok(isValidItemPosition(g.items[0],{obstacles:g.obstacles,actors:[g.player,g.npc],items:[],width:WORLD.width,height:WORLD.height}));
});

test('一時停止中は再出現カウントが停止する',()=>{
  const g=gameFixture();queueRespawn(g,'タイヤ');g.paused=true;updateRespawns(g,4,zero);assert.equal(g.respawnQueue[0].remaining,5);
});

test('上限時は予約を保持して再判定する',()=>{
  const g=gameFixture();g.maxStageItems=1;g.items=[{id:1,name:'本',x:500,y:500}];queueRespawn(g,'タイヤ');updateRespawns(g,5,zero);assert.equal(g.items.length,1);assert.equal(g.respawnQueue.length,1);assert.equal(g.respawnQueue[0].remaining,.3);
});

test('初期配置は40個、安全で開始地点付近に各4個以上',()=>{
  const g=gameFixture();const items=generateInitialItems(g,()=>.37);assert.equal(items.length,40);assert.ok(items.length>=ITEM_SPAWN_CONFIG.initialMin&&items.length<=ITEM_SPAWN_CONFIG.initialMax);
  assert.ok(items.filter(i=>Math.hypot(i.x-g.player.x,i.y-g.player.y)<=155).length>=4);
  assert.ok(items.filter(i=>Math.hypot(i.x-g.npc.x,i.y-g.npc.y)<=155).length>=4);
  for(const [index,item] of items.entries()){
    assert.ok(isValidItemPosition(item,{obstacles:g.obstacles,actors:[],items:items.slice(0,index),width:WORLD.width,height:WORLD.height,actorSafeDistance:0,itemDistance:27.9}));
  }
});

test('プレイヤーとNPCの生成クールダウンは独立データ',()=>{
  const g=gameFixture();g.player.buildCooldown=3;g.npc.buildCooldown=1;g.npc.buildCooldown=0;assert.equal(g.player.buildCooldown,3);
});

test('UIに難易度選択、車両ID選択、専用描画があり強力吸引はない',async()=>{
  const source=await readFile(new URL('./main.js',import.meta.url),'utf8');
  for(const key of ['easy','normal','strong'])assert.match(source,new RegExp(`data-value=\\"\\$\\{key\\}`));
  assert.match(source,/localStorage\.setItem\('grbDifficulty'/);assert.match(source,/data-id="\$\{v\.id\}"/);assert.match(source,/state\.selectedVehicleId=Number/);
  for(const fn of ['drawTire','drawEngine','drawSeat','drawWing','drawFan','drawFridge','drawItemLabel','drawUnknownItem'])assert.match(source,new RegExp(`function ${fn}`));
  assert.doesNotMatch(source,/強力吸引|powerSuction|PowerSuction/);
});
