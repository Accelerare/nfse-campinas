import { build } from 'esbuild';
import glob from 'glob';

build({
  entryPoints: glob.sync('./src/**/*.ts'),
  bundle: true,
  minify: true,
  platform: 'browser',
  target: ['es2020'],
  outdir: './dist',
  plugins: [],
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  format: 'esm',
}).then(result => {
  console.log(result);
}).catch((err) => {
  console.log(err);
  process.exit(1);
});