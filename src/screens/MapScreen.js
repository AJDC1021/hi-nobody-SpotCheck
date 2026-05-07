import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { useBudget } from '../context/BudgetContext';
import { registerGeofence, registerAllGeofences } from '../services/locationService';

const { width } = Dimensions.get('window');

const CATEGORY_OPTIONS = ['Coffee', 'Food', 'Tech', 'Transport', 'Entertainment'];

export default function MapScreen() {
  const { savedLocations, addLocation } = useBudget();

  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Coffee');
  const [pinning, setPinning] = useState(false);

  // ── Watch position ─────────────────────────────────────────────
  useEffect(() => {
    let subscription;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission is required.');
          setLoading(false);
          return;
        }
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 3000,
            distanceInterval: 5,
          },
          (loc) => {
            setCoords({
              lat: loc.coords.latitude,
              lng: loc.coords.longitude,
              accuracy: loc.coords.accuracy,
            });
            setLoading(false);
          },
        );
      } catch (err) {
        console.error('[SpotCheck] Location watch failed:', err);
        setLoading(false);
      }
    })();
    return () => subscription?.remove();
  }, []);

  // ── Pin this store ─────────────────────────────────────────────
  const handlePin = useCallback(async () => {
    if (!coords) {
      Alert.alert('No Location', 'Waiting for GPS fix…');
      return;
    }

    setPinning(true);
    try {
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: coords.lat,
        longitude: coords.lng,
      });

      const place = reverseGeocode[0];
      const storeName = place?.name || place?.street || `Store @ ${coords.lat.toFixed(4)}`;

      const newLocation = {
        name: storeName,
        lat: coords.lat,
        lng: coords.lng,
        category: selectedCategory,
      };

      addLocation(newLocation);

      // Register geofence immediately
      await registerGeofence({
        ...newLocation,
        id: Date.now().toString(),
      });

      Alert.alert(
        '📍 Store Pinned!',
        `"${storeName}" saved under ${selectedCategory}.\nGeofence is now active.`,
      );
    } catch (err) {
      console.error('[SpotCheck] Pin failed:', err);
      Alert.alert('Error', 'Could not pin location. Try again.');
    } finally {
      setPinning(false);
    }
  }, [coords, selectedCategory, addLocation]);

  // ── Re-register all geofences ──────────────────────────────────
  const handleReRegister = useCallback(async () => {
    try {
      await registerAllGeofences(savedLocations);
      Alert.alert('✅ Geofences Synced', `${savedLocations.length} geofences active.`);
    } catch (err) {
      Alert.alert('Error', 'Failed to re-register geofences.');
    }
  }, [savedLocations]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ──────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.title}>Map & Geofence</Text>
          <Text style={styles.subtitle}>Pin stores to get budget alerts</Text>
        </View>

        {/* ── Coordinates Card ────────────────────────────────── */}
        <LinearGradient
          colors={['#1A1A2E', '#16213E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.coordsCard}
        >
          <Text style={styles.coordsLabel}>CURRENT POSITION</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#00FF41" style={{ marginVertical: 16 }} />
          ) : coords ? (
            <View>
              <View style={styles.coordRow}>
                <Text style={styles.coordKey}>Latitude</Text>
                <Text style={styles.coordValue}>{coords.lat.toFixed(6)}</Text>
              </View>
              <View style={styles.coordRow}>
                <Text style={styles.coordKey}>Longitude</Text>
                <Text style={styles.coordValue}>{coords.lng.toFixed(6)}</Text>
              </View>
              <View style={styles.coordRow}>
                <Text style={styles.coordKey}>Accuracy</Text>
                <Text style={styles.coordValue}>
                  ±{coords.accuracy ? coords.accuracy.toFixed(1) : '?'}m
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.noCoords}>Location unavailable</Text>
          )}

          {/* Live pulse indicator */}
          <View style={styles.liveRow}>
            <View style={[styles.liveDot, !loading && coords && styles.liveDotActive]} />
            <Text style={styles.liveText}>
              {loading ? 'Acquiring…' : coords ? 'Live GPS' : 'No signal'}
            </Text>
          </View>
        </LinearGradient>

        {/* ── Category Picker ─────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Select Category</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {CATEGORY_OPTIONS.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                selectedCategory === cat && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(cat)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === cat && styles.categoryChipTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Pin Button ──────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.pinButton, (!coords || pinning) && styles.pinButtonDisabled]}
          onPress={handlePin}
          disabled={!coords || pinning}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={['#00FF41', '#00CC33']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.pinButtonGradient}
          >
            {pinning ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.pinButtonText}>📍 Pin This Store</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* ── Saved Locations ─────────────────────────────────── */}
        <View style={styles.savedHeader}>
          <Text style={styles.sectionTitle}>Saved Locations</Text>
          <TouchableOpacity onPress={handleReRegister} activeOpacity={0.7}>
            <Text style={styles.syncText}>↻ Sync Fences</Text>
          </TouchableOpacity>
        </View>

        {savedLocations.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No stores pinned yet</Text>
          </View>
        ) : (
          savedLocations.map((loc, i) => (
            <View key={loc.id || i} style={styles.locationCard}>
              <View style={styles.locationInfo}>
                <Text style={styles.locationName}>{loc.name}</Text>
                <Text style={styles.locationCoords}>
                  {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                </Text>
              </View>
              <View style={styles.locationBadge}>
                <Text style={styles.locationBadgeText}>{loc.category}</Text>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  // ── Header ─────────────────────────────────────────────────────
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#00FF41',
    marginTop: 4,
    fontWeight: '500',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  // ── Coords Card ────────────────────────────────────────────────
  coordsCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(0,255,65,0.15)',
  },
  coordsLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  coordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  coordKey: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  coordValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  noCoords: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#444',
    marginRight: 8,
  },
  liveDotActive: {
    backgroundColor: '#00FF41',
  },
  liveText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  // ── Category Picker ────────────────────────────────────────────
  sectionTitle: {
    color: '#888',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  categoryChipActive: {
    backgroundColor: 'rgba(0,255,65,0.12)',
    borderColor: '#00FF41',
  },
  categoryChipText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: '#00FF41',
  },
  // ── Pin Button ─────────────────────────────────────────────────
  pinButton: {
    marginBottom: 28,
    borderRadius: 16,
    overflow: 'hidden',
  },
  pinButtonDisabled: {
    opacity: 0.4,
  },
  pinButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 16,
  },
  pinButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  // ── Saved Locations ────────────────────────────────────────────
  savedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  syncText: {
    color: '#00FF41',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  locationCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  locationCoords: {
    color: '#555',
    fontSize: 12,
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  locationBadge: {
    backgroundColor: 'rgba(0,255,65,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 12,
  },
  locationBadgeText: {
    color: '#00FF41',
    fontSize: 12,
    fontWeight: '700',
  },
  // ── Empty State ────────────────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyText: {
    color: '#555',
    fontSize: 14,
  },
});
