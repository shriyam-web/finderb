const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// Keep resolution inside mobile/ so the parent Next.js node_modules is ignored.
config.watchFolders = [projectRoot];
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules')];
config.resolver.disableHierarchicalLookup = true;

// Required for @expo/ui subpath exports used by expo-router on Android.
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
