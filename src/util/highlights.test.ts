import { describe, it, expect } from "vitest";
import { detectHighlights } from "./highlights";

// `rate` comments per second in [from, to) seconds
const steady = (rate: number, from: number, to: number, text = "a") =>
  Array.from({ length: (to - from) * rate }, (_, i) => ({
    vpos: from * 1000 + Math.floor((i * 1000) / rate),
    text
  }));

const sorted = <T extends { vpos: number }>(a: T[]) =>
  a.sort((x, y) => x.vpos - y.vpos);

describe("detectHighlights", () => {
  it("finds sudden surges and jumps a little before them", () => {
    const comments = sorted([
      ...steady(2, 0, 600),
      ...steady(30, 120, 123, "ｗｗｗ"),
      ...steady(30, 400, 403, "8888888")
    ]);
    const h = detectHighlights(comments, 600000);
    expect(h.map(x => x.time)).toEqual([119000, 399000].map(t => expect.closeTo(t, -4)));
    expect(h[0].jumpTime).toBe(h[0].time - 3000);
    expect(h[0].texts[0]).toBe("ｗｗｗ");
    expect(h[1].texts[0]).toBe("8888888");
  });

  it("ignores sections that are busy all the time", () => {
    const comments = sorted([...steady(1, 0, 300), ...steady(20, 300, 600)]);
    // only the start of the busy section is a surge
    const h = detectHighlights(comments, 600000);
    expect(h).toHaveLength(1);
    expect(h[0].time).toBeGreaterThan(290000);
    expect(h[0].time).toBeLessThanOrEqual(300000);
  });

  it("groups variants of the same comment", () => {
    const comments = sorted([
      ...steady(1, 0, 200),
      ...steady(10, 100, 103, "ｗｗｗ"),
      ...steady(10, 100, 103, "wwwwwww"),
      ...steady(5, 100, 103, "草")
    ]);
    const [h] = detectHighlights(comments, 200000);
    expect(h.texts).toEqual(["ｗｗｗ", "草"]);
  });

  it("follows the time correction", () => {
    const comments = sorted([...steady(2, 0, 600), ...steady(30, 120, 123)]);
    const [h] = detectHighlights(comments, 600000, -10000);
    expect(h.time).toBeGreaterThan(125000);
  });
});
