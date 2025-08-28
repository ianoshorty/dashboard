import { readFile, writeFile, mkdir, cp } from 'fs/promises';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import esbuild from 'esbuild';
import { minify as minifyHtml } from 'html-minifier-terser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = __dirname;
const srcDir = resolve(root, 'src');

const variants = ['separate', 'inline', 'inline-min'];
const mode = process.argv[2] && variants.includes(process.argv[2]) ? process.argv[2] : 'separate';

const distDir = resolve(root, 'dist');
const outDir = {
  'separate': resolve(distDir, 'separate'),
  'inline': resolve(distDir, 'inline'),
  'inline-min': resolve(distDir, 'inline-min'),
}[mode];

async function ensureDir(path) {
  await mkdir(path, { recursive: true });
}

function sanitizeInlineJs(js) {
  // Prevent </script> from prematurely ending the script tag
  return js.replace(/<\/_?script>/gi, '<\\/script>');
}

async function bundleJS(minify = false) {
  const result = await esbuild.build({
    entryPoints: [resolve(srcDir, 'main.js')],
    bundle: true,
    minify,
    sourcemap: !minify,
    format: 'iife',
    write: false,
    target: ['es2019'],
  });
  return result.outputFiles[0].text;
}

function minifyCss(css) {
  return css
    .replace(/\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([:;{},])\s*/g, '$1')
    .trim();
}

async function buildSeparate() {
  await ensureDir(outDir);
  await cp(resolve(srcDir, 'index.html'), resolve(outDir, 'index.html'));
  await cp(resolve(srcDir, 'styles.css'), resolve(outDir, 'styles.css'));
  const js = await bundleJS(false);
  await writeFile(resolve(outDir, 'main.js'), js, 'utf8');
}

async function buildInline(minified = false) {
  await ensureDir(outDir);
  let html = await readFile(resolve(srcDir, 'index.html'), 'utf8');
  const css = await readFile(resolve(srcDir, 'styles.css'), 'utf8');
  html = html.replace('<link rel="stylesheet" href="./styles.css" />', `<style>${minified ? minifyCss(css) : css}</style>`);
  const js = await bundleJS(minified);
  html = html.replace('<script src="./main.js"></script>', `<script>${sanitizeInlineJs(js)}</script>`);
  html = await inlineExternalAssets(html, minified);

  if (minified) {
    try {
      html = await minifyHtml(html, {
        collapseWhitespace: true,
        conservativeCollapse: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeEmptyAttributes: false,
        keepClosingSlash: true,
        caseSensitive: true,
        minifyCSS: false,
        minifyJS: false,
        sortAttributes: false,
        sortClassName: false,
      });
    } catch (err) {
      console.warn('HTML minification failed, emitting unminified HTML shell:', err.message);
    }
  }
  await writeFile(resolve(outDir, 'index.html'), html, 'utf8');
}

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return await res.text();
}

async function inlineExternalAssets(html, minified) {
  const leafletCssMatch = html.match(/<link rel=\"stylesheet\" href=\"(https:\/\/unpkg\.com\/leaflet@[^\"]+)\"[^>]*>/);
  if (leafletCssMatch) {
    const css = await fetchText(leafletCssMatch[1]);
    html = html.replace(leafletCssMatch[0], `<style>${minified ? minifyCss(css) : css}</style>`);
  }
  const leafletJsMatch = html.match(/<script src=\"(https:\/\/unpkg\.com\/leaflet@[^\"]+)\"[^>]*><\/script>/);
  if (leafletJsMatch) {
    const js = await fetchText(leafletJsMatch[1]);
    html = html.replace(leafletJsMatch[0], `<script>${sanitizeInlineJs(js)}</script>`);
  }
  const chartJsMatch = html.match(/<script src=\"(https:\/\/cdn\.jsdelivr\.net\/npm\/chart\.js@[^\"]+)\"[^>]*><\/script>/);
  if (chartJsMatch) {
    const js = await fetchText(chartJsMatch[1]);
    html = html.replace(chartJsMatch[0], `<script>${sanitizeInlineJs(js)}</script>`);
  }
  // IMPORTANT: Do NOT inline lucide; keep CDN to ensure window.lucide global.
  // const lucideJsMatch = html.match(/<script src=\"(https:\/\/unpkg\.com\/lucide@[^\"]+)\"[^>]*><\/script>/);
  // if (lucideJsMatch) { /* skip inlining */ }

  // Do NOT inline Tailwind CDN; keep external.

  const fontLinkMatch = html.match(/<link href=\"(https:\/\/fonts\.googleapis\.com\/css2[^\"]+)\" rel=\"stylesheet\">/);
  if (fontLinkMatch) {
    const css = await fetchText(fontLinkMatch[1]);
    html = html.replace(fontLinkMatch[0], `<style>${css}</style>`);
  }
  return html;
}

(async () => {
  if (mode === 'separate') {
    await buildSeparate();
  } else if (mode === 'inline') {
    await buildInline(false);
  } else if (mode === 'inline-min') {
    await buildInline(true);
  }
  console.log(`Built: ${mode} -> ${outDir}`);
})();
