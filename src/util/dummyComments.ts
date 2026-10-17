import { Comment, calcInfluence } from "./commentLoader";

// Generates dummy comments for testing and benchmarking.
// Enabled by the hidden URL parameter `?dummy` (see App.tsx).

export interface DummyOptions {
  // comments per second in normal sections
  rate?: number;
  // total duration (ms)
  duration?: number;
  // a burst (danmaku) section occurs every `burstInterval` ms
  burstInterval?: number;
  burstDuration?: number;
  burstRate?: number;
  seed?: number;
}

const texts = [
  "ｗｗｗ",
  "草",
  "8888888",
  "かわいい",
  "きたーーーー！！",
  "これは神回",
  "ここすき",
  "wwwwwwwwwwwwwwwwwwww",
  "おつかれさまでした",
  "今のもう一回見たい",
  "えっ",
  "うおおおおおおおおおおおおおおおおおお",
  "🎉🎉🎉",
  "絶対このあと何か起きるやつだこれ知ってる",
  "↑わかる",
  "初見です",
  "BGMいいね",
  "１げと"
];
const multilineTexts = ["　∧＿∧\n（　´∀｀）\n（　　　）", "上\n下"];
const colors = ["#f00", "#ff0", "#0f0", "#0ff", "#ffc000", "#ff8080"];

// deterministic PRNG so that benchmark results are comparable
const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export const generateDummyComments = ({
  rate = 20,
  duration = 10 * 60 * 1000,
  burstInterval = 60 * 1000,
  burstDuration = 3000,
  burstRate = 300,
  seed = 1
}: DummyOptions = {}) => {
  const random = mulberry32(seed);
  const pick = <T>(a: T[]) => a[Math.floor(random() * a.length)];
  const comments: Comment[] = [];

  let t = 0;
  while (t < duration) {
    const inBurst = burstInterval > 0 && t % burstInterval < burstDuration;
    const r = inBurst ? burstRate : rate;
    // exponential inter-arrival time (Poisson process)
    t += (-Math.log(1 - random()) / r) * 1000;
    if (t >= duration) break;

    const p = random();
    const commenter = `user${Math.floor(random() * 1000)}`;
    comments.push({
      id: comments.length,
      text: p < 0.01 ? pick(multilineTexts) : pick(texts),
      date: new Date(0),
      vpos: Math.floor(t),
      commenter,
      pos: p < 0.05 ? "ue" : p < 0.1 ? "shita" : undefined,
      size: p > 0.95 ? "big" : p > 0.9 ? "small" : undefined,
      color: random() < 0.1 ? pick(colors) : undefined,
      color2: `hsl(${Math.floor(random() * 360)}, 80%, 70%)`,
      hash: 0
    });
  }

  return {
    comments,
    duration,
    influence: calcInfluence(comments, duration, 100)
  };
};

// Parses `?dummy`, `?dummy=50` (rate) and optional `burst=300`, `minutes=10`, `seed=1`
export const parseDummyOptions = (search: string): DummyOptions | undefined => {
  const params = new URLSearchParams(search);
  if (!params.has("dummy")) return undefined;
  const num = (k: string) => {
    const v = parseFloat(params.get(k) || "");
    return isNaN(v) ? undefined : v;
  };
  const minutes = num("minutes");
  return {
    rate: num("dummy"),
    burstRate: num("burst"),
    duration: minutes === undefined ? undefined : minutes * 60 * 1000,
    seed: num("seed")
  };
};
