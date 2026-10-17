// Estimates the number of rows from the comment density when comments are loaded.
// The goal is not to avoid overlapping completely but to keep comments from
// becoming too small when there are not many comments.

export interface CommentDensity {
  // number of scrolling comments on the screen at a busy (not the busiest) time
  concurrency: number;
  // typical width of a comment in em
  emWidth: number;
}

// percentile of the number of comments on the screen over time used as the "peak".
// Short bursts above this are allowed to overlap.
const peakPercentile = 0.9;
const sampleInterval = 1000;

// half-width characters are about half as wide as full-width ones
const charWidth = (code: number) => (code < 0x2e80 ? 0.55 : 1);

const textEmWidth = (text: string, size?: "big" | "small") => {
  let max = 0;
  for (const line of text.split("\n")) {
    let w = 0;
    for (const ch of line) w += charWidth(ch.codePointAt(0) ?? 0);
    max = Math.max(max, w);
  }
  return max * (size === "big" ? 1.5 : size === "small" ? 0.5 : 1);
};

// `comments` must be sorted by vpos. `duration` is the display duration (ms).
export const getCommentDensity = (
  comments: { vpos: number; text: string; pos?: string; size?: "big" | "small" }[],
  duration: number
): CommentDensity => {
  // ue/shita comments do not scroll and take their own rows
  const naka = comments.filter(c => !c.pos);
  if (naka.length === 0 || duration <= 0) return { concurrency: 0, emWidth: 0 };

  const samples: number[] = [];
  const end = naka[naka.length - 1].vpos + duration;
  let head = 0;
  let tail = 0;
  for (let t = naka[0].vpos; t < end; t += sampleInterval) {
    while (head < naka.length && naka[head].vpos <= t) head++;
    while (tail < head && naka[tail].vpos <= t - duration) tail++;
    samples.push(head - tail);
  }
  samples.sort((a, b) => a - b);
  const concurrency =
    samples[Math.min(samples.length - 1, Math.floor(samples.length * peakPercentile))];

  const widths = naka.map(c => textEmWidth(c.text, c.size)).sort((a, b) => a - b);
  const emWidth = widths[Math.floor(widths.length / 2)];

  return { concurrency, emWidth };
};

// A row can show about W / w comments in sequence while each scrolls across the
// screen, where w = emWidth * fontSize and fontSize = H / rows / lineHeight.
// Solving rows = concurrency * (w / W) / (1 + w / W) for rows gives the result.
export const estimateRows = (
  { concurrency, emWidth }: CommentDensity,
  width: number,
  height: number,
  lineHeight: number,
  minRows: number,
  maxRows: number
) => {
  const max = Math.max(minRows, maxRows);
  if (concurrency === 0 || emWidth === 0 || width === 0 || height === 0) {
    return minRows;
  }
  const a = (emWidth * height) / (lineHeight * width);
  const rows = (-a + Math.sqrt(a * a + 4 * concurrency * a)) / 2;
  return Math.min(max, Math.max(minRows, Math.round(rows)));
};
