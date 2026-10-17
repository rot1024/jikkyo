import { describe, it, expect } from "vitest";
import { getCommentDensity, estimateRows } from "./autoRows";

// `rate` comments per second for `seconds` seconds
const comments = (rate: number, seconds: number, text = "あいうえおかきく") =>
  Array.from({ length: rate * seconds }, (_, i) => ({
    vpos: Math.floor((i * 1000) / rate),
    text
  }));

describe("getCommentDensity", () => {
  it("measures the number of comments on the screen", () => {
    const d = getCommentDensity(comments(10, 60), 5000);
    expect(d.concurrency).toBe(50);
    expect(d.emWidth).toBe(8);
  });

  it("ignores short bursts above the percentile", () => {
    const normal = comments(10, 100);
    const burst = Array.from({ length: 1000 }, (_, i) => ({ vpos: 50000 + i, text: "w" }));
    const d = getCommentDensity(
      [...normal, ...burst].sort((a, b) => a.vpos - b.vpos),
      5000
    );
    expect(d.concurrency).toBeLessThan(100);
  });

  it("ignores ue/shita comments and counts half-width characters as narrower", () => {
    const d = getCommentDensity(
      [
        { vpos: 0, text: "wwww" },
        { vpos: 0, text: "うえうえうえうえ", pos: "ue" }
      ],
      5000
    );
    expect(d.emWidth).toBeCloseTo(2.2);
  });
});

describe("estimateRows", () => {
  const rows = (concurrency: number) =>
    estimateRows({ concurrency, emWidth: 8 }, 1280, 720, 1.4, 10, 20);

  it("uses fewer rows (larger text) for fewer comments", () => {
    expect(rows(10)).toBe(10);
    expect(rows(80)).toBeGreaterThan(10);
    expect(rows(80)).toBeLessThan(20);
    expect(rows(1000)).toBe(20);
  });

  it("increases monotonically with density", () => {
    let prev = 0;
    for (const c of [0, 20, 50, 100, 200, 400]) {
      const r = rows(c);
      expect(r).toBeGreaterThanOrEqual(prev);
      prev = r;
    }
  });
});
