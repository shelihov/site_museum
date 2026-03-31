// Агрегация данных экспонатов по залам (источники лежат в data/hall*.exhibits.js)
const EXHIBITS = [
  ...(window.HALL1_EXHIBITS || []),
  ...(window.HALL2_EXHIBITS || []),
  ...(window.HALL3_EXHIBITS || []),
  ...(window.HALL4_EXHIBITS || []),
  ...(window.HALL5_EXHIBITS || []),
];
