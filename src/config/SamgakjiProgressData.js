export const SAMGAKJI_PROGRESS_LEVELS = [
  { level: 1, name: "잠든 삼각지", requiredCleaned: 0 },
  { level: 2, name: "잠든 삼각지", requiredCleaned: 50 },
  { level: 3, name: "새싹 돋는 삼각지", requiredCleaned: 120 },
  { level: 4, name: "새싹 돋는 삼각지", requiredCleaned: 220 },
  { level: 5, name: "꽃피는 삼각지", requiredCleaned: 350 },
  { level: 6, name: "꽃피는 삼각지", requiredCleaned: 520 },
  { level: 7, name: "향기로운 삼각지", requiredCleaned: 700 },
  { level: 8, name: "향기로운 삼각지", requiredCleaned: 950 },
  { level: 9, name: "빛나는 삼각지", requiredCleaned: 1200 },
  { level: 10, name: "빛나는 삼각지", requiredCleaned: 1500 },
  { level: 11, name: "쉬어가는 삼각지", requiredCleaned: 1800 },
  { level: 12, name: "쉬어가는 삼각지", requiredCleaned: 2200 },
  { level: 13, name: "사람들이 찾는 삼각지", requiredCleaned: 2600 },
  { level: 14, name: "사람들이 찾는 삼각지", requiredCleaned: 3100 },
  { level: 15, name: "사랑받는 삼각지", requiredCleaned: 3700 },
  { level: 16, name: "사랑받는 삼각지", requiredCleaned: 4500 },
];

export const DEFAULT_SAMGAKJI_PROGRESS_STATE = {
  currentLevel: 1,
  lastAnnouncedLevel: 1,
  unlockedLevels: [1],
};

export function getSamgakjiLevelInfo(totalCleanedCount = 0) {
  const cleaned = Math.max(0, Number(totalCleanedCount) || 0);
  const current = [...SAMGAKJI_PROGRESS_LEVELS]
    .reverse()
    .find((entry) => cleaned >= entry.requiredCleaned) || SAMGAKJI_PROGRESS_LEVELS[0];
  const currentIndex = SAMGAKJI_PROGRESS_LEVELS.findIndex((entry) => entry.level === current.level);
  const next = SAMGAKJI_PROGRESS_LEVELS[currentIndex + 1] || null;
  const currentRequired = current.requiredCleaned;
  const nextRequired = next?.requiredCleaned ?? current.requiredCleaned;
  const span = Math.max(1, nextRequired - currentRequired);
  const progressToNext = next ? Math.min(span, cleaned - currentRequired) : span;

  return {
    cleaned,
    current,
    next,
    level: current.level,
    name: current.name,
    isMaxLevel: !next,
    currentRequired,
    nextRequired,
    progressToNext,
    progressRatio: next ? Math.max(0, Math.min(1, progressToNext / span)) : 1,
  };
}

export function getSamgakjiLevelNameByLevel(level = 1) {
  const safeLevel = Math.max(1, Number(level) || 1);
  return SAMGAKJI_PROGRESS_LEVELS.find((entry) => entry.level === safeLevel)?.name
    || SAMGAKJI_PROGRESS_LEVELS[0].name;
}

export function normalizeSamgakjiProgressState(value = {}, totalCleanedCount = 0) {
  const safeValue = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const levelInfo = getSamgakjiLevelInfo(totalCleanedCount);
  const loadedLevels = Array.isArray(safeValue.unlockedLevels) ? safeValue.unlockedLevels : [];
  const unlockedLevels = [...new Set([
    ...DEFAULT_SAMGAKJI_PROGRESS_STATE.unlockedLevels,
    ...loadedLevels.map((level) => Number(level)).filter((level) => Number.isFinite(level) && level >= 1),
  ])].filter((level) => level <= levelInfo.level);

  for (let level = 1; level <= levelInfo.level; level += 1) {
    if (!unlockedLevels.includes(level)) unlockedLevels.push(level);
  }

  return {
    ...DEFAULT_SAMGAKJI_PROGRESS_STATE,
    ...safeValue,
    currentLevel: levelInfo.level,
    lastAnnouncedLevel: Math.max(
      1,
      Math.min(Number(safeValue.lastAnnouncedLevel) || DEFAULT_SAMGAKJI_PROGRESS_STATE.lastAnnouncedLevel, levelInfo.level),
    ),
    unlockedLevels: unlockedLevels.sort((a, b) => a - b),
  };
}
