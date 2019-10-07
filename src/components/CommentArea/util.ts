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
  width: number;
  height: number;
  duration: number;
  danmaku: boolean;
  ueshita: boolean;
}

export interface ChatCommonStyle {
  fontFamily: string;
  fontWeight: string;
  lineHeight: number;
  bigSizeScale: number;
  smallSizeScale: number;
  opacity: number;
  opacityDanmaku: number;
  duration: number;
  ueshitaDuration: number;
}

export interface ChatStyle extends ChatCommonStyle {
  sizing: "rows" | "fontSize";
  rows: number;
  fontSize: number;
}

export interface ChatActualStyle extends ChatCommonStyle {
  size: number;
}

export const defaultChatStyle: ChatStyle = {
  fontFamily: "sans-serif",
  fontWeight: "bold",
  lineHeight: 1.4,
  bigSizeScale: 1.5,
  smallSizeScale: 0.5,
  opacity: 1,
  opacityDanmaku: 1,
  duration: 5000,
  ueshitaDuration: 3000,
  sizing: "rows",
  rows: 10,
  fontSize: 32
};

export const getChatActualStyle = (
  s: Partial<ChatStyle> | undefined,
  height: number
): ChatActualStyle => {
  const styles = {
    ...defaultChatStyle,
    ...s
  };
  return {
    ...styles,
    size: Math.round(
      styles.sizing === "fontSize"
        ? styles.fontSize
        : height / styles.rows / styles.lineHeight
    )
  };
};

export type Measurer = (
  text: string,
  size?: "big" | "small"
) => { width: number; height: number };

export const getVisibleChats = (
  chats: Chat[],
  frame: number,
  duration: number
) => {
  if (chats.length === 0) return [];
  const start = binarySearch(chats, frame - duration, c => c.vpos);
  const end = binarySearch(chats, frame, c => c.vpos);
  return chats.slice(start, end).filter(c => frame < c.vpos + c.duration);
};

export const commentsToChats = (
  comments: Comment[],
  screenHeight: number,
  duration: number,
  ueshitaDuration: number,
  measurer: Measurer
): Chat[] => {
  const chats: Chat[] = [];

  type ChatLine = { y: number; h: number; end: number };
  let naka: ChatLine[] = [];
  let ue: ChatLine[] = [];
  let shita: ChatLine[] = [];

  for (const c of comments) {
    const dur =
      c.pos === "ue" || c.pos === "shita" ? ueshitaDuration : duration;
    const { width, height } = measurer(c.text, c.size);
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
      width,
      height,
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

export const chatSizeMeasurer = (style: ChatActualStyle): Measurer => {
  const s = { ...style };
  const c = document.createElement("canvas");

  return (text: string, size?: "big" | "small") => {
    const ctx = c.getContext("2d") as CanvasRenderingContext2D;
    const fontSize = Math.floor(
      (size === "big"
        ? s.bigSizeScale
        : size === "small"
        ? s.smallSizeScale
        : 1) * s.size
    );

    ctx.font = `${s.fontWeight || ""} ${fontSize}px ${s.fontFamily ||
      "sans-serif"}`.trim();
    const lines = text.split("\n");

    const width = lines
      .map(t => ctx.measureText(t).width)
      .reduce((a, b) => (a < b ? b : a), 0);
    const height = lines.length * fontSize * s.lineHeight;

    return {
      width: Math.round(width),
      height: Math.round(height)
    };
  };
};
