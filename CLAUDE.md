# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React-based video player application called "jikkyo-web" that displays synchronized comments on videos, similar to NicoNico-style live commenting. The app allows users to:

- Load video files and XML comment files
- Display comments synchronized with video playback
- Support both with/without video mode (comments can play independently)
- Customize comment display (opacity, filtering, styles)
- Export comment data in various formats

## Development Commands

### Core Commands
- `npm run dev` - Start Vite development server on http://localhost:3000
- `npm run build` - Build for production (TypeScript check + Vite build)
- `npm run preview` - Preview production build
- `npm run test` - Run tests with Vitest (watch mode)
- `npm run test:run` - Run tests once
- `npm run typecheck` - Run TypeScript type checking without emitting files
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run check` - Run typecheck, lint, and tests (CI/CD friendly)

### Build Configuration
- `BASE_PATH` env sets Vite `base` (GitHub Pages uses `/jikkyo/`; default `/` for Netlify)
- GitHub Pages is deployed by `.github/workflows/pages.yml` on push to `main`
- Uses Vite with React plugin and Emotion support
- TypeScript configuration optimized for Vite
- Project references for separate build configurations

## Architecture Overview

### Core State Management Hooks
The application is built around these custom hooks that manage the core state:

1. **useVideo** (`src/use-video.ts`) - Manages the video element: file loading, duration, buffered ranges
2. **usePlayback** (`src/use-playback.ts`) - Single source of truth for playback time and play/pause. `getTime()` returns the video time, or a wall-clock based time without a video. `time` is a throttled copy for UI held in an external store (`util/timeStore.ts`) so that frequent updates re-render only subscribers (e.g. Controller via `useTime`)
3. **useComment** (`src/use-comment.ts`) - Handles comment data loading, filtering, time correction, and influence calculation
4. **useConfig** (`src/use-config.ts`) - Manages user settings and preferences

### Component Structure
- **App.tsx** - Main component orchestrating all functionality
- **Video** - Video player wrapper with custom controls
- **CommentArea** - Renders comments with multiple display modes (DOM, Canvas2D)
- **Controller** - Playback controls, seekbar, and heat map visualization
- **SettingPanel** - Configuration UI for all app settings
- **SeekerAndDropZone** - Drag-and-drop interface and seek functionality

### Comment System
Comments are loaded from XML files (NicoNico format) and processed by `util/commentLoader.ts`:
- Parses XML chat data with attributes (vpos, mail commands, colors)
- Supports NicoNico color names and hex colors
- Calculates comment influence/density for heat map visualization
- Handles time correction and synchronization

### Comment Rendering
- `CommentArea` lays out comments into chats (`commentsToChats`), sorted by vpos; selection per frame uses binary search (`getVisibleChats`), so chats must stay sorted
- `Canvas2DRenderer` runs its own requestAnimationFrame loop while playing and reads the time via `getFrame()` every frame; do not drive per-frame rendering through React state
- Each chat is pre-rendered (text + outline) into a sprite atlas (`spriteAtlas.ts`: shared 2048px pages, batched by the GPU) and blitted each frame. Pages in use are never cleared; when the atlas is full, sprites fall back to their own canvases. Many separate sprite canvases caused dropped video frames
- Auto sizing (default, `autoRows.ts`): when comments are loaded, the 90th percentile of the number of scrolling comments on screen and the median comment width give the number of rows, clamped to min/max rows. Bursts above it may overlap by design

### Key Features
- **Dual Mode Operation**: Works with or without video files
- **Time Synchronization**: Comments can be time-corrected using hotkeys (`,` `-1s`, `.` `+1s`, `/` `reset`) or the "Comment offset" slider in the menu. Internally `commentTimeCorrection` is added to the playback time (negative = comments later); the slider shows the opposite sign (positive = later)
- **Comment Filtering**: Keyword-based filtering and muting
- **Display Modes**: Canvas2D renderer (an incomplete DOM renderer also exists but is unused)
- **Heat Map**: Visual representation of comment density over time
- **Highlights** (`util/highlights.ts`): detects comment surges (5s window vs. median rate of the previous minute, Poisson z-score) and busy windows (≥50% of the busiest, matching red on the heat map); consecutive windows form one region with one highlight at its onset. Shown as seekbar markers, a list in the menu, and `[` / `]` hotkeys (matched by produced key for JIS keyboards)

## File Organization

### Core Logic
- `src/use-*.ts` - Custom hooks for state management
- `src/util/` - Utility functions and comment processing
- `src/components/` - UI components organized by feature

### Styling
- Uses Emotion CSS-in-JS for styling
- Global styles in `src/styles.tsx`
- Component-specific styles often inline with css`` template literals

## Development Notes

- Built with Vite 8 + React 19 + TypeScript 6
- Uses modern React features (createRoot, automatic JSX runtime)
- Emotion 11 for CSS-in-JS styling with automatic JSX transform
- Comment time is handled in milliseconds internally
- Video time synchronization converts between seconds (video API) and milliseconds (internal state)
- Hot Module Replacement (HMR) provided by Vite for fast development
- ESLint flat config with `eslint-plugin-react-hooks` v7 (React Compiler rules): avoid setState in effects and reading/writing refs during render; prefer derived values (`useMemo`) or the "adjust state during render" pattern
- react-hotkeys-hook v5 matches `event.code` by default, so use key names like `comma`, `period`, `slash` instead of literal characters
- TypeScript is pinned to 6.0.x because typescript-eslint does not yet support TypeScript 7

## Commit Message Style

Use simple, one-line commit messages following the project's existing style:
- `add feature description`
- `fix issue description` 
- `update component behavior`
- `migrate from X to Y`