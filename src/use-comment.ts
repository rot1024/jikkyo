import { useState, useMemo, useCallback } from "react";
import load, { Comment } from "./util/commentLoader";

// `videoDuration` is 0 when no video is loaded. In that case the timeline is
// the comment duration plus `tail` (time for the last comment to leave the screen).
export default function useComment(videoDuration: number, tail: number) {
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
    if (comments.duration === 0) return comments.influence;

    const duration = videoDuration || comments.duration + tail;
    const len = comments.influence.length;
    let influence: number[];

    if (duration >= comments.duration) {
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
  }, [comments, videoDuration, tail, commentTimeCorrection]);

  const unloadComments = useCallback(() => {
    setComments(undefined);
    setCommentTimeCorrection(0);
  }, []);

  return {
    comments: comments && comments.comments.length > 0 ? comments.comments : [],
    // timeline duration used when no video is loaded
    duration: comments ? comments.duration + tail : 0,
    influence,
    loadComments,
    unloadComments,
    commentTimeCorrection,
    setCommentTimeCorrection
  };
}
