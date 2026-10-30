import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mastercloud.drive',
  appName: 'Master Cloud',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#090d16',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1800,
      backgroundColor: '#090d16',
      showSpinner: true,
      androidSpinnerStyle: 'large',
      spinnerColor: '#3b82f6',
    },
    StatusBar: {
      backgroundColor: '#090d16',
      style: 'DARK',
    },
  },
};

export default config;
