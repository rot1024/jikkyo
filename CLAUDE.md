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
- Uses Vite with React plugin and Emotion support
- TypeScript configuration optimized for Vite
- Project references for separate build configurations

## Architecture Overview

### Core State Management Hooks
The application is built around three main custom hooks that manage the core state:

1. **useVideo** (`src/use-video.ts`) - Manages video playback state, file loading, time synchronization
2. **useComment** (`src/use-comment.ts`) - Handles comment data loading, filtering, time correction, and influence calculation
3. **useConfig** (`src/use-config.ts`) - Manages user settings and preferences

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

### Key Features
- **Dual Mode Operation**: Works with or without video files
- **Time Synchronization**: Comments can be time-corrected using hotkeys (`,` `-1s`, `.` `+1s`, `/` `reset`)
- **Comment Filtering**: Keyword-based filtering and muting
- **Display Modes**: Multiple rendering approaches (DOM-based, Canvas2D)
- **Heat Map**: Visual representation of comment density over time

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

- Built with Vite + React 18 + TypeScript
- Uses modern React features (createRoot, automatic JSX runtime)
- Emotion 11 for CSS-in-JS styling with automatic JSX transform
- Comment time is handled in milliseconds internally
- Video time synchronization converts between seconds (video API) and milliseconds (internal state)
- Hot Module Replacement (HMR) provided by Vite for fast development

## Commit Message Style

Use simple, one-line commit messages following the project's existing style:
- `add feature description`
- `fix issue description` 
- `update component behavior`
- `migrate from X to Y`