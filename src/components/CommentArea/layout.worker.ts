// Lays out comments off the main thread (see layout.ts)
import { commentsToChats, Comment, ChatActualStyle } from "./util";
import { encodeLayout } from "./layoutCodec";

export type LayoutRequest =
  | { type: "comments"; comments: Comment[] }
  | {
      type: "layout";
      id: number;
      width: number;
      height: number;
      style: ChatActualStyle;
    };

let comments: Comment[] = [];

self.onmessage = (e: MessageEvent<LayoutRequest>) => {
  const msg = e.data;
  if (msg.type === "comments") {
    comments = msg.comments;
    return;
  }
  const data = encodeLayout(
    commentsToChats(comments, msg.width, msg.height, msg.style)
  );
  self.postMessage({ id: msg.id, data }, { transfer: [data.buffer] });
};
