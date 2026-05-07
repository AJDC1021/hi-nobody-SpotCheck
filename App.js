// ═══════════════════════════════════════════════════════════════════
//  SpotCheck — App.js (Entry Point)
//  Handles permissions, notification config, and wraps everything
//  in the BudgetContext.Provider.
// ═══════════════════════════════════════════════════════════════════

import React, { useEffect, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { BudgetProvider } from './src/context/BudgetContext';
import AppNavigator from './src/navigation/AppNavigator';
import { requestAllPermissions, registerAllGeofences } from './src/services/locationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── CRITICAL: Import locationService at top level so the ────────
//     TaskManager.defineTask call executes on app start.
import './src/services/locationService';

// ─── Configure notification handler (foreground display) ─────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

// ─── Android notification channel ────────────────────────────────
async function setupNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('spotcheck-alerts', {
      name: 'SpotCheck Budget Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#00FF41',
      sound: 'default',
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
    });
  }
}

export default function App() {
  const notificationListener = useRef(null);
  const responseListener = useRef(null);

  useEffect(() => {
    (async () => {
      // 1. Set up notification channel
      await setupNotificationChannel();

      // 2. Request notification permissions
      const { status: notifStatus } = await Notifications.requestPermissionsAsync();
      if (notifStatus !== 'granted') {
        Alert.alert(
          'Notifications Disabled',
          'SpotCheck needs notification permission to send budget alerts when you enter a store.',
        );
      }

      // 3. Request location permissions (foreground + background)
      const locationGranted = await requestAllPermissions();
      if (!locationGranted) {
        Alert.alert(
          'Location Permission Required',
          'SpotCheck needs foreground & background location to detect when you enter stores. Please grant location access in Settings.',
        );
      }

      // 4. Re-register all saved geofences
      if (locationGranted) {
        try {
          const raw = await AsyncStorage.getItem('@spotcheck_locations');
          const locations = raw ? JSON.parse(raw) : [];
          if (locations.length > 0) {
            await registerAllGeofences(locations);
          }
        } catch (err) {
          console.warn('[SpotCheck] Failed to restore geofences:', err);
        }
      }
    })();

    // ── Notification listeners ─────────────────────────────────
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('[SpotCheck] Notification received:', notification.request.content.title);
      },
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('[SpotCheck] Notification tapped:', response.notification.request.content.data);
      },
    );

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return (
    <BudgetProvider>
      <AppNavigator />
    </BudgetProvider>
  );
}
