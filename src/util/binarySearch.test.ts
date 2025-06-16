import { describe, it, expect } from "vitest";
import binarySearch from "./binarySearch";

const b = (d: number[], s: number) => binarySearch(d, s, dd => dd);

describe("binarySearch", () => {
  it("returns expected results", () => {
    expect(b([], 1)).toBe(0);
    expect(b([1], 2)).toBe(1);
    expect(b([0, 1], -1)).toBe(0);
    expect(b([0, 1, 2, 3, 4], 3)).toBe(4);
    expect(b([0, 1, 2, 5, 7], 3)).toBe(3);
  });
});
