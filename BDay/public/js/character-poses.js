export const ATLAS = { columns: 3, rows: 4, tileWidth: 256, tileHeight: 320 };
export const EXPRESSIONS = {
  laughing: 0,
  teary: 1,
  unimpressed: 2,
  frustrated: 3,
  thinking: 4,
  sleepy: 5,
  waving: 6,
  surprised: 7,
  shy: 8,
  pouting: 9,
  blushing: 10,
  excited: 11,
};
export const MOOD_EXPRESSIONS = {
  idle: 'waving',
  loading: 'thinking',
  curious: 'surprised',
  navigating: 'excited',
  success: 'laughing',
  error: 'teary',
  shy: 'sleepy',
  highfive: 'laughing',
  delighted: 'blushing',
  playful: 'pouting',
  affection: 'shy',
};
export function characterPose(mood) {
  const name = MOOD_EXPRESSIONS[mood] || MOOD_EXPRESSIONS.idle;
  const index = EXPRESSIONS[name];
  return {
    name,
    index,
    column: index % ATLAS.columns,
    row: Math.floor(index / ATLAS.columns),
    backgroundPosition:
      (index % ATLAS.columns) * 50 +
      '% ' +
      Math.floor(index / ATLAS.columns) * (100 / 3) +
      '%',
  };
}
