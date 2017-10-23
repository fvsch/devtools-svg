import typescript from 'rollup-plugin-typescript2'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'

const output = {
  format: 'es',
  dir: 'ext/dist'
}

export default [
  {
    input: 'src/panel.tsx',
    output,
    plugins: [resolve(), commonjs(), typescript()]
  },
  {
    input: 'src/background.js',
    output: { file: '' },
    plugins: [resolve(), commonjs(), typescript()]
  }
]
