export const tasbihAdhkar = [
  "سبحان الله",
  "الحمد لله",
  "الله أكبر",
  "لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير",
];
export function tasbihProgress(value: number) {
  const total = Math.min(100, Math.max(0, Math.floor(value) || 0));
  const stage = Math.min(3, Math.floor(total / 33));
  return { total, stage, count: total, target: 100, stageCount: total - stage * 33, stageTarget: stage === 3 ? 1 : 33, dhikr: tasbihAdhkar[stage], complete: total === 100 };
}
