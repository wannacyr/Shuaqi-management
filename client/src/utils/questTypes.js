export const QUEST_TYPES = ['游戏', '短视频', '运动', '零食', '追剧', '电影', '购物', '徒步', '其他'];

export const TYPE_ICONS = {
  '游戏': 'gamepad-2',
  '短视频': 'video',
  '运动': 'dumbbell',
  '零食': 'coffee',
  '追剧': 'tv',
  '电影': 'film',
  '购物': 'shopping-bag',
  '徒步': 'footprints',
  '其他': 'sparkles',
};

export function iconForType(type) {
  return TYPE_ICONS[type] || 'sparkles';
}
