// rollup.config.js
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import uglify from 'rollup-plugin-uglify'

process.chdir(__dirname)
const output = (process.env.NODE_ENV === 'production') ? 'bundle.min.js' : 'bundle.js'

export default {
  input: './src/index.js',
  plugins: [
    resolve(),
    commonjs(),
    (process.env.NODE_ENV === 'production') ? uglify(): false,
  ],
  globals: {
    jquery: '$'
  },
  external: ['jquery'],
  output: {
    file: `./dist/${output}`,
    name: 'bundle',
    format: 'iife'
  }
}
