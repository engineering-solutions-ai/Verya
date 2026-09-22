// Captures screenshots of the marketing site at each point in its story.
//
// The page is scroll-driven (colour, fading, kept lines), so a plain
// full-page capture shows nothing useful. This drives headless Chrome over
// the DevTools protocol, scrolls like a reader, and captures the viewport.
//
// Usage:
//   node tools/build-site.mjs
//   node tools/screenshots.mjs            # writes docs/screenshots/*.png
//   CHROME="/path/to/chrome" node tools/screenshots.mjs
//
// Needs Node 22+ (built-in fetch and WebSocket) and a local Chrome or Edge.

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpdir } from "node:os";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const page = pathToFileURL(join(root, "dist", "index.html")).href;
const outDir = join(root, "docs", "screenshots");
const port = 9333;

const candidates = [
  process.env.CHROME,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);
const chromePath = candidates.find((p) => existsSync(p));
if (!chromePath) throw new Error("No Chrome found. Set CHROME=/path/to/chrome.");
if (!existsSync(join(root, "dist", "index.html"))) throw new Error("Run node tools/build-site.mjs first.");

// Each shot: file name, viewport, and which section to scroll to (by index
// among [data-bg] sections) plus a pixel offset. No section = top of page.
const shots = [
  { name: "01-opening", w: 1440, h: 900 },
  { name: "02-afternoon", w: 1440, h: 900, section: 1, offset: -80 },
  { name: "03-dusk", w: 1440, h: 900, section: 2, offset: 0 },
  { name: "04-night", w: 1440, h: 900, section: 3, offset: -60 },
  { name: "05-knowledge-engine", w: 1440, h: 900, section: 4, offset: -40 },
  { name: "06-security-memo", w: 1440, h: 900, section: 5, offset: 40 },
  { name: "07-session-ended", w: 1440, h: 900, section: 6, offset: -40 },
  { name: "08-kept-lines", w: 1440, h: 900, section: 6, offset: 380 },
  { name: "09-pilot-form", w: 1440, h: 900, section: 7, offset: 0 },
  { name: "10-phone-opening", w: 400, h: 860 },
  { name: "11-phone-story", w: 400, h: 860, section: 1, offset: 20 },
];

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = join(tmpdir(), "verya-screenshots-profile");
const chrome = spawn(chromePath, [
  "--headless=new", "--disable-gpu", "--hide-scrollbars",
  `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "about:blank",
], { stdio: "ignore" });

let ws, nextId = 0;
const pending = new Map();
function send(method, params = {}) {
  return new Promise((resolve) => {
    const id = ++nextId;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function connect() {
  for (let i = 0; i < 60; i++) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      const target = targets.find((t) => t.type === "page");
      if (target) return target.webSocketDebuggerUrl;
    } catch { /* Chrome still starting */ }
    await wait(250);
  }
  throw new Error("Chrome did not start.");
}

// Scroll in small steps so the page's keep/fade/colour logic runs as it
// would for a reader, instead of jumping straight to the target.
const scrollScript = (section, offset) => `(async () => {
  const el = document.querySelectorAll('[data-bg]')[${section}];
  const target = el.getBoundingClientRect().top + scrollY + ${offset};
  for (let y = scrollY; y < target; y += 110) { scrollTo(0, y); await new Promise(r => setTimeout(r, 70)); }
  scrollTo(0, target);
})()`;

try {
  ws = new WebSocket(await connect());
  await new Promise((r) => (ws.onopen = r));
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result); pending.delete(msg.id); }
  };
  mkdirSync(outDir, { recursive: true });

  for (const shot of shots) {
    await send("Emulation.setDeviceMetricsOverride", { width: shot.w, height: shot.h, deviceScaleFactor: 1, mobile: shot.w < 600 });
    await send("Page.navigate", { url: page });
    await wait(4000); // fonts, and the headline's forgotten letters
    if (shot.section != null) {
      await send("Runtime.evaluate", { expression: scrollScript(shot.section, shot.offset ?? 0), awaitPromise: true });
      await wait(1800); // let highlight and fade transitions settle
    }
    const { data } = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(join(outDir, `${shot.name}.png`), Buffer.from(data, "base64"));
    console.log(`docs/screenshots/${shot.name}.png`);
  }
} finally {
  ws?.close();
  chrome.kill();
  await wait(300);
  rmSync(profile, { recursive: true, force: true, maxRetries: 3 });
}
