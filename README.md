# jikkyo-web

Video player that displays NicoNico-style synchronized comments. Load a video file and an XML (or asobistage JSON) comment file, or play comments without a video. Files can be opened from the buttons or dropped onto the window (a video and a comment file can be dropped together).

## Requirements

- Node.js 22.12 or later

## Scripts

- `npm run dev` - Start the dev server on http://localhost:3000
- `npm run build` - Type check and build for production into `dist`
- `npm run preview` - Preview the production build
- `npm test` - Run tests in watch mode (`npm run test:run` to run once)
- `npm run lint` - Run ESLint
- `npm run check` - Run typecheck, lint, and tests

## Deployment

- GitHub Pages: pushing to `main` builds with `BASE_PATH=/jikkyo/` and deploys via GitHub Actions (`.github/workflows/pages.yml`)
- Netlify: builds with `npm run build` and serves `dist` at the root (configured on Netlify)

## Hotkeys

- `←` / `→` - Seek -10s / +10s (`Shift` for -1s / +1s)
- `Space` - Play / pause
- `,` / `.` / `/` - Comment time correction -1s / +1s / reset
- `Esc` - Close the settings panel
