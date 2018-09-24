import typescript from 'rollup-plugin-typescript2';
import { uglify } from 'rollup-plugin-uglify';


export default [
  {
    input: 'src/index.tsx',
    plugins: [
      typescript({
        abortOnError: false,
      }),
      uglify(),
    ],
    output: {
      format: 'iife',
      name: 'evt',
      file: 'dist/app.js',
      sourcemap: true,
      sourcemapFile: 'dist/app.js.map'
    }
  },
]



