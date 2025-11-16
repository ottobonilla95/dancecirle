import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dancecircle.app',
  appName: 'DanceCircle',
  webDir: 'www', // Not used when server.url is set
  server: {
    // IMPORTANT: Point to your live production URL
    // The app will load your website in a native wrapper
    // For development, use: 'http://localhost:3000'
    // For production, use: 'https://dancecircle.co'
    url: process.env.CAPACITOR_SERVER_URL || 'https://dancecircle.co',
    cleartext: true, // Allow HTTP in development (set to false in production)
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#6366f1",
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
  ios: {
    contentInset: 'automatic',
    scheme: 'DanceCircle',
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
};

export default config;
