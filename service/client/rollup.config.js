// rollup.config.js
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import uglify from 'rollup-plugin-uglify'

process.chdir(__dirname)

export default {
  input: './src/index.js',
  plugins: [
    resolve(),
    commonjs(),
    uglify()
  ],
  globals: {
    jquery: '$',
  },
  external: ['jquery'],
  output: {
    file: 'dist/bundle.js',
    name: 'bundle',
    format: 'iife'
  }
}
