export const WORLD = { width: 1200, height: 720, actorRadius: 24, roundSeconds: 90 };

export const ITEM_SPAWN_CONFIG = Object.freeze({
  initialMin: 36, initialMax: 44, defaultInitial: 40, minNearPlayer: 4, minNearNpc: 4,
  minItemDistance: 28, actorSafeDistance: 100, respawnDelay: 5, maxPositionAttempts: 100,
});

export const NPC_DIFFICULTY = Object.freeze({
  easy: { label: 'EASY', caption: '初心者向け', speed: 190, thinkMin: .45, thinkMax: .75, sightRange: 420, mistakeRate: .28, targetNoise: 140, buildAt: 11, stuckTime: .75, avoidance: .55 },
  normal: { label: 'NORMAL', caption: '標準', speed: 245, thinkMin: .18, thinkMax: .35, sightRange: 680, mistakeRate: .10, targetNoise: 55, buildAt: 9, stuckTime: .60, avoidance: .78 },
  strong: { label: 'STRONG', caption: '手強い', speed: 285, thinkMin: .07, thinkMax: .16, sightRange: 1200, mistakeRate: .02, targetNoise: 12, buildAt: 7, stuckTime: .45, avoidance: .94 },
});

export const BLUEPRINTS = Object.freeze({
  car: { name: '自動車', parts: ['タイヤ','タイヤ','エンジン','座席','ハンドル','車体'] },
  bicycle: { name: '自転車', parts: ['車輪','車輪','サドル','ペダル','ハンドル','フレーム'] },
  airplane: { name: '飛行機', parts: ['機体','主翼','尾翼','操縦席','エンジン'] },
  helicopter: { name: 'ヘリコプター', parts: ['機体','メインローター','テールローター','着陸脚','操縦席','エンジン'] },
  train: { name: '電車', parts: ['車両ボディ','台車','台車','運転席','モーター','連結器'] },
});

export const SUBSTITUTE_MAP = Object.freeze({
  'ドーナツ':'タイヤ','クッキー':'車輪','フライパン':'ハンドル','ソファ':'座席','段ボール':'車体',
  '扇風機':'メインローター','スキー板':'着陸脚','竹とんぼ':'テールローター','ショッピングカート':'台車',
  'スプーン':'主翼','植木鉢':'操縦席','掃除機':'エンジン','ゲームコントローラー':'運転席','冷蔵庫':'車両ボディ',
});

export const REGULAR_ITEMS = [...new Set(Object.values(BLUEPRINTS).flatMap(v => v.parts))];
export const SUBSTITUTE_ITEMS = Object.keys(SUBSTITUTE_MAP);
export const JUNK_ITEMS = ['長靴','バケツ','枕','傘','本','ぬいぐるみ','やかん','テレビ','トイレットペーパー','サッカーボール'];
export const ALL_ITEM_NAMES = [...REGULAR_ITEMS, ...SUBSTITUTE_ITEMS, ...JUNK_ITEMS];

export const OBSTACLES = [
  {x:360,y:165,w:120,h:58},{x:720,y:130,w:150,h:62},{x:540,y:360,w:125,h:100},
  {x:185,y:470,w:130,h:60},{x:875,y:480,w:145,h:65},
];

export const CATEGORY = name => REGULAR_ITEMS.includes(name) ? 'regular' : SUBSTITUTE_ITEMS.includes(name) ? 'substitute' : 'junk';
