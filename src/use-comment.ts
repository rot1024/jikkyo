import { useState, useMemo, useCallback } from "react";
import load, { Comment } from "./util/commentLoader";

export default function useComment(duration: number) {
  const [comments, setComments] = useState<{
    comments: Comment[];
    duration: number;
    influence: number[];
  }>();
  const [commentTimeCorrection, setCommentTimeCorrection] = useState(0);

  const loadComments = useCallback(async (file: File) => {
    setComments(undefined); // Clear existing comments first
    setCommentTimeCorrection(0);
    setComments(await load(file));
  }, []);

  const influence = useMemo(() => {
    if (!comments) return undefined;

    const len = comments.influence.length;
    let influence: number[];

    if (duration === 0) {
      influence = comments.influence;
    } else if (duration >= comments.duration) {
      influence = comments.influence.concat(
        new Array(
          Math.floor((duration - comments.duration) * (len / comments.duration))
        ).fill(0)
      );
    } else {
      const index = Math.floor((duration / comments.duration) * len);
      influence = comments.influence.slice(0, index);
    }

    const tc = Math.floor(
      (commentTimeCorrection * influence.length) / comments.duration
    );

    return tc === 0
      ? influence
      : tc < 0
      ? [
          ...new Array(-tc).fill(0),
          ...influence.slice(0, influence.length - tc)
        ]
      : [...influence.slice(tc), ...new Array(tc).fill(0)];
  }, [comments, duration, commentTimeCorrection]);

  const unloadComments = useCallback(() => {
    setComments(undefined);
    setCommentTimeCorrection(0);
  }, []);

  return {
    comments: comments && comments.comments.length > 0 ? comments.comments : [],
    duration: comments ? comments.duration : 0,
    influence,
    loadComments,
    unloadComments,
    commentTimeCorrection,
    setCommentTimeCorrection
  };
}
