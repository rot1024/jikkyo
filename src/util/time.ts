export const humanReadableTime = (t?: number) => {
  if (typeof t !== "number") {
    return "00:00:00";
  }
  const second = t / 1000;
  const s = Math.floor(second % 60);
  const m = Math.floor((second / 60) % 60);
  const h = Math.floor(second / 3600);
  return `${h >= 100 ? h : ("0" + h).slice(-2)}:${("0" + m).slice(-2)}:${(
    "0" + s
  ).slice(-2)}`;
};
