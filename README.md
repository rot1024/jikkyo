# jikkyo-web

Video player that displays NicoNico-style synchronized comments. Load a video file and an XML (or asobistage JSON) comment file, or play comments without a video.

## Requirements

- Node.js 22.12 or later

## Scripts

- `npm run dev` - Start the dev server on http://localhost:3000
- `npm run build` - Type check and build for production into `dist`
- `npm run preview` - Preview the production build
- `npm test` - Run tests in watch mode (`npm run test:run` to run once)
- `npm run lint` - Run ESLint
- `npm run check` - Run typecheck, lint, and tests

## Hotkeys

- `←` / `→` - Seek -10s / +10s (`Shift` for -1s / +1s)
- `Space` - Play / pause
- `,` / `.` / `/` - Comment time correction -1s / +1s / reset
- `Esc` - Close the settings panel
