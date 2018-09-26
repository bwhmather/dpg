import typescript from 'rollup-plugin-typescript2';
import { uglify } from 'rollup-plugin-uglify';


export default [
  {
    input: 'src/index.ts',
    plugins: [
      typescript({
        abortOnError: false,
      }),
      uglify(),
    ],
    output: {
      format: 'iife',
      name: 'dpg',
      file: 'dist/app.js',
      sourcemap: true,
      sourcemapFile: 'dist/app.js.map'
    }
  },
]


