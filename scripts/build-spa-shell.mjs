// Post-build: generate dist/spa-shell.html — a stripped client-only shell
// HTML that loads the same compiled JS bundles as the prerendered pages but
// has no server-rendered content. Vercel rewrites all non-prerendered routes
// (auth, /dashboard, /project/*, /admin/*, etc.) to this shell so React 19
// can do a clean CSR boot without a hydration mismatch (React error #418).
//
// Without this fix, /dashboard refreshes were served the prerendered homepage
// HTML, causing a hydration crash and a forced full client re-render plus
// ~30 lazy-chunk waterfalls — appearing to the user as a multi-second hang.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, "..", "dist");
const srcPath = resolve(distDir, "index.html");
const outPath = resolve(distDir, "spa-shell.html");

if (!existsSync(srcPath)) {
  console.warn("[build-spa-shell] dist/index.html not found — skipping.");
  process.exit(0);
}

let html = readFileSync(srcPath, "utf8");

// 1) Strip everything inside <div id="root">...</div> — including SSR'd
//    <title>, <meta>, JSON-LD, and the rendered React app — and replace with
//    the same boot loader markup we use in index.html.
const bootLoader = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background-color: #0a0a0f; color: #a0a0a0; font-family: system-ui, -apple-system, sans-serif;">
        <div style="text-align: center;">
          <div style="width: 40px; height: 40px; border: 3px solid #333; border-top-color: #6366f1; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px;"></div>
          <div style="font-size: 14px;">Loading…</div>
        </div>
      </div>`;

// Locate <div id="root" ...> ... </div> as the slice from the opening tag
// up to (and including) the matching closing </div> that sits immediately
// before the SSG hash <script>. The prerendered HTML always has the shape:
//   <div id="root" data-server-rendered="true">…app…</div><script>window.__VITE_REACT_SSG_HASH__=…</script>
const rootStart = html.indexOf('<div id="root"');
const hashScript = html.indexOf("<script>window.__VITE_REACT_SSG_HASH__");
if (rootStart === -1 || hashScript === -1 || hashScript < rootStart) {
  console.error("[build-spa-shell] could not locate root container; aborting.");
  process.exit(1);
}
// Walk back from hashScript to the nearest </div>
const closeIdx = html.lastIndexOf("</div>", hashScript);
const rootEnd = closeIdx + "</div>".length;
html =
  html.slice(0, rootStart) +
  `<div id="root">${bootLoader}\n    </div>` +
  html.slice(rootEnd);

// 2) Remove the SSR marker so vite-react-ssg's client entry does not attempt
//    hydration against the (now empty) root.
html = html.replace(/\sdata-server-rendered="true"/g, "");

// 3) Drop the prerendered static loader hash + manifest hint — irrelevant
//    for non-prerendered routes and would just trigger a wasted manifest fetch.
html = html.replace(
  /<script>window\.__VITE_REACT_SSG_HASH__[\s\S]*?<\/script>/,
  ""
);

writeFileSync(outPath, html, "utf8");
console.log("[build-spa-shell] wrote", outPath);
