import binarySearch from "../../util/binarySearch";

export interface Comment {
  id: number;
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
  speed: number;
  fontSize?: number;
}

export interface ChatCommonStyle {
  fontFamily: string;
  fontWeight: string;
  lineHeight: number;
  bigSizeScale: number;
  smallSizeScale: number;
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
  const ss = Object.entries(s || {}).reduce(
    (a, [k, v]) => (typeof v === "undefined" ? a : { ...a, [k]: v }),
    {}
  );
  const styles = {
    ...defaultChatStyle,
    ...ss
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
  if (chats.length === 0 || isNaN(duration)) return [];
  const start = binarySearch(chats, frame - duration, c => c.vpos);
  const end = binarySearch(chats, frame, c => c.vpos);
  return chats.slice(start, end).filter(c => frame < c.vpos + c.duration);
};

export const commentsToChats = (
  comments: Comment[],
  screenWidth: number,
  screenHeight: number,
  style: ChatActualStyle
): Chat[] => {
  const { duration, ueshitaDuration } = style;
  const chats: Chat[] = [];
  let naka: Chat[] = [];
  let ue: Chat[] = [];
  let shita: Chat[] = [];

  for (const c of comments) {
    const ueshita = c.pos === "ue" || c.pos === "shita";
    const dur = ueshita ? ueshitaDuration : duration;
    const { width, height, size } = measureSize(
      c.text,
      c.size,
      screenWidth,
      style
    );
    const speed = (screenWidth + width) / dur;

    let lines = c.pos === "ue" ? ue : c.pos === "shita" ? shita : naka;

    // advance time
    lines = lines.filter(l => l.vpos + l.duration > c.vpos);

    let y = 0;
    let danmaku = false;

    if (height < screenHeight) {
      // find gap
      if (lines.length > 0) {
        if (ueshita) {
          for (const l of lines) {
            // empty
            if (y + height <= l.y) {
              break;
            }

            y = l.y + l.height;

            // overflowed
            if (y + height > screenHeight) {
              danmaku = true;
              y = Math.random() * (screenHeight - height);
              break;
            }
          }
        } else {
          while (true) {
            const bottom = y + height;

            // Extract all chats that intersect from the top to the bottom of the current comment on the Y axis
            const y2 = y;
            const intersectedChats = lines.filter(
              l =>
                (y2 < l.y && l.y + l.height < bottom) ||
                (y2 < l.y + l.height && l.y < bottom) ||
                (l.y < bottom && y2 < l.y + l.height) ||
                (l.y < y2 && bottom < l.y + l.height)
            );

            if (intersectedChats.length === 0) break;

            const overlappedChats = intersectedChats.filter(l => {
              const diffVpos = c.vpos - l.vpos;
              if (diffVpos <= 0) return true; // already overlapping

              const diffDistance = diffVpos * l.speed - l.width;
              if (diffDistance < 0) return true; // already overlapping

              const relativeSpeed = speed - l.speed;
              if (relativeSpeed <= 0) return false; // never overlap

              // Time until the comment is completely hidden at the left edge of the screen
              const leftTime = l.duration - diffVpos;

              return diffDistance / relativeSpeed < leftTime;
            });

            if (overlappedChats.length === 0) {
              // Does not overlap
              break;
            }

            // Set new Y
            const maxBottom = overlappedChats.reduce((a, b) => {
              const bottom = b.y + b.height;
              return a < bottom ? bottom : a;
            }, 0);
            if (maxBottom <= y) {
              // invalid
              danmaku = true;
              break;
            }
            y = maxBottom;

            // overflowed
            if (y + height > screenHeight) {
              danmaku = true;
              y = Math.random() * (screenHeight - height);
              break;
            }
          }
        }
      }
    } else {
      // when height is too large, y is fixed to 0
      danmaku = true;
      y = 0;
    }

    const chat: Chat = {
      ...c,
      y,
      width,
      height,
      duration: dur,
      danmaku,
      ueshita,
      speed,
      fontSize: size
    };

    if (!danmaku) {
      lines.push(chat);
      lines.sort((a, b) => a.y - b.y);
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

  return chats.map(c =>
    c.pos === "shita" ? { ...c, y: screenHeight - c.y - c.height } : c
  );
};

const canvas = document.createElement("canvas");

const measureSize = (
  text: string,
  size: "big" | "small" | undefined,
  screenWidth: number,
  s: ChatActualStyle
) => {
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  let fontSize = Math.floor(
    (size === "big"
      ? s.bigSizeScale
      : size === "small"
      ? s.smallSizeScale
      : 1) * s.size
  );

  ctx.font = `${s.fontWeight || ""} ${fontSize}px ${s.fontFamily ||
    "sans-serif"}`.trim();
  const lines = text.split("\n");

  let width = lines
    .map(t => ctx.measureText(t).width)
    .reduce((a, b) => (a < b ? b : a), 0);
  let height = lines.length * fontSize * s.lineHeight;

  const r = screenWidth / width;
  if (r < 1) {
    width = screenWidth;
    height *= r;
    fontSize *= r;
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
    size: fontSize
  };
};
