import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.studysync.app',
  appName: 'StudySync',
  webDir: 'dist',
  backgroundColor: '#151219',
  android: {
    backgroundColor: '#151219',
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.com'],
    },
    SplashScreen: {
      // Kept brief on purpose: the real "forgetting curve forming" animation is the
      // in-app intro (see src/components/IntroSplash.tsx), which needs full control
      // over drawing/easing that the native splash image alone can't provide.
      launchShowDuration: 250,
      launchAutoHide: true,
      backgroundColor: '#151219',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
