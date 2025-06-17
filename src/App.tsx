import React, { Fragment, useState, useCallback, useRef } from "react";
import { css } from "@emotion/react";
import { Global } from "@emotion/react";
import useFileInput from "use-file-input";
import { useHotkeys } from "react-hotkeys-hook";

import globalStyles from "./styles";
import Video from "./components/Video";
import SeekerAndDropZone from "./components/SeekerAndDropZone";
import Controller from "./components/Controller";
import SettingPanel from "./components/SettingPanel";
import CommentArea from "./components/CommentArea";
import Banner from "./components/Banner";

import useComment from "./use-comment";
import useConfig from "./use-config";
import useVideo from "./use-video";
import useWindowError from "./util/useWindowError";

const safari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const ios = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);

const App: React.FC = () => {
  const {
    settings,
    filterKeywords,
    muteKeywords,
    styles,
    thinning,
    updateSettings
  } = useConfig();

  const {
    videoRef,
    src,
    loadVideo,
    playing,
    setPlaying,
    currentTime,
    setCurrentTime,
    duration,
    timeRanges,
    handleVideoEvent,
    handleTimeUpdate,
    unloadVideo
  } = useVideo();

  const {
    comments,
    duration: commentDuration,
    influence,
    loadComments,
    unloadComments,
    commentTimeCorrection,
    setCommentTimeCorrection
  } = useComment(duration);

  const seekbarDuration = duration === 0 ? commentDuration : duration;

  const commentAreaRef = useRef<{ updateComment: () => void }>(null);
  const [error, setError] = useWindowError();
  const [commentUpdateRequired, setCommentUpdateRequired] = useState(false);
  const [controllerHidden, setControllerHidden] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
  const [activeSearchQuery, setActiveSearchQuery] = useState("");

  const handleCommentUpdateRequire = useCallback(() => {
    setCommentUpdateRequired(true);
  }, []);

  const handleUpdateComment = useCallback(() => {
    if (commentAreaRef.current) {
      setCommentUpdateRequired(false);
      commentAreaRef.current.updateComment();
    }
  }, []);

  const handleUpdateCommentClose = useCallback(() => {
    setCommentUpdateRequired(false);
  }, []);

  const handleVideoClick = useCallback(() => setControllerHidden(p => !p), []);

  const handlePlayButtonClick = useCallback(() => {
    if (!comments || seekbarDuration === 0) return;
    if (videoRef.current && src) {
      setPlaying(videoRef.current.toggle());
    } else {
      setPlaying(p => !p);
    }
  }, [comments, seekbarDuration, setPlaying, src, videoRef]);

  const handleSeek = useCallback(
    (t: number, relative?: boolean) => {
      if (!comments || commentDuration === 0) return;
      if (videoRef.current && src) {
        if (relative) {
          videoRef.current.seekRelative(t / 1000);
        } else {
          videoRef.current.seek(t / 1000);
        }
      } else {
        setCurrentTime(t2 =>
          Math.max(0, Math.min(seekbarDuration, relative ? t + t2 : t))
        );
      }
    },
    [commentDuration, comments, seekbarDuration, setCurrentTime, src, videoRef]
  );

  const handleDrop = useCallback(
    async (file: File) => {
      if (file.type.indexOf("video/") === 0) {
        loadVideo(file);
      } else if (
        file.type === "text/xml" || 
        file.type === "application/xml" ||
        file.type === "application/json" ||
        file.name.endsWith('.json') ||
        file.name.endsWith('.xml')
      ) {
        await loadComments(file).catch(err =>
          setError(err.message || err.toString())
        );
      }
    },
    [loadComments, loadVideo, setError]
  );

  const handleVideoOpen = useFileInput(
    files => {
      if (files.length === 0) return;
      loadVideo(files[0]);
    },
    { accept: !safari || ios ? "video/*" : "*", multiple: ios }
  );

  const handleCommentOpen = useFileInput(
    async files => {
      if (files.length === 0) return;
      await loadComments(files[0]).catch(err =>
        setError(err.message || err.toString())
      );
    },
    { accept: "application/xml,application/json,.xml,.json" }
  );

  const handleMenuClose = useCallback(() => setMenuVisible(false), []);
  const handleErrorClose = useCallback(() => setError(undefined), [setError]);
  const handleGetCurrentTime = useCallback(
    () => (videoRef.current ? videoRef.current.currentTime() * 1000 : 0),
    [videoRef]
  );

  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setCurrentSearchIndex(-1);
    setActiveSearchQuery("");
  }, []);

  const performSearch = useCallback((query: string) => {
    if (!query || comments.length === 0) {
      clearSearch();
      return;
    }

    // Find all matching comments
    const matches = comments
      .map((comment, index) => ({ comment, index }))
      .filter(({ comment }) => 
        comment.text.toLowerCase().includes(query.toLowerCase())
      )
      .map(({ index }) => index);

    setSearchResults(matches);
    setActiveSearchQuery(query);

    if (matches.length === 0) {
      setCurrentSearchIndex(-1);
      return;
    }

    // Start with first result
    setCurrentSearchIndex(0);
    const targetComment = comments[matches[0]];
    if (targetComment) {
      // Seek to a position where the comment will be visible
      // Use comment duration from settings to calculate appropriate offset
      const isUeshita = targetComment.pos === "ue" || targetComment.pos === "shita";
      const commentDuration = isUeshita ? styles.ueshitaDuration : styles.duration;
      const seekTime = targetComment.vpos + Math.min(commentDuration * 0.1, 500); // 10% of duration or 0.5s max
      handleSeek(seekTime);
    }
  }, [comments, handleSeek, styles.duration, styles.ueshitaDuration, clearSearch]);

  const navigateSearch = useCallback((direction: 'next' | 'prev') => {
    if (searchResults.length === 0) return;

    let targetIndex;
    if (direction === 'next') {
      targetIndex = (currentSearchIndex + 1) % searchResults.length;
    } else {
      targetIndex = currentSearchIndex === 0 ? searchResults.length - 1 : currentSearchIndex - 1;
    }

    setCurrentSearchIndex(targetIndex);
    const targetComment = comments[searchResults[targetIndex]];
    if (targetComment) {
      // Seek to a position where the comment will be visible
      // Use comment duration from settings to calculate appropriate offset
      const isUeshita = targetComment.pos === "ue" || targetComment.pos === "shita";
      const commentDuration = isUeshita ? styles.ueshitaDuration : styles.duration;
      const seekTime = targetComment.vpos + Math.min(commentDuration * 0.1, 500); // 10% of duration or 0.5s max
      handleSeek(seekTime);
    }
  }, [searchResults, currentSearchIndex, comments, handleSeek, styles.duration, styles.ueshitaDuration]);

  const handleSearch = useCallback((query: string, direction: 'next' | 'prev' = 'next') => {
    if (direction === 'next') {
      if (!query) {
        // Clear search when empty query
        clearSearch();
      } else if (activeSearchQuery !== query) {
        // New search
        performSearch(query);
      } else {
        // Navigate existing results
        navigateSearch(direction);
      }
    } else {
      // Navigate existing results
      navigateSearch(direction);
    }
  }, [activeSearchQuery, performSearch, navigateSearch, clearSearch]);

  useHotkeys(",", () => setCommentTimeCorrection(s => s - 1000), [
    setCommentTimeCorrection
  ]);
  useHotkeys(".", () => setCommentTimeCorrection(s => s + 1000), [
    setCommentTimeCorrection
  ]);
  useHotkeys("/", () => setCommentTimeCorrection(0), [
    setCommentTimeCorrection
  ]);

  return (
    <Fragment>
      <Global styles={globalStyles} />
      <Video
        ref={videoRef}
        src={src}
        onEvent={handleVideoEvent}
        onTimeUpdate={handleTimeUpdate}
      />
      <CommentArea
        ref={commentAreaRef}
        comments={comments}
        currentTime={currentTime}
        playing={playing}
        styles={styles}
        opacity={
          settings?.commentOpacity ? settings?.commentOpacity / 100 : undefined
        }
        opacityDanmaku={
          settings?.danmakuCommentOpacity
            ? settings?.danmakuCommentOpacity / 100
            : undefined
        }
        thinning={thinning}
        colorize={settings?.coloriseComments}
        timeCorrection={commentTimeCorrection}
        muteKeywords={muteKeywords}
        filterKeywords={filterKeywords}
        onCommentsRemeasurementRequire={handleCommentUpdateRequire}
        getCurrentTime={src ? handleGetCurrentTime : undefined}
        visibleCommentCount={
          settings?.limitComments ? settings?.visibleCommentCount : undefined
        }
        searchResults={searchResults}
        currentSearchIndex={currentSearchIndex}
        searchQuery={activeSearchQuery}
      />
      <SeekerAndDropZone
        seekable={settings?.seekable && seekbarDuration > 0}
        droppable
        onSeek={handleSeek}
        onDrop={handleDrop}
        onClick={handleVideoClick}
        onDoubleClick={handlePlayButtonClick}
      />
      <Controller
        hidden={controllerHidden}
        playing={playing}
        manual={!!src}
        onPlayButtonClick={handlePlayButtonClick}
        onSeek={handleSeek}
        onVideoButtonClick={handleVideoOpen}
        onCommentButtonClick={handleCommentOpen}
        onMenuButtonClick={() => {
          if (!menuVisible) setMenuVisible(true);
        }}
        currentTime={currentTime}
        duration={seekbarDuration}
        buffered={timeRanges}
        influence={influence}
        css={css`
          position: fixed;
          bottom: 0;
        `}
      />
      <SettingPanel
        shown={menuVisible}
        initialSettings={settings}
        onClose={handleMenuClose}
        onChange={updateSettings}
        onVideoClose={unloadVideo}
        onCommentsClose={unloadComments}
        onSearch={handleSearch}
        searchResultsCount={searchResults.length}
      />
      <Banner error onClose={handleErrorClose}>
        {error}
      </Banner>
      <Banner
        buttonText="Update"
        onButtonClick={handleUpdateComment}
        onClose={handleUpdateCommentClose}
      >
        {commentUpdateRequired
          ? "Recalculation is required to update the comments display."
          : ""}
      </Banner>
    </Fragment>
  );
};

export default App;
