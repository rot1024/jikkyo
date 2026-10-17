import { useState, useMemo, useCallback } from "react";
import load, { Comment } from "./util/commentLoader";
import { generateDummyComments, DummyOptions } from "./util/dummyComments";
import { calcInfluence } from "./util/influence";
import { detectHighlights } from "./util/highlights";

// resolution of the heat map on the seekbar
const influenceDivisions = 300;

const emptyComments: Comment[] = [];

// `videoDuration` is 0 when no video is loaded. In that case the timeline is
// the comment duration plus `tail` (time for the last comment to leave the screen).
export default function useComment(videoDuration: number, tail: number) {
  const [comments, setComments] = useState<{
    comments: Comment[];
    duration: number;
  }>();
  const [commentTimeCorrection, setCommentTimeCorrection] = useState(0);

  const loadComments = useCallback(async (file: File) => {
    setComments(undefined); // Clear existing comments first
    setCommentTimeCorrection(0);
    setComments(await load(file));
  }, []);

  // computed from comments directly so that it always matches the timeline
  // (video or comment duration) and the time correction
  const influence = useMemo(() => {
    if (!comments) return undefined;
    const duration = videoDuration || comments.duration + tail;
    return calcInfluence(
      comments.comments,
      duration,
      influenceDivisions,
      commentTimeCorrection
    );
  }, [comments, videoDuration, tail, commentTimeCorrection]);

  const highlights = useMemo(() => {
    if (!comments) return [];
    return detectHighlights(
      comments.comments,
      videoDuration || comments.duration + tail,
      commentTimeCorrection
    );
  }, [comments, videoDuration, tail, commentTimeCorrection]);

  const loadDummyComments = useCallback((options?: DummyOptions) => {
    setCommentTimeCorrection(0);
    setComments(generateDummyComments(options));
  }, []);

  const unloadComments = useCallback(() => {
    setComments(undefined);
    setCommentTimeCorrection(0);
  }, []);

  return {
    comments: comments ? comments.comments : emptyComments,
    // timeline duration used when no video is loaded
    duration: comments ? comments.duration + tail : 0,
    influence,
    highlights,
    loadComments,
    loadDummyComments,
    unloadComments,
    commentTimeCorrection,
    setCommentTimeCorrection
  };
}
