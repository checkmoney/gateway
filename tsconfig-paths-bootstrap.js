const { resolve } = require('path');
const tsConfigPaths = require('tsconfig-paths');

const { paths } = require('./tsconfig.json').compilerOptions;

tsConfigPaths.register({
  baseUrl: __dirname,
  paths,
});
