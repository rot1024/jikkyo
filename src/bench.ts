// Dev-only benchmark for comment layout and rendering (see bench.html)
import { commentsToChats, getChatActualStyle } from "./components/CommentArea/util";
import { ChatRenderer } from "./components/CommentArea/chatRenderer";
import { generateDummyComments } from "./util/dummyComments";

const width = 1280;
const height = 720;

const stats = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const q = (p: number) => s[Math.min(s.length - 1, Math.floor(s.length * p))];
  const round = (n: number) => Math.round(n * 100) / 100;
  return {
    mean: round(xs.reduce((a, b) => a + b, 0) / xs.length),
    p95: round(q(0.95)),
    max: round(s[s.length - 1])
  };
};

const runBench = async ({ dpr = 1, frames = 300 } = {}) => {
  const { comments } = generateDummyComments();
  const styles = getChatActualStyle({}, height);

  // layout
  const layoutTimes: number[] = [];
  const t0 = performance.now();
  let chats = commentsToChats(comments, width, height, styles);
  const layoutFirst = Math.round(performance.now() - t0);
  for (let i = 0; i < 3; i++) {
    const t = performance.now();
    chats = commentsToChats(comments, width, height, styles);
    layoutTimes.push(performance.now() - t);
  }

  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext("2d")!;

  // plays `frames` frames from `start` (ms) of comment time in a real
  // requestAnimationFrame loop. `draw` is the CPU time of drawing and
  // `interval` is the time between frames (includes GPU and compositing)
  const render = (start: number) =>
    new Promise<object>(resolve => {
      const renderer = new ChatRenderer();
      const draws: number[] = [];
      const intervals: number[] = [];
      let prev = 0;
      let i = 0;
      const loop = (now: number) => {
        if (prev) intervals.push(now - prev);
        prev = now;
        const t = performance.now();
        renderer.draw(ctx, start + (i * 1000) / 60, {
          chats,
          styles,
          width,
          height,
          dpr,
          opacity: 1,
          opacityDanmaku: 0.8,
          visibleCommentCount: Infinity
        });
        draws.push(performance.now() - t);
        if (++i < frames) {
          requestAnimationFrame(loop);
        } else {
          resolve({
            draw: stats(draws),
            interval: stats(intervals),
            dropped: intervals.filter(d => d > 1000 / 60 * 1.5).length
          });
        }
      };
      requestAnimationFrame(loop);
    });

  const result = {
    comments: comments.length,
    layoutFirst,
    layout: stats(layoutTimes),
    // the first 3 seconds of each minute is a burst (300 comments/s)
    burst: await render(60000),
    normal: await render(20000)
  };
  document.getElementById("result")!.textContent = JSON.stringify(result, null, 2);
  return result;
};

Object.assign(window, { runBench });
