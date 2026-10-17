import { describe, it, expect } from "vitest";
import { readComments } from "./commentLoader";

describe("readComments", () => {
  it("keeps comments sorted by vpos after adding random spread", async () => {
    // vpos in seconds (multiples of 100) gives a large random spread
    const chats = Array.from(
      { length: 500 },
      (_, i) => `<chat vpos="${Math.floor(i / 10) * 100}">c${i}</chat>`
    ).join("");
    const { comments } = await readComments(`<packet>${chats}</packet>`);
    expect(comments).toHaveLength(500);
    for (let i = 1; i < comments.length; i++) {
      expect(comments[i].vpos).toBeGreaterThanOrEqual(comments[i - 1].vpos);
    }
  });
});
