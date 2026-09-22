# Verya website

The public landing page for Verya, leading with the Knowledge Engine pilot.

The page shows the product instead of describing it: text fades as it scrolls away, five lines stay highlighted, and the ending ("Session ended.") shows what was kept. The background colour follows the story from afternoon to night to sunrise.

## Files

| File | What it is |
|---|---|
| `index.html` | The whole page: styles, markup and script in one file. Written as a page body (no `<html>`/`<head>`), so it can also be published as a Claude artifact. |
| `../../tools/build-site.mjs` | Wraps `index.html` in a full HTML document and writes `dist/`. |
| `../../tools/screenshots.mjs` | Captures `docs/screenshots/` with headless Chrome. |
| `../../.github/workflows/site.yml` | Builds on every PR, deploys to GitHub Pages on push to `main`. |

## Run it locally

```bash
node tools/build-site.mjs
# then open dist/index.html in a browser
```

Needs Node 22 or later. No dependencies to install.

## Regenerate screenshots

```bash
node tools/build-site.mjs
node tools/screenshots.mjs
```

Uses your local Chrome or Edge. Set `CHROME=/path/to/chrome` if it isn't found.

## The pilot form

- **In the Claude artifact preview**, applications are saved to the artifact's private database.
- **On GitHub Pages**, the form opens the visitor's email app with the application filled in. Set the destination on the form element before going live:

  ```html
  <form id="pilot-form" data-pilot-email="pilots@your-domain.com" novalidate>
  ```

  While `data-pilot-email` is empty, submitting shows a message saying online applications aren't open yet.

A proper submit endpoint will replace this once the Verya control plane API exists.

## Things to know before sharing it

- The security section describes the platform as designed in `docs/platform/`. It is not built yet.
- "About 2¾ hours back per engineer, per week" is an estimate from the Knowledge Engine design docs, and the page labels it as one.
- `priya.k`, Priya and Marcus are fictional.
- The page uses its own colours on purpose and does not follow the visitor's light or dark mode. With reduced motion turned on, the drifting text, blur and letter fades are switched off.
