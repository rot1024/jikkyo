/** @jsx jsx */
import React, { Fragment, useState, useCallback, useRef, useMemo } from "react";
import { css, jsx } from "@emotion/core";
import { hot } from "react-hot-loader/root";
import { Global } from "@emotion/core";
import { useLocalStorage } from "react-use";
import useFileInput from "use-file-input";

import globalStyles from "./styles";
import loadComment, { Comment } from "./util/commentLoader";
import Video, { EventType, Methods } from "./components/Video";
import SeekerAndDropZone from "./components/SeekerAndDropZone";
import Controller from "./components/Controller";
import SettingPanel, {
  Settings,
  defaultSettings
} from "./components/SettingPanel";
import CommentArea, { CommentStyle } from "./components/CommentArea";

const safari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const ios = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);
const regexp = (p?: string) => {
  if (!p) return undefined;
  let r;
  try {
    r = new RegExp(p);
  } catch (e) {
    return undefined;
  }
  return r;
};

const App: React.FC = () => {
  const videoRef = useRef<Methods>(null);
  const [src, setSrc] = useState<string>();
  const [comments, setComments] = useState<{
    comments: Comment[];
    lastVpos: number;
  }>();
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [timeRanges, setTimeRanges] = useState<[number, number][]>();
  const [controllerHidden, setControllerHidden] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const handleVideoClick = useCallback(() => setControllerHidden(p => !p), []);
  const handlePlayButtonClick = useCallback(() => {
    if (!comments || (duration === 0 && comments.lastVpos === 0)) return;
    if (videoRef.current && src) {
      setPlaying(videoRef.current.toggle());
    } else {
      setPlaying(p => !p);
    }
  }, [comments, duration, src]);
  const handleVideoEvent = useCallback(
    (e: EventType, ct: number, d: number, buffered: TimeRanges) => {
      if (e === "load") {
        setPlaying(false);
      } else if (e === "progress") {
        setTimeRanges(
          new Array(buffered.length)
            .fill(0)
            .map((e, i) => [buffered.start(i) * 1000, buffered.end(i) * 1000])
        );
      } else if (e === "pause") {
        setPlaying(false);
      } else if (e === "play") {
        setPlaying(true);
      }
      setCurrentTime(ct * 1000);
      setDuration(d * 1000);
    },
    []
  );
  const handleSeek = useCallback(
    (t: number, relative?: boolean) => {
      if (!comments || comments.lastVpos === 0) return;
      if (videoRef.current && src) {
        if (relative) {
          videoRef.current.seekRelative(t / 1000);
        } else {
          videoRef.current.seek(t / 1000);
        }
      } else {
        setCurrentTime(t2 => (relative ? t + t2 : t));
      }
    },
    [comments, src]
  );
  const handleDrop = useCallback(async (file: File) => {
    if (file.type.indexOf("video/") === 0) {
      setSrc(URL.createObjectURL(file));
      setPlaying(false);
      setCurrentTime(0);
    }
    if (
      file.type.indexOf("text/xml") === 0 ||
      file.type.indexOf("application/xml") === 0
    ) {
      const comments = await loadComment(file);
      setComments(comments);
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
      duration: settings.commentDuration,
      ueshitaDuration: settings.ueShitaCommentDuration,
      fontSize: settings.fontSize,
      rows: settings.rows,
      sizing: settings.sizeCalcMethod
      // fontFamily: settings.fontFamily,
      // fontWeight: settings.fontWeight,
      // lineHeight: settings.lineHeight,
      // bigSizeScale: settings.bigSizeScale,
      // smallSizeScale: settings.smallSizeScale,
    }),
    [
      settings.commentDuration,
      settings.fontSize,
      settings.rows,
      settings.sizeCalcMethod,
      settings.ueShitaCommentDuration
    ]
  );
  const thinning = useMemo<[number, number] | undefined>(() => {
    if (!settings.devision) return undefined;
    const denominator = parseInt(settings.devision, 10);
    if (isNaN(denominator) || denominator === 1) return undefined;
    const numeratorStr =
      denominator === 2
        ? settings.devision2 || 1
        : denominator === 3
        ? settings.devision3 || 1
        : denominator === 5
        ? settings.devision5 || 1
        : undefined;
    if (!numeratorStr) return undefined;
    const numerator = parseInt(numeratorStr, 10);
    if (isNaN(numerator)) return undefined;
    return [numerator, denominator];
  }, [
    settings.devision,
    settings.devision2,
    settings.devision3,
    settings.devision5
  ]);
  const muteKeywords = useMemo(() => regexp(settings.muteKeywords), [
    settings.muteKeywords
  ]);
  const filterKeywords = useMemo(() => regexp(settings.filterKeywords), [
    settings.filterKeywords
  ]);

  return (
    <Fragment>
      <Global styles={globalStyles} />
      <Video ref={videoRef} src={src} onEvent={handleVideoEvent} />
      <CommentArea
        comments={comments ? comments.comments : undefined}
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
      />
      <SeekerAndDropZone
        seekable={duration > 0}
        droppable
        onSeek={handleSeek}
        onDrop={handleDrop}
        onClick={handleVideoClick}
        onDoubleClick={handlePlayButtonClick}
      />
      <Controller
        hidden={controllerHidden}
        playing={playing}
        onPlayButtonClick={handlePlayButtonClick}
        onSeek={handleSeek}
        onVideoButtonClick={handleVideoOpen}
        onCommentButtonClick={handleCommentOpen}
        onMenuButtonClick={() => {
          if (!menuVisible) setMenuVisible(true);
        }}
        currentTime={currentTime}
        duration={comments ? comments.lastVpos : duration}
        buffered={timeRanges}
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
      />
    </Fragment>
  );
};

export default hot(App);
