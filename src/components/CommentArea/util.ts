import binarySearch from "../../util/binarySearch";

export interface Comment {
  id: string;
  text: string;
  vpos: number; // ms
  commenter: string;
  pos?: "ue" | "shita";
  size?: "big" | "small";
  color?: string;
}

export interface Chat extends Comment {
  y: number;
  height: number;
  duration: number;
  fontSize: number;
  danmaku: boolean;
  ueshita: boolean;
}

export const getVisibleChats = (
  chats: Chat[],
  frame: number,
  duration: number
) => {
  if (chats.length === 0) return [];
  const start = binarySearch(chats, frame - duration, c => c.vpos);
  const end = binarySearch(chats, frame, c => c.vpos);
  return chats.slice(start, end);
};

export const commentsToChats = (
  comments: Comment[],
  duration: number,
  ueshitaDuration: number,
  screenHeight: number,
  fontSize: number
): Chat[] => {
  const chats: Chat[] = [];

  type ChatLine = { y: number; h: number; end: number };
  let naka: ChatLine[] = [];
  let ue: ChatLine[] = [];
  let shita: ChatLine[] = [];

  for (const c of comments) {
    const dur =
      c.pos === "ue" || c.pos === "shita" ? ueshitaDuration : duration;
    const fs =
      c.size === "big"
        ? fontSize * 1.5
        : c.size === "small"
        ? fontSize * 0.5
        : fontSize;
    const height = c.text.split("\n").length * fontSize;
    const ueshita = c.pos === "ue" || c.pos === "shita";

    let lines = c.pos === "ue" ? ue : c.pos === "shita" ? shita : naka;

    // advance time
    lines = lines
      .filter(l => l.end > c.vpos)
      .map(l => ({ ...l, end: l.end - c.vpos }));

    // find gap
    let y = 0;
    const ok =
      lines.length === 0 ||
      lines.some(l => {
        if (y + height <= l.y) {
          return true;
        }
        y = l.y + l.h;
        return false;
      });

    const chat: Chat = {
      ...c,
      y,
      height,
      fontSize: fs,
      duration: dur,
      danmaku: false,
      ueshita
    };

    if (!ok) {
      // danmaku
      chat.danmaku = true;
      chat.y = Math.random() * (screenHeight - height);
    } else {
      // normal
      lines.push({
        y,
        h: height,
        end:
          c.vpos +
          (c.pos === "ue" || c.pos === "shita" ? ueshitaDuration : duration)
      });
      lines.sort((a, b) => a.y - b.y);

      if (c.pos === "shita") {
        chat.y = screenHeight - chat.y - chat.height;
      }
    }

    chats.push(chat);

    switch (c.pos) {
      case "ue":
        ue = lines;
        break;
      case "shita":
        shita = lines;
        break;
      default:
        naka = lines;
        break;
    }
  }

  return chats;
};
