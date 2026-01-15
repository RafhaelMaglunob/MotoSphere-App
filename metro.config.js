// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.platforms = ['ios', 'android', 'web'];

config.resolver.sourceExts = [
  'tsx', 'ts', 'jsx', 'js', 'json',
  'web.tsx', 'web.ts', 'web.jsx', 'web.js',
  'cjs',
  'mjs', // <-- must include mjs for Firebase
];

module.exports = config;
