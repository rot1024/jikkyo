import { Chat, ChatActualStyle, getVisibleChats } from "./util";

export interface DrawOptions {
  // all laid-out chats sorted by vpos
  chats: Chat[];
  styles: ChatActualStyle;
  // canvas size in CSS pixels
  width: number;
  height: number;
  dpr: number;
  opacity: number;
  opacityDanmaku: number;
  thinning?: [number, number];
  colorize?: boolean;
  visibleCommentCount: number;
}

// space around the text for the shadow and stroke
const spritePadding = 4;

type Sprite = HTMLCanvasElement;

// Draws a chat once into an offscreen canvas. Drawing text with shadow and
// stroke is expensive, so each frame only blits these sprites.
const renderSprite = (
  c: Chat,
  styles: ChatActualStyle,
  colorize: boolean | undefined,
  dpr: number
): Sprite => {
  const sprite = document.createElement("canvas");
  sprite.width = Math.ceil((c.width + spritePadding * 2) * dpr);
  sprite.height = Math.ceil((c.height + spritePadding * 2) * dpr);
  const ctx = sprite.getContext("2d");
  if (!ctx) return sprite;

  ctx.scale(dpr, dpr);
  ctx.font = `${styles.fontWeight || ""} ${c.fontSize}px ${styles.fontFamily ||
    "sans-serif"}`.trim();
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
  ctx.lineWidth = 0.5;
  ctx.shadowColor = "rgba(0, 0, 0, 1)";
  ctx.shadowBlur = 2;
  ctx.fillStyle = c.isHighlighted
    ? "#fff"
    : (colorize ? c.color2 : c.color) || "#fff";

  const lines = c.text.split("\n");
  const lineHeight = c.height / lines.length;
  lines.forEach((line, i) => {
    const y = spritePadding + i * lineHeight;
    ctx.fillText(line, spritePadding, y);
    ctx.strokeText(line, spritePadding, y);
  });
  return sprite;
};

// Renders chats onto a canvas. Holds sprites of chats on the screen between frames.
export class ChatRenderer {
  private sprites = new Map<Chat, Sprite>();
  private appearance?: Pick<DrawOptions, "chats" | "styles" | "colorize" | "dpr">;

  // sprites depend on the appearance of chats
  private syncAppearance(o: DrawOptions) {
    const a = this.appearance;
    if (
      a &&
      a.chats === o.chats &&
      a.styles === o.styles &&
      a.colorize === o.colorize &&
      a.dpr === o.dpr
    ) {
      return;
    }
    this.appearance = {
      chats: o.chats,
      styles: o.styles,
      colorize: o.colorize,
      dpr: o.dpr
    };
    this.sprites = new Map();
  }

  draw(ctx: CanvasRenderingContext2D, frame: number, o: DrawOptions) {
    this.syncAppearance(o);

    ctx.setTransform(o.dpr, 0, 0, o.dpr, 0, 0);
    ctx.clearRect(0, 0, o.width, o.height);
    if (o.chats.length === 0) return;

    const { styles, thinning } = o;
    const [visible] = getVisibleChats(
      o.chats,
      frame,
      Math.max(styles.duration, styles.ueshitaDuration)
    );
    const targets = visible
      .filter(
        c =>
          !c.hidden &&
          frame > c.vpos &&
          (!thinning || c.id % thinning[1] === thinning[0] - 1)
      )
      .slice(-o.visibleCommentCount);

    const prevSprites = this.sprites;
    const nextSprites = new Map<Chat, Sprite>();

    for (const c of targets) {
      const x = c.ueshita
        ? (o.width - c.width) / 2
        : (o.width + c.width) * (1 - (frame - c.vpos) / c.duration) - c.width;

      if (c.isHighlighted && c.searchQuery) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = c.isCurrentResult ? "#ff6600" : "#cc4400";
        ctx.fillRect(x - 2, c.y - 2, c.width + 4, c.height + 4);
      }

      let sprite = prevSprites.get(c);
      if (!sprite) sprite = renderSprite(c, styles, o.colorize, o.dpr);
      nextSprites.set(c, sprite);

      ctx.globalAlpha = c.danmaku ? o.opacityDanmaku : o.opacity;
      ctx.drawImage(
        sprite,
        x - spritePadding,
        c.y - spritePadding,
        sprite.width / o.dpr,
        sprite.height / o.dpr
      );
    }

    // keep only sprites of chats on the screen
    this.sprites = nextSprites;
  }
}
