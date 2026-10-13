// Expo's standard Metro setup, plus a few stand-ins used ONLY when building the website
// (app.snapfront.app). Android and iOS builds resolve every module exactly as before.
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

const WEB_STANDINS = {
  // No secure store in browsers: the website keeps its sign-in in local storage.
  "expo-secure-store": path.resolve(__dirname, "src/web/secure-store.ts"),
};
const RNW_ALERT = /[\\/]react-native-web[\\/]dist[\\/](index\.js|exports[\\/]Alert[\\/]index\.js)$/;

const upstream = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web") {
    if (WEB_STANDINS[moduleName]) return { type: "sourceFile", filePath: WEB_STANDINS[moduleName] };
    // The plans screen: pay with Stripe on the website instead of Google Play.
    if (/[\\/]src[\\/]app[\\/]plans\.tsx$/.test(moduleName) || (/^\.\/plans(\.tsx)?$/.test(moduleName) && /[\\/]src[\\/]app[\\/]/.test(context.originModulePath))) {
      return { type: "sourceFile", filePath: path.resolve(__dirname, "src/web/plans-screen.tsx") };
    }
    // react-native-web's Alert does nothing; use a real dialog instead.
    if ((moduleName === "./exports/Alert" && RNW_ALERT.test(context.originModulePath)) || /^react-native-web\/dist\/(cjs\/)?exports\/Alert(\/index(\.js)?)?$/.test(moduleName)) {
      return { type: "sourceFile", filePath: path.resolve(__dirname, "src/web/alert.ts") };
    }
  }
  return upstream ? upstream(context, moduleName, platform) : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
