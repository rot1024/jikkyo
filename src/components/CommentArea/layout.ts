import { Chat, Comment, ChatActualStyle, commentsToChats } from "./util";
import { decodeLayout } from "./layoutCodec";
import type { LayoutRequest } from "./layout.worker";

let worker: Worker | undefined;
let sentComments: Comment[] | undefined;
let nextId = 0;
const pending = new Map<
  number,
  { comments: Comment[]; resolve: (chats: Chat[]) => void }
>();

const getWorker = () => {
  if (!worker) {
    worker = new Worker(new URL("./layout.worker.ts", import.meta.url), {
      type: "module"
    });
    worker.onmessage = (e: MessageEvent<{ id: number; data: Float64Array }>) => {
      const p = pending.get(e.data.id);
      if (!p) return;
      pending.delete(e.data.id);
      p.resolve(decodeLayout(p.comments, e.data.data));
    };
  }
  return worker;
};

const workerAvailable =
  typeof Worker !== "undefined" && typeof OffscreenCanvas !== "undefined";

// Lays out comments in a worker so that the UI does not freeze with many comments.
// Falls back to the main thread where workers or OffscreenCanvas are unavailable.
export const layoutChats = (
  comments: Comment[],
  width: number,
  height: number,
  style: ChatActualStyle
): Promise<Chat[]> => {
  if (comments.length === 0 || height === 0) return Promise.resolve([]);
  if (!workerAvailable) {
    return Promise.resolve().then(() =>
      commentsToChats(comments, width, height, style)
    );
  }

  const w = getWorker();
  // comments are sent only when they change
  if (sentComments !== comments) {
    w.postMessage({ type: "comments", comments } satisfies LayoutRequest);
    sentComments = comments;
  }
  const id = nextId++;
  return new Promise(resolve => {
    pending.set(id, { comments, resolve });
    w.postMessage({ type: "layout", id, width, height, style } satisfies LayoutRequest);
  });
};
