// Bundles the embeddable website chat widget into public/widget/v1.js.
//
//   node scripts/build-widget.mjs          one-off production build
//   node scripts/build-widget.mjs --watch  rebuild on change (development)
//
// Next serves everything in public/, so the script is available at
// https://<your-domain>/widget/v1.js with no extra server.
import { build, context } from 'esbuild';
import { gzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';

const watch = process.argv.includes('--watch');
const outfile = 'public/widget/v1.js';

const options = {
  entryPoints: ['widget/src/index.ts'],
  outfile,
  bundle: true,
  format: 'iife',
  platform: 'browser',
  // Broad browser support for customers' visitors.
  target: ['es2019', 'chrome80', 'firefox78', 'safari13'],
  minify: !watch,
  sourcemap: watch ? 'inline' : false,
  legalComments: 'none',
  banner: { js: '/* Website chat widget */' },
  logLevel: 'info',
};

if (watch) {
  const ctx = await context(options);
  await ctx.watch();
} else {
  await build(options);
  const bytes = readFileSync(outfile);
  console.log(`widget: ${(bytes.length / 1024).toFixed(1)} KB, ${(gzipSync(bytes).length / 1024).toFixed(1)} KB gzipped`);
}
