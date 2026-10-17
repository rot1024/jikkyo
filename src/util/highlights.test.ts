import { describe, it, expect } from "vitest";
import { detectHighlights } from "./highlights";
import { calcInfluence } from "./influence";

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

describe("detectHighlights with various surges", () => {
  // 30 minutes: slowly varying base rate and 25 surges of different shapes
  const make = () => {
    const c: { vpos: number; text: string }[] = [];
    let seed = 1;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const add = (from: number, to: number, rate: (t: number) => number) => {
      for (let t = from; t < to; t += 10) {
        if (random() < rate(t) / 100) c.push({ vpos: t, text: "a" });
      }
    };
    const duration = 30 * 60000;
    add(0, duration, t => 3 + 2 * Math.sin(t / 200000));
    for (let k = 0; k < 25; k++) {
      const s = 40000 + k * 70000;
      const kind = k % 4;
      if (kind === 0) add(s, s + 3000, () => 40); // sharp
      if (kind === 1) add(s, s + 20000, t => ((t - s) / 20000) * 30); // gradual
      if (kind === 2) add(s, s + 40000, () => 20); // long busy section
      if (kind === 3) {
        // two surges close to each other
        add(s, s + 3000, () => 30);
        add(s + 15000, s + 18000, () => 30);
      }
    }
    return { comments: c.sort((a, b) => a.vpos - b.vpos), duration };
  };

  it("has a highlight for every red section of the heat map", () => {
    const { comments, duration } = make();
    // same as the heat map: 300 divisions, red when sqrt(v / max) > 0.75
    const influence = calcInfluence(comments, duration, 300);
    const max = Math.max(...influence);
    const division = duration / 300;
    const red = influence.map(v => Math.sqrt(v / max) > 0.75);
    const sections: [number, number][] = [];
    red.forEach((r, i) => {
      if (r && (i === 0 || !red[i - 1])) sections.push([i * division, 0]);
      if (r) sections[sections.length - 1][1] = (i + 1) * division;
    });

    const highlights = detectHighlights(comments, duration);
    expect(sections.length).toBeGreaterThan(15);
    for (const [start, end] of sections) {
      expect(
        highlights.some(h => h.time >= start - 10000 && h.time <= end),
        `red section at ${start / 1000}s`
      ).toBe(true);
    }
  });

  it("does not mark a long busy section repeatedly", () => {
    const { comments, duration } = make();
    const highlights = detectHighlights(comments, duration);
    // long busy sections (kind 2) at 180-220s and 460-500s
    expect(highlights.filter(h => h.time >= 180000 && h.time < 220000)).toHaveLength(1);
    expect(highlights.filter(h => h.time >= 460000 && h.time < 500000)).toHaveLength(1);
  });
});
