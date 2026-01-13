import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.8f7313b7232e4a5b8a3a54684a73ff89',
  appName: 'ZONNA',
  webDir: 'dist',
  server: {
    url: 'https://8f7313b7-232e-4a5b-8a3a-54684a73ff89.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_zonna',
      iconColor: '#FF4F00',
      sound: 'beep.wav',
    },
    BackgroundGeolocation: {
      // Distance filter in meters - only record point every 5-10 meters
      distanceFilter: 5,
      // Accuracy level
      desiredAccuracy: 'high',
      // Notification configuration for Android
      notificationTitle: 'ZONNA Ativo',
      notificationText: 'Rastreando seu território...',
    },
  },
  android: {
    backgroundColor: '#000000',
  },
  ios: {
    backgroundColor: '#000000',
  },
};

export default config;
