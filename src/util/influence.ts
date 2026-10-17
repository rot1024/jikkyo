// Comment density over the timeline, used for the heat map on the seekbar.
// `offset` is the comment time correction (ms): a comment at `vpos` is shown
// at `vpos - offset` on the timeline.
export const calcInfluence = (
  comments: { vpos: number }[],
  duration: number,
  divisions: number,
  offset = 0
): number[] => {
  const influence: number[] = new Array(divisions).fill(0);
  if (duration <= 0) return influence;
  for (const c of comments) {
    const t = c.vpos - offset;
    if (t < 0 || t > duration) continue;
    influence[Math.min(divisions - 1, Math.floor((t / duration) * divisions))]++;
  }
  return influence;
};
