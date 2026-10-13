// Expo's standard Metro setup, plus a few stand-ins used ONLY when building the website
// (app.snapfront.app). Android and iOS builds resolve every module exactly as before.
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

const WEB_STANDINS = {
  // No secure store in browsers: the website keeps its sign-in in local storage.
  "expo-secure-store": path.resolve(__dirname, "src/web/secure-store.ts"),
};
// Screens the website shows differently: a top menu instead of the tab bar, a home page with a
// hero, and plans paid with Stripe. Keys are paths under src/app (without the extension).
const WEB_SCREENS = {
  "_layout": "src/web/root-layout.tsx",
  "(tabs)/_layout": "src/web/tabs-layout.tsx",
  "(tabs)/index": "src/web/home.tsx",
  "plans": "src/web/plans-screen.tsx",
};
const APP_DIR = path.resolve(__dirname, "src/app");
const WEB_DIR = path.resolve(__dirname, "src/web");
function webScreen(moduleName, origin) {
  if (!origin || origin.startsWith(WEB_DIR)) return null;          // the web versions may import the originals
  let target;
  if (path.isAbsolute(moduleName)) target = moduleName;
  else if (moduleName.startsWith(".") && path.resolve(path.dirname(origin), moduleName).startsWith(APP_DIR)) target = path.resolve(path.dirname(origin), moduleName);
  else if (moduleName.startsWith(".") && origin.startsWith(APP_DIR)) target = path.resolve(APP_DIR, moduleName);
  if (!target || !target.startsWith(APP_DIR + path.sep)) return null;
  const key = path.relative(APP_DIR, target).replace(/\\/g, "/").replace(/\.(tsx|ts|js)$/, "");
  return WEB_SCREENS[key] ? path.resolve(__dirname, WEB_SCREENS[key]) : null;
}
const RNW_ALERT = /[\\/]react-native-web[\\/]dist[\\/](index\.js|exports[\\/]Alert[\\/]index\.js)$/;

const upstream = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web") {
    if (WEB_STANDINS[moduleName]) return { type: "sourceFile", filePath: WEB_STANDINS[moduleName] };
    // Website versions of a few screens (see WEB_SCREENS).
    const screen = webScreen(moduleName, context.originModulePath);
    if (screen) return { type: "sourceFile", filePath: screen };
    // react-native-web's Alert does nothing; use a real dialog instead.
    if ((moduleName === "./exports/Alert" && RNW_ALERT.test(context.originModulePath)) || /^react-native-web\/dist\/(cjs\/)?exports\/Alert(\/index(\.js)?)?$/.test(moduleName)) {
      return { type: "sourceFile", filePath: path.resolve(__dirname, "src/web/alert.ts") };
    }
  }
  return upstream ? upstream(context, moduleName, platform) : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
