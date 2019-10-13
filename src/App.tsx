/** @jsx jsx */
import React, { Fragment, useState, useCallback, useRef } from "react";
import { css, jsx } from "@emotion/core";
import { hot } from "react-hot-loader/root";
import { Global } from "@emotion/core";
import useFileInput from "use-file-input";

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
    handleTimeUpdate
  } = useVideo();

  const {
    comments,
    duration: commentDuration,
    influence,
    loadComments
  } = useComment(duration, settings.commentTimeCorrection);

  const seekbarDuration = duration === 0 ? commentDuration : duration;

  const commentAreaRef = useRef<{ updateComment: () => void }>(null);
  const error = useWindowError();
  const [commentUpdateRequired, setCommentUpdateRequired] = useState(false);
  const [controllerHidden, setControllerHidden] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

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
      } else if (file.type === "text/xml" || file.type === "application/xml") {
        await loadComments(file);
      }
    },
    [loadComments, loadVideo]
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
      await loadComments(files[0]);
    },
    { accept: "application/xml" }
  );

  const handleMenuClose = useCallback(() => setMenuVisible(false), []);

  const handleGetCurrentTime = useCallback(
    () => (videoRef.current ? videoRef.current.currentTime() * 1000 : 0),
    [videoRef]
  );

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
          settings.commentOpacity ? settings.commentOpacity / 100 : undefined
        }
        opacityDanmaku={
          settings.danmakuCommentOpacity
            ? settings.danmakuCommentOpacity / 100
            : undefined
        }
        thinning={thinning}
        colorize={settings.coloriseComments}
        timeCorrection={settings.commentTimeCorrection}
        muteKeywords={muteKeywords}
        filterKeywords={filterKeywords}
        onCommentsRemeasurementRequire={handleCommentUpdateRequire}
        getCurrentTime={!!src ? handleGetCurrentTime : undefined}
        visibleCommentCount={
          settings.limitComments ? settings.visibleCommentCount : undefined
        }
      />
      <SeekerAndDropZone
        seekable={seekbarDuration > 0}
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
      />
      <Banner error>{error}</Banner>
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

export default hot(App);
