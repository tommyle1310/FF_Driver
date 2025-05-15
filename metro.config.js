const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Add custom resolver configurations
config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    "@": path.resolve(__dirname),
    "@src": path.resolve(__dirname, "src"),
    "@screens": path.resolve(__dirname, "screens"),
    "@components": path.resolve(__dirname, "src/components"),
    "@store": path.resolve(__dirname, "src/store"),
  },
};

module.exports = withNativeWind(config, { input: "./global.css" });
