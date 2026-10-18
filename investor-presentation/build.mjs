import { build } from 'esbuild';
await build({entryPoints:['src/presentation.js'],bundle:true,minify:true,format:'iife',target:'es2020',outfile:'dist/presentation.js',legalComments:'eof'});
console.log('Built self-contained presentation bundle.');
