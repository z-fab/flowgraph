import * as esbuild from 'esbuild';
import { mkdirSync } from 'fs';

mkdirSync('dist', { recursive: true });

const shared = {
  entryPoints: ['src/index.js'],
  bundle: true,
  target: ['es2018'],
  legalComments: 'none',
};

await esbuild.build({
  ...shared,
  outfile: 'dist/flowgraph.js',
  format: 'esm',
});

await esbuild.build({
  ...shared,
  outfile: 'dist/flowgraph.min.js',
  format: 'esm',
  minify: true,
});

await esbuild.build({
  ...shared,
  entryPoints: ['src/iife.js'],
  outfile: 'dist/flowgraph.iife.js',
  format: 'iife',
  globalName: 'FlowGraph',
});

await esbuild.build({
  ...shared,
  entryPoints: ['src/iife.js'],
  outfile: 'dist/flowgraph.iife.min.js',
  format: 'iife',
  globalName: 'FlowGraph',
  minify: true,
});

console.log('Built dist/flowgraph.{js,min.js,iife.js,iife.min.js}');
