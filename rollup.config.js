import typescript from '@rollup/plugin-typescript'
import pkg from './package.json'
import { terser } from 'rollup-plugin-terser'
export default {
  input: 'src/index.ts', // our source file
  output: [
    {
      file: pkg.main,
      format: 'cjs',
    },
    {
      file: pkg.module,
      format: 'es', // the preferred format
    },
    {
      file: pkg.browser,
      format: 'iife',
      name: 'Airtable', // the global which can be used in a browser
    },
  ],
  external: [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {})],
  plugins: [
    typescript({
      typescript: require('typescript'),
    }),
    terser(), // minifies generated bundles
  ],
}
