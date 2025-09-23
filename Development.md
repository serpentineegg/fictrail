# FicTrail Development

## Prerequisites
- Node.js 18+ (recommended)
- npm

## Install dependencies (optional but recommended)
```bash
npm install
```
This installs dev tooling (ESLint). The build itself has no runtime dependencies.

## Build
- Basic build (writes `dist/script.user.js` and copies `script-info.md`):
```bash
npm run build
```

- Build and copy the output to your clipboard:
```bash
npm run build:clipboard
```

- Help:
```bash
node build.js --help
```

After building, open `dist/script.user.js` in your browser to install it into Tampermonkey.

There is a convenience watcher script that rebuilds on file changes. It requires `nodemon`:
```bash
npm i -D nodemon
npm run watch
```

## Linting
```bash
npm run lint
npm run lint:fix
```

## Template injection notes
During build, the HTML and CSS templates from `src/templates/` are injected into the source files:

- `src/modules/ui.js` must contain a placeholder line using a template string:
```js
fictrailDiv.innerHTML = '<!-- This will be replaced by build script -->';
```

- `src/modules/styles.js` must contain a placeholder constant using a template string:
```js
const css = '/* This will be replaced by build script */';
```

The build script (`build.js`) replaces those blocks with the contents of:
- `src/templates/fictrail-overlay.html`
- `src/templates/fictrail-styles.css`