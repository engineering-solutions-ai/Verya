// Builds the static marketing site into dist/.
//
// apps/web/index.html is authored as a page body (title, styles, markup,
// script) so it can also be published as a Claude artifact, which supplies
// its own document shell. Standalone hosting such as GitHub Pages needs that
// shell, so this script adds the doctype, charset and viewport before copying.
//
// Usage: node tools/build-site.mjs

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "apps", "web", "index.html");
const out = join(root, "dist");

const page = readFileSync(src, "utf8");
if (/<html[\s>]/i.test(page)) {
  throw new Error("apps/web/index.html already has an <html> tag; it should be a page body only.");
}

const shell =
  "<!doctype html>\n" +
  '<html lang="en">\n' +
  "<head>\n" +
  '<meta charset="utf-8">\n' +
  '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
  '<meta name="color-scheme" content="light">\n';

mkdirSync(out, { recursive: true });
writeFileSync(join(out, "index.html"), shell + page + "\n</html>\n");
// GitHub Pages: serve files as-is, no Jekyll processing.
writeFileSync(join(out, ".nojekyll"), "");
console.log("built dist/index.html");
