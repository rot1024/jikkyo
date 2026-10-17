import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import Canvas2DRenderer from "./canvas2d";
import { Chat, getChatActualStyle } from "./util";

const chat = (id: number, vpos: number): Chat => ({
  id,
  text: `c${id}`,
  vpos,
  commenter: "",
  y: 0,
  width: 50,
  height: 20,
  duration: 5000,
  danmaku: false,
  ueshita: false,
  speed: 1,
  fontSize: 14
});

const styles = getChatActualStyle({}, 500);
const chats = Array.from({ length: 100 }, (_, i) => chat(i, i * 1000));

describe("Canvas2DRenderer", () => {
  let drawImage: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    drawImage = vi.fn();
    const ctx = HTMLCanvasElement.prototype.getContext("2d");
    Object.assign(ctx as object, { drawImage, strokeText: vi.fn() });
  });

  it("draws the comments at the time after seeking backward", () => {
    const { rerender } = render(
      <Canvas2DRenderer chats={chats} getFrame={() => 80500} styles={styles} />
    );
    expect(drawImage).toHaveBeenCalledTimes(5); // vpos 76000..80000
    drawImage.mockClear();
    rerender(
      <Canvas2DRenderer chats={chats} getFrame={() => 10500} styles={styles} />
    );
    expect(drawImage).toHaveBeenCalledTimes(5); // vpos 6000..10000
  });

  it("limits and filters comments", () => {
    const hidden = chats.map(c => (c.id % 2 ? { ...c, hidden: true } : c));
    render(
      <Canvas2DRenderer
        chats={hidden}
        getFrame={() => 80500}
        styles={styles}
        visibleCommentCount={2}
      />
    );
    expect(drawImage).toHaveBeenCalledTimes(2);
  });
});
