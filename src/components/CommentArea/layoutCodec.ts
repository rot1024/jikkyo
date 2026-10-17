import { Chat, Comment } from "./util";

// Layout results are transferred from the worker as a Float64Array
// instead of cloning thousands of objects.
const fields = 7;

export const encodeLayout = (chats: Chat[]) => {
  const data = new Float64Array(chats.length * fields);
  chats.forEach((c, i) => {
    const o = i * fields;
    data[o] = c.y;
    data[o + 1] = c.width;
    data[o + 2] = c.height;
    data[o + 3] = c.duration;
    data[o + 4] = c.speed;
    data[o + 5] = c.fontSize;
    data[o + 6] = (c.danmaku ? 1 : 0) | (c.ueshita ? 2 : 0);
  });
  return data;
};

// `comments` must be the same array (in the same order) used for the layout
export const decodeLayout = (comments: Comment[], data: Float64Array): Chat[] =>
  comments.map((c, i) => {
    const o = i * fields;
    return {
      ...c,
      y: data[o],
      width: data[o + 1],
      height: data[o + 2],
      duration: data[o + 3],
      speed: data[o + 4],
      fontSize: data[o + 5],
      danmaku: (data[o + 6] & 1) !== 0,
      ueshita: (data[o + 6] & 2) !== 0
    };
  });
