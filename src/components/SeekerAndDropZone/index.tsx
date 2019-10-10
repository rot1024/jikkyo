/** @jsx jsx */
import React, { useEffect, useRef, useCallback, useState } from "react";
import { css, jsx } from "@emotion/core";

const scrollWidth = 1000000;

export interface Props {
  className?: string;
  seekable?: boolean;
  droppable?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
  onSeek?: (t: number, relative?: boolean) => void;
  onDrop?: (file: File) => void;
}

const SeekerAndDropZone: React.FC<Props> = ({
  className,
  seekable,
  droppable,
  onClick,
  onDoubleClick,
  onSeek,
  onDrop
}) => {
  const seeker = useRef<HTMLDivElement>(null);
  const seekerTimeout = useRef(0);
  const seekerPrevScroll = useRef(scrollWidth / 2);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (seekerTimeout.current) {
        window.clearTimeout(seekerTimeout.current);
        seekerTimeout.current = 0;
      }
      const delta = e.currentTarget.scrollLeft - seekerPrevScroll.current;
      seekerPrevScroll.current = e.currentTarget.scrollLeft;
      seekerTimeout.current = window.setTimeout(() => {
        if (!seeker.current) return;
        seekerPrevScroll.current = scrollWidth / 2;
        seeker.current.scrollLeft = scrollWidth / 2;
        seekerTimeout.current = 0;
      }, 1000);
      if (onSeek) {
        onSeek(delta * 100, true);
      }
    },
    [onSeek]
  );

  const [dropping, setDropping] = useState(false);
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDropping(false);
      if (!droppable || !onDrop || e.dataTransfer.files.length === 0) return;
      const file = e.dataTransfer.files[0];
      if (
        file.type.indexOf("text/xml") === 0 ||
        file.type.indexOf("application/xml") === 0 ||
        file.type.indexOf("video/") === 0
      ) {
        onDrop(file);
      }
    },
    [droppable, onDrop]
  );
  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!droppable) return;
      setDropping(true);
    },
    [droppable]
  );
  const handleDragLeave = useCallback(() => {
    setDropping(false);
  }, []);

  return (
    <div
      ref={seeker}
      onScroll={handleScroll}
      className={className}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      css={css`
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        overflow-y: ${seekable ? "scroll" : "hidden"};
        border: 10px dotted transparent;
        transition: all 0.2s ease-in-out;
        ${dropping &&
          css`
            border-color: #ffbe4680;
            background-color: #ffcd5c50;
          `}

        &::-webkit-scrollbar {
          display: none;
        }
      `}
    >
      <div
        css={css`
          width: ${scrollWidth}px;
          height: 100%;
          pointer-events: none;
        `}
      />
    </div>
  );
};

export default SeekerAndDropZone;
