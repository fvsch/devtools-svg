import svelte from "rollup-plugin-svelte";
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import uglify from "rollup-plugin-uglify";
import css from "rollup-plugin-css-only";
import { minify } from "uglify-es";

const production = !process.env.ROLLUP_WATCH;

export default {
  input: "src/init.js",
  output: {
    file: "ext/build/dsvg-panel.js",
    format: "iife",
    name: "svgPanel",
    sourcemap: false
  },
  plugins: [
    svelte(),
    css({ output: "ext/build/dsvg-panel.css" }),
    resolve(),
    commonjs(),
    production && uglify({}, minify)
  ]
};
