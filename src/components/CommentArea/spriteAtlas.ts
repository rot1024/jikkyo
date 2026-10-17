// Packs sprites into a few large canvases (pages). Drawing from a small number of
// textures lets the GPU batch the draws, and avoids creating a canvas (texture)
// for every comment, which is heavy when many comments appear at once.

export interface Page {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  // incremented when the page is cleared; sprites with an old generation are invalid
  generation: number;
  // shelf packing state
  x: number;
  y: number;
  shelfHeight: number;
}

export interface Sprite {
  page: Page;
  generation: number;
  // position and size in the page (device pixels)
  x: number;
  y: number;
  width: number;
  height: number;
}

const pageSize = 2048;
// 16MB per page. Pages are added only when needed (e.g. bursts at a high DPR)
// and released when unused, keeping a few for reuse.
const maxPages = 16;
const keptEmptyPages = 2;

const createPage = (width: number, height: number): Page | undefined => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;
  return { canvas, ctx, generation: 0, x: 0, y: 0, shelfHeight: 0 };
};

const clearPage = (page: Page) => {
  page.ctx.clearRect(0, 0, page.canvas.width, page.canvas.height);
  page.generation++;
  page.x = 0;
  page.y = 0;
  page.shelfHeight = 0;
};

// allocates a w x h area in the page with simple shelf packing
const allocateIn = (page: Page, w: number, h: number) => {
  if (page.x + w > page.canvas.width) {
    page.y += page.shelfHeight;
    page.x = 0;
    page.shelfHeight = 0;
  }
  if (page.y + h > page.canvas.height) return undefined;
  const pos = { x: page.x, y: page.y };
  page.x += w;
  page.shelfHeight = Math.max(page.shelfHeight, h);
  return pos;
};

export const isValid = (s: Sprite) => s.generation === s.page.generation;

const isEmpty = (page: Page) => page.x === 0 && page.y === 0 && page.shelfHeight === 0;

// a canvas of its own for a sprite that does not fit in the atlas
const standalone = (w: number, h: number): Sprite | undefined => {
  const page = createPage(w, h);
  return page && { page, generation: 0, x: 0, y: 0, width: w, height: h };
};

export class SpriteAtlas {
  private pages: Page[] = [];
  // the page to allocate from
  private current: Page | undefined;

  allocate(w: number, h: number): Sprite | undefined {
    if (w > pageSize || h > pageSize) return standalone(w, h);

    let pos = this.current && allocateIn(this.current, w, h);
    if (!pos) {
      // use an empty page, or a new page while the number of pages is limited.
      // Pages with sprites in use are never cleared; when all are in use
      // (e.g. a huge number of comments), sprites get their own canvases.
      this.current =
        this.pages.find(isEmpty) ??
        (this.pages.length < maxPages ? this.addPage() : undefined);
      pos = this.current && allocateIn(this.current, w, h);
    }
    if (!this.current || !pos) return standalone(w, h);
    return {
      page: this.current,
      generation: this.current.generation,
      ...pos,
      width: w,
      height: h
    };
  }

  private addPage() {
    const page = createPage(pageSize, pageSize);
    if (page) this.pages.push(page);
    return page;
  }

  // clears pages whose sprites are all unused so that they can be reused
  collect(live: Iterable<Sprite>) {
    const used = new Set<Page>();
    for (const s of live) used.add(s.page);
    for (const page of this.pages) {
      if (!used.has(page) && !isEmpty(page)) clearPage(page);
    }
    let empty = 0;
    this.pages = this.pages.filter(page => {
      if (!isEmpty(page) || page === this.current || ++empty <= keptEmptyPages) {
        return true;
      }
      // release the GPU memory now rather than waiting for GC
      page.canvas.width = 0;
      page.canvas.height = 0;
      return false;
    });
  }

  clear() {
    this.pages.forEach(clearPage);
  }
}
