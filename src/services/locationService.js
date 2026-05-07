// ═══════════════════════════════════════════════════════════════════
//  LOCATION SERVICE — Geofencing + Background Notifications
//  CRITICAL: TaskManager.defineTask MUST be at the top-level scope.
// ═══════════════════════════════════════════════════════════════════
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Constants ───────────────────────────────────────────────────
export const LOCATION_GEOFENCE_TASK = 'SPOTCHECK_GEOFENCE_TASK';
const COOLDOWN_KEY = '@spotcheck_last_notify';
const COOLDOWN_MS = 5 * 60 * 1000; // 5-minute cool-down per region
const BUDGETS_KEY = '@spotcheck_budgets';
const LOCATIONS_KEY = '@spotcheck_locations';
const GEOFENCE_RADIUS = 100; // metres

// ─── Helper: days remaining in the month ─────────────────────────
function daysLeftInMonth() {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return Math.max(lastDay - now.getDate(), 1);
}

// ═══════════════════════════════════════════════════════════════════
//  TOP-LEVEL TASK DEFINITION (runs even when app is backgrounded)
// ═══════════════════════════════════════════════════════════════════
TaskManager.defineTask(LOCATION_GEOFENCE_TASK, async ({ data, error }) => {
  if (error) {
    console.error('[SpotCheck Geofence] Task error:', error.message);
    return;
  }

  if (!data || !data.eventType || !data.region) return;

  const { eventType, region } = data;

  // Only fire on ENTER events
  if (eventType !== Location.GeofencingEventType.Enter) return;

  try {
    // ── Cool-down check ────────────────────────────────────────
    const cooldownRaw = await AsyncStorage.getItem(COOLDOWN_KEY);
    const cooldownMap = cooldownRaw ? JSON.parse(cooldownRaw) : {};
    const lastNotified = cooldownMap[region.identifier] || 0;

    if (Date.now() - lastNotified < COOLDOWN_MS) {
      console.log('[SpotCheck Geofence] Cooldown active for', region.identifier);
      return;
    }

    // ── Read locations to find the store name + category ───────
    const rawLocations = await AsyncStorage.getItem(LOCATIONS_KEY);
    const locations = rawLocations ? JSON.parse(rawLocations) : [];
    const store = locations.find((loc) => loc.id === region.identifier);

    if (!store) {
      console.warn('[SpotCheck Geofence] No matching store for', region.identifier);
      return;
    }

    // ── Read budgets ──────────────────────────────────────────
    const rawBudgets = await AsyncStorage.getItem(BUDGETS_KEY);
    const budgets = rawBudgets ? JSON.parse(rawBudgets) : {};
    const entry = budgets[store.category];
    const balance = entry ? Math.max(entry.allocated - entry.spent, 0) : 0;
    const dailyAllowance = (balance / daysLeftInMonth()).toFixed(2);

    // ── Build notification ────────────────────────────────────
    let title, body;
    if (balance > 0) {
      title = `📍 Welcome to ${store.name}!`;
      body = `You have $${balance.toFixed(2)} left for ${store.category}. Your safe spend today is $${dailyAllowance}.`;
    } else {
      title = `⚠️ WARNING — $0 for ${store.category}`;
      body = `You have $0 left for ${store.category}. High risk of overspending!`;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        data: { storeId: store.id, category: store.category },
      },
      trigger: null, // send immediately
    });

    // ── Update cooldown map ──────────────────────────────────
    cooldownMap[region.identifier] = Date.now();
    await AsyncStorage.setItem(COOLDOWN_KEY, JSON.stringify(cooldownMap));

    console.log('[SpotCheck Geofence] Notification sent for', store.name);
  } catch (err) {
    console.error('[SpotCheck Geofence] Notification failed:', err);
  }
});

// ═══════════════════════════════════════════════════════════════════
//  PUBLIC API
// ═══════════════════════════════════════════════════════════════════

/**
 * Register a single geofence for a saved location.
 */
export async function registerGeofence(location) {
  try {
    const region = {
      identifier: location.id,
      latitude: location.lat,
      longitude: location.lng,
      radius: GEOFENCE_RADIUS,
      notifyOnEnter: true,
      notifyOnExit: false,
    };

    await Location.startGeofencingAsync(LOCATION_GEOFENCE_TASK, [region]);
    console.log('[SpotCheck] Geofence registered:', location.name);
  } catch (err) {
    console.error('[SpotCheck] Failed to register geofence:', err);
  }
}

/**
 * Register geofences for ALL saved locations at once.
 */
export async function registerAllGeofences(locations) {
  if (!locations || locations.length === 0) return;

  try {
    const regions = locations.map((loc) => ({
      identifier: loc.id,
      latitude: loc.lat,
      longitude: loc.lng,
      radius: GEOFENCE_RADIUS,
      notifyOnEnter: true,
      notifyOnExit: false,
    }));

    await Location.startGeofencingAsync(LOCATION_GEOFENCE_TASK, regions);
    console.log(`[SpotCheck] ${regions.length} geofences registered.`);
  } catch (err) {
    console.error('[SpotCheck] Failed to register geofences:', err);
  }
}

/**
 * Stop all geofencing.
 */
export async function stopAllGeofences() {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_GEOFENCE_TASK);
    if (isRegistered) {
      await Location.stopGeofencingAsync(LOCATION_GEOFENCE_TASK);
      console.log('[SpotCheck] All geofences stopped.');
    }
  } catch (err) {
    console.error('[SpotCheck] Failed to stop geofences:', err);
  }
}

/**
 * Request foreground + background permissions. Returns true if granted.
 */
export async function requestAllPermissions() {
  // Foreground
  const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
  if (fgStatus !== 'granted') {
    console.warn('[SpotCheck] Foreground location permission denied.');
    return false;
  }

  // Background
  const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
  if (bgStatus !== 'granted') {
    console.warn('[SpotCheck] Background location permission denied.');
    return false;
  }

  return true;
}
