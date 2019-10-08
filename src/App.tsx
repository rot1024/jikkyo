/** @jsx jsx */
import React, { Fragment, useState, useCallback, useRef, useMemo } from "react";
import { css, jsx } from "@emotion/core";
import { hot } from "react-hot-loader/root";
import { Global } from "@emotion/core";
import { useLocalStorage } from "react-use";
import useFileInput from "use-file-input";
import { useHotkeys } from "react-hotkeys-hook";

import globalStyles from "./styles";
import loadComment, { Comment } from "./util/commentLoader";
import Video, { EventType, Methods } from "./components/Video";
import Controller from "./components/Controller";
import SettingPanel, {
  Settings,
  defaultSettings
} from "./components/SettingPanel";
import CommentArea, { CommentStyle } from "./components/CommentArea";

const safari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const ios = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);

const App: React.FC = () => {
  const videoRef = useRef<Methods>(null);
  const [src, setSrc] = useState<string>();
  const [comments, setComments] = useState<Comment[]>();
  const [canPlay, setCanPlay] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
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
    if (!videoRef.current) return;
    if (relative) {
      videoRef.current.seekRelative(t);
    } else {
      videoRef.current.seek(t);
    }
  }, []);
  const handleVideoOpen = useFileInput(
    files => {
      if (files.length === 0) return;
      const url = URL.createObjectURL(files[0]);
      setSrc(url);
      setPlaying(false);
      setCurrentTime(0);
    },
    { accept: !safari || ios ? "video/*" : "*", multiple: ios }
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
  const [settings, setSettings] = useLocalStorage<Settings>(
    "jikkyo_settings",
    defaultSettings
  );
  const styles = useMemo<CommentStyle>(
    () => ({
      // bigSizeScale: settings.bigSizeScale,
      // smallSizeScale: settings.smallSizeScale,
      duration: settings.commentDuration,
      ueshitaDuration: settings.ueShitaCommentDuration,
      ...(settings.commentOpacity
        ? { opacity: settings.commentOpacity / 100 }
        : {}),
      ...(settings.danmakuCommentOpacity
        ? { opacityDanmaku: settings.danmakuCommentOpacity / 100 }
        : {}),
      fontSize: settings.fontSize,
      rows: settings.rows,
      sizing: settings.sizeCalcMethod
      // fontFamily: settings.fontFamily,
      // fontWeight: settings.fontWeight,
      // lineHeight: settings.lineHeight,
    }),
    [settings]
  );

  useHotkeys("space", handlePlayButtonClick);

  return (
    <Fragment>
      <Global styles={globalStyles} />
      <Video
        ref={videoRef}
        src={src}
        onTimeUpdate={setCurrentTime}
        onEvent={handleVideoEvent}
      />
      <CommentArea
        comments={comments}
        currentTime={currentTime * 1000}
        duration={duration}
        playing={playing}
        onSeek={handleSeek}
        onClick={handleVideoClick}
        onDoubleClick={handlePlayButtonClick}
        styles={styles}
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
        initialSettings={settings}
        onClose={handleMenuClose}
        onChange={setSettings}
        debounce
      />
    </Fragment>
  );
};

export default hot(App);
