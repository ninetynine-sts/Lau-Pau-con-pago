// Empaqueta la demo: reutiliza componentes y librerías del repo real con unos pocos sustitutos.
import { build } from 'esbuild';
import { cpSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const OUT = join(HERE, 'dist');

const alias = {
  'next/navigation': join(HERE, 'shims/next-navigation.ts'),
  'next/link': join(HERE, 'shims/next-link.tsx'),
  '@/app/actions/shop': join(HERE, 'mock/actions.ts'),
  'server-only': join(HERE, 'shims/empty.ts')
};

const plugin = {
  name: 'demo-alias',
  setup(b) {
    b.onResolve({ filter: /.*/ }, (args) => {
      if (alias[args.path]) return { path: alias[args.path] };
      if (args.path.startsWith('@/')) {
        const base = resolve(REPO, args.path.slice(2));
        for (const ext of ['', '.ts', '.tsx', '.mjs', '.js', '/index.ts']) {
          try {
            readFileSync(base + ext);
            return { path: base + ext };
          } catch {}
        }
      }
      return undefined;
    });
  }
};

writeFileSync(join(HERE, 'shims/empty.ts'), 'export {};\n');
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

await build({
  entryPoints: [join(HERE, 'main.tsx')],
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2020',
  jsx: 'automatic',
  outfile: join(OUT, 'app.js'),
  nodePaths: [join(REPO, 'node_modules')],
  plugins: [plugin],
  define: { 'process.env.NODE_ENV': '"production"' },
  banner: { js: 'var process={env:{NODE_ENV:"production",SITE_URL:"https://demo.laupau",REDSYS_ENV:"test"}};' },
  logLevel: 'warning'
});

const css = [
  readFileSync(join(REPO, 'app/styles/laupau.css'), 'utf8').replaceAll("url('/laupau/", "url('laupau/"),
  readFileSync(join(REPO, 'app/styles/shop.css'), 'utf8'),
  readFileSync(join(REPO, 'app/styles/admin.css'), 'utf8'),
  readFileSync(join(HERE, 'demo.css'), 'utf8')
].join('\n');
writeFileSync(join(OUT, 'app.css'), css);
cpSync(join(REPO, 'public/laupau'), join(OUT, 'laupau'), { recursive: true });

writeFileSync(
  join(OUT, 'index.html'),
  `<title>Demo Lau&amp;Pau</title>
<link rel="preload" href="laupau/fonts/fraunces-regular.woff" as="font" type="font/woff" crossorigin>
<link rel="preload" href="laupau/fonts/manrope.woff" as="font" type="font/woff" crossorigin>
<link rel="stylesheet" href="app.css">
<link rel="icon" href="laupau/marca/logo-final.png">
<div id="app"></div>
<noscript>La demo necesita JavaScript.</noscript>
<script src="app.js"></script>
`
);
console.log('demo construida en', OUT);
