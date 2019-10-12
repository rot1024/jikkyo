const binarySearch = <T>(data: T[], s: number, c: (d: T) => number) => {
  if (isNaN(s)) return NaN;
  if (data.length === 0) return 0;
  if (c(data[data.length - 1]) <= s) return data.length;

  const search = (start: number, end: number): number => {
    const center = Math.floor((start + end) / 2);
    const d = c(data[center]);
    if (d === s) {
      return center === data.length - 1
        ? data.length
        : search(center + 1, center + 1);
    } else if (d < s) {
      start = center + 1;
    } else if (s < d) {
      end = center - 1;
    }
    return start > end ? start : search(start, end);
  };

  return search(0, data.length - 1);
};

export default binarySearch;
