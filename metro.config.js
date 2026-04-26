const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Watch packages/ directory so Metro picks up @polana/* workspace packages
const projectRoot = __dirname;
const workspaceRoot = __dirname;

config.watchFolders = [
  ...( config.watchFolders ?? []),
  path.resolve(workspaceRoot, 'packages'),
];

// Resolve @polana/* from packages/
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@polana/db-types': path.resolve(projectRoot, 'packages/db-types/src'),
};

module.exports = config;
