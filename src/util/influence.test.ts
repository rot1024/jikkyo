import { describe, it, expect } from "vitest";
import { calcInfluence } from "./influence";

const c = (...vpos: number[]) => vpos.map(v => ({ vpos: v }));

describe("calcInfluence", () => {
  it("counts comments per division of the timeline", () => {
    expect(calcInfluence(c(0, 5, 30, 99, 100), 100, 4)).toEqual([2, 1, 0, 2]);
  });

  it("ignores comments outside of the timeline", () => {
    expect(calcInfluence(c(-1, 50, 101), 100, 2)).toEqual([0, 1]);
  });

  it("shifts comments by the time correction", () => {
    // positive correction shows comments earlier
    expect(calcInfluence(c(30, 60), 100, 4, 30)).toEqual([1, 1, 0, 0]);
    // negative correction shows comments later
    expect(calcInfluence(c(0, 30), 100, 4, -30)).toEqual([0, 1, 1, 0]);
  });
});
