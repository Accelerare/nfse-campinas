import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/index.js',
  format: 'esm',
  platform: 'browser',
  target: ['es2020'],
  external: ['node-forge', 'soap', 'xml-crypto', 'fast-xml-parser', 'xmlbuilder'],
  define: {
    'process.env.NODE_DEBUG': 'false',
  },
  inject: ['./src/polyfills.ts'],
  loader: {
    '.ts': 'ts',
  },
  resolveExtensions: ['.ts', '.js'],
  sourcemap: true,
  minify: true,
  treeShaking: true,
  legalComments: 'none',
});