/** @jsx jsx */
import React, { Fragment, useState, useCallback, useRef } from "react";
import { css, jsx } from "@emotion/core";
import { hot } from "react-hot-loader/root";
import { Global } from "@emotion/core";
import useFileInput from "use-file-input";
import { useHotkeys } from "react-hotkeys-hook";

import globalStyles from "./styles";
import loadComment, { Comment } from "./util/commentLoader";
import Video, { EventType, Methods } from "./components/Video";
import Controller from "./components/Controller";
import SettingPanel, { Settings } from "./components/SettingPanel";
import CommentArea from "./components/CommentArea";

const App: React.FC = () => {
  const videoRef = useRef<Methods>(null);
  const [src, setSrc] = useState<string>();
  const [comments, setComments] = useState<Comment[]>();
  const [canPlay, setCanPlay] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [seekTime, setSeekTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [controllerHidden, setControllerHidden] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const handleVideoClick = useCallback(() => setControllerHidden(p => !p), []);
  const handlePlayButtonClick = useCallback(() => {
    if (!videoRef.current) return;
    setPlaying(videoRef.current.toggle());
  }, []);
  const handleVideoEvent = useCallback(
    (e: EventType, ct: number, d: number) => {
      if (e === "load") {
        setPlaying(false);
        setCanPlay(false);
        setSeekTime(0);
      } else if (e === "pause") {
        setPlaying(false);
      } else if (e === "play") {
        setPlaying(true);
      } else if (e === "canplay") {
        setCanPlay(true);
      }
      setCurrentTime(ct);
      setDuration(d);
    },
    []
  );
  const handleSeek = useCallback((t: number, relative?: boolean) => {
    if (!setSeekTime) return;
    setSeekTime(relative ? s => s + t : t);
  }, []);
  const handleVideoOpen = useFileInput(
    files => {
      if (files.length === 0) return;
      const url = URL.createObjectURL(files[0]);
      setSrc(url);
      setPlaying(false);
      setSeekTime(0);
    },
    { accept: "video/*", multiple: true }
  );
  const handleCommentOpen = useFileInput(
    async files => {
      if (files.length === 0) return;
      const comments = await loadComment(files[0]);
      setComments(comments);
    },
    { accept: "application/xml" }
  );
  const handleMenuClose = useCallback(() => setMenuVisible(false), []);
  const [, setSettings] = useState<Settings>();

  useHotkeys("space", handlePlayButtonClick);

  return (
    <Fragment>
      <Global styles={globalStyles} />
      <Video
        ref={videoRef}
        src={src}
        currentTime={seekTime}
        onTimeUpdate={setCurrentTime}
        onEvent={handleVideoEvent}
      />
      <CommentArea
        comments={comments}
        currentTime={(currentTime || 0) * 1000}
        playing={playing}
        onClick={handleVideoClick}
        onDoubleClick={handlePlayButtonClick}
      />
      <Controller
        hidden={controllerHidden}
        playing={playing}
        canPlay={canPlay}
        onPlayButtonClick={handlePlayButtonClick}
        onSeek={handleSeek}
        onVideoButtonClick={handleVideoOpen}
        onCommentButtonClick={handleCommentOpen}
        onMenuButtonClick={() => {
          if (!menuVisible) setMenuVisible(true);
        }}
        currentTime={currentTime}
        duration={duration}
        css={css`
          position: fixed;
          bottom: 0;
        `}
      />
      <SettingPanel
        shown={menuVisible}
        onClose={handleMenuClose}
        onChange={setSettings}
      />
    </Fragment>
  );
};

export default hot(App);
