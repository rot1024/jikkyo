// Detects moments where comments suddenly increase.

export interface Highlight {
  // start of the surge on the timeline (ms)
  time: number;
  // where to jump: a little before the surge so that the cause is not missed
  jumpTime: number;
  // comments in the surge window
  count: number;
  // ratio of the comment rate to the rate just before
  ratio: number;
  // the most frequent comments in the surge
  texts: string[];
}

const bin = 1000;
// comments are counted in this window to find surges
const windowSize = 5000;
// the rate just before is measured over this period
const baselineSize = 60000;
const lead = 3000;
const minSeparation = 30000;
const maxHighlights = 15;
// minimum surprise (Poisson z-score) and comments to be a highlight
const minScore = 4;
const minCount = 5;

const median = (a: number[], from: number, to: number) => {
  if (to <= from) return 0;
  const s = a.slice(from, to).sort((x, y) => x - y);
  return s[Math.floor(s.length / 2)];
};

// The first bin in the window where comments clearly increase, as the window
// may start a little before the surge
const onset = (counts: number[], start: number, size: number, rate: number) => {
  const threshold = rate + 2 * Math.sqrt(rate) + 1;
  for (let j = start; j < start + size; j++) {
    if (counts[j] > threshold) return j;
  }
  return start;
};

// Groups variants such as "ｗｗｗ" / "www" and "8888" / "88888888"
const normalize = (text: string) =>
  text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/(.)\1+/gu, "$1")
    .trim();

const topTexts = (texts: string[], n: number) => {
  const groups = new Map<string, { text: string; count: number }>();
  for (const t of texts) {
    const key = normalize(t);
    if (!key) continue;
    const g = groups.get(key);
    if (g) g.count++;
    else groups.set(key, { text: t, count: 1 });
  }
  return [...groups.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, n)
    .map(g => g.text);
};

// `offset` is the comment time correction (ms): a comment at `vpos` is shown
// at `vpos - offset` on the timeline.
export const detectHighlights = (
  comments: { vpos: number; text: string }[],
  duration: number,
  offset = 0
): Highlight[] => {
  const bins = Math.ceil(duration / bin);
  if (bins <= 0 || comments.length === 0) return [];

  const counts = new Array<number>(bins).fill(0);
  for (const c of comments) {
    const t = c.vpos - offset;
    if (t < 0 || t >= duration) continue;
    counts[Math.floor(t / bin)]++;
  }
  // prefix sums for window counts
  const sums = new Array<number>(bins + 1).fill(0);
  for (let i = 0; i < bins; i++) sums[i + 1] = sums[i] + counts[i];
  const sum = (from: number, to: number) =>
    sums[Math.min(bins, Math.max(0, to))] - sums[Math.min(bins, Math.max(0, from))];

  const w = windowSize / bin;
  const b = baselineSize / bin;
  // the usual rate is at least this, so that the start of comments or
  // a quiet period is not treated as a surge
  const minRate = (sums[bins] / bins) * 0.5;
  const candidates: { index: number; score: number; count: number; ratio: number }[] = [];
  for (let i = 0; i + w <= bins; i++) {
    const count = sum(i, i + w);
    if (count < minCount) continue;
    // the median is used so that a surge does not raise the baseline right after it
    // and a section that keeps busy is not detected repeatedly
    const rate = Math.max(minRate, median(counts, Math.max(0, i - b), i));
    const expected = rate * w;
    // Poisson z-score: how unlikely the count is given the rate just before
    const score = (count - expected) / Math.sqrt(expected + 1);
    if (score < minScore) continue;
    candidates.push({
      index: onset(counts, i, w, rate),
      score,
      count,
      ratio: count / Math.max(expected, 1)
    });
  }

  // pick the most surprising ones apart from each other
  candidates.sort((x, y) => y.score - x.score);
  const picked: typeof candidates = [];
  for (const c of candidates) {
    if (picked.length >= maxHighlights) break;
    if (picked.some(p => Math.abs(p.index - c.index) * bin < minSeparation)) continue;
    picked.push(c);
  }

  return picked
    .sort((x, y) => x.index - y.index)
    .map(p => {
      const time = p.index * bin;
      const texts = comments
        .filter(c => {
          const t = c.vpos - offset;
          return t >= time && t < time + windowSize;
        })
        .map(c => c.text);
      return {
        time,
        jumpTime: Math.max(0, time - lead),
        count: p.count,
        ratio: p.ratio,
        texts: topTexts(texts, 2)
      };
    });
};
