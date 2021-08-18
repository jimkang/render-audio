/* global process */

import createConfig from './rollup-tools/base-config';
import { serve } from './rollup-tools/config-tools';

var config = createConfig({
  input: 'app.js',
  outputFile: 'demo.js',
  reloadPath: '.',
  serve: !process.env.APP && serve,
  serveOpts: { port: 7000 },
});

export default [config];
