require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const IS_DEV = process.env.APP_VARIANT === 'development';

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  name: IS_DEV ? 'Flickbook (dev)' : 'Flickbook',
  slug: 'flickbook',
  scheme: 'flickbook',
  version: '1.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'cover',
    backgroundColor: '#faf7f2',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: IS_DEV ? 'com.barbarossa.flickbook.debug' : 'com.barbarossa.flickbook',
    infoPlist: {
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: true,
      },
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#faf7f2',
    },
    package: IS_DEV ? 'com.barbarossa.flickbook.debug' : 'com.barbarossa.flickbook',
    versionCode: 4,
  },
  web: {
    bundler: 'metro',
    output: 'static',
  },
  plugins: [
    'expo-router',
    ['expo-splash-screen', { image: './assets/adaptive-icon.png', backgroundColor: '#faf7f2', imageWidth: 200 }],
    'expo-secure-store',
    'expo-notifications',
    'expo-apple-authentication',
    '@react-native-google-signin/google-signin',
    'expo-localization',
    './plugins/withAndroidNavBar',
    ['expo-build-properties', { android: { usesCleartextTraffic: true, edgeToEdgeEnabled: true } }],
  ],
  newArchEnabled: true,
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiUrl: process.env.API_URL,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientIdAndroid: process.env.GOOGLE_CLIENT_ID_ANDROID,
    googleClientIdWeb: process.env.GOOGLE_CLIENT_ID_WEB,
    router: {},
    eas: {
      projectId: 'b689c20e-6bd6-4744-b9e7-e3d3d91559db',
    },
  },
  owner: 'ultrakot',
};
