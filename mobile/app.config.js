require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  name: 'Flickbook',
  slug: 'flickbook',
  scheme: 'flickbook',
  version: '1.0.0',
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
    bundleIdentifier: 'com.barbarossa.flickbook',
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
    package: 'com.barbarossa.flickbook',
    versionCode: 2,
  },
  web: {
    bundler: 'metro',
    output: 'static',
  },
  plugins: [
    'expo-router',
    ['expo-splash-screen', {
      image: './assets/splash.png',
      resizeMode: 'cover',
      backgroundColor: '#faf7f2',
    }],
    'expo-secure-store',
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
