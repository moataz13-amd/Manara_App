import { describe, it, expect } from "vitest";
import { tasbihProgress } from "./tasbih";
describe("Tasbih sequence", () => {
  it("changes dhikr at 33 and 66, then offers the hundredth dhikr at 99", () => {
    for (const [total, stage, count, target] of [[0,0,0,33],[32,0,32,33],[33,1,0,33],[65,1,32,33],[66,2,0,33],[98,2,32,33],[99,3,0,1],[100,3,1,1]]) {
      expect(tasbihProgress(total)).toMatchObject({ total, stage, count: total, target: 100, stageCount: count, stageTarget: target, complete: total === 100 });
    }
  });
  it("keeps the displayed counter continuous throughout the full round", () => {
    for (let count = 0; count <= 100; count++) {
      expect(tasbihProgress(count).count).toBe(count);
      expect(tasbihProgress(count).target).toBe(100);
    }
  });
  it("caps persisted counts at 100 and resets to the first dhikr", () => {
    expect(tasbihProgress(142)).toMatchObject({ total: 100, complete: true });
    expect(tasbihProgress(0)).toMatchObject({ dhikr: "سبحان الله", count: 0, complete: false });
  });
});
