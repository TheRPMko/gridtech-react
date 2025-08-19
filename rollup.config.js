import typescript from '@rollup/plugin-typescript';
import postcss from 'rollup-plugin-postcss';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
    },
    {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true,
    },
  ],
  external: ['react', 'react-dom', '@dnd-kit/core'],
  plugins: [
    peerDepsExternal(),
    postcss({
      extract: true,
      minimize: true,
    }),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: 'dist',
    }),
  ],
};
