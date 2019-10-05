/** @jsx jsx */
import React, { Fragment, useState, useCallback, useRef } from "react";
import { css, jsx } from "@emotion/core";
import { hot } from "react-hot-loader/root";
import { Global } from "@emotion/core";
import useFileInput from "use-file-input";
import { useHotkeys } from "react-hotkeys-hook";

import globalStyles from "./styles";
import Video, { EventType, Methods } from "./components/Video";
import Controller from "./components/Controller";

const App: React.FC = () => {
  const videoRef = useRef<Methods>(null);
  const [src, setSrc] = useState<string>();
  const [canPlay, setCanPlay] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>();
  const [seekTime, setSeekTime] = useState<number>();
  const [duration, setDuration] = useState<number>();
  const [controllerHidden, setControllerHidden] = useState(false);
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
  const handleOpen = useFileInput(
    files => {
      if (files.length === 0) return;
      const url = URL.createObjectURL(files[0]);
      setSrc(url);
    },
    { accept: "video/*", multiple: true }
  );

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
        onClick={handleVideoClick}
      />
      <Controller
        hidden={controllerHidden}
        playing={playing}
        canPlay={canPlay}
        onPlayButtonClick={handlePlayButtonClick}
        onSeek={setSeekTime}
        onMenuButtonClick={handleOpen}
        currentTime={currentTime}
        duration={duration}
        css={css`
          position: fixed;
          bottom: 0;
        `}
      />
    </Fragment>
  );
};

export default hot(App);
