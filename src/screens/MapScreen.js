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
  const { savedLocations, addLocation, theme, toggleTheme } = useBudget();

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
    <View style={[styles.container, { backgroundColor: theme === 'light' ? '#F8FAFC' : '#0A0A0B' }]}>
      <StatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} backgroundColor={theme === 'light' ? '#F8FAFC' : '#0A0A0B'} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ──────────────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: theme === 'light' ? '#0F172A' : '#FFFFFF' }]}>Map & Geofence</Text>
            <Text style={[styles.subtitle, { color: theme === 'light' ? '#64748B' : '#94A3B8' }]}>Pin stores to get budget alerts</Text>
          </View>
          <TouchableOpacity 
            style={[styles.themeToggle, { backgroundColor: theme === 'light' ? '#FFFFFF' : '#1A1A1B', borderColor: theme === 'light' ? '#E2E8F0' : '#2A2A2B' }]} 
            onPress={toggleTheme}
            activeOpacity={0.7}
          >
            <Text style={styles.themeIcon}>{theme === 'light' ? '🌙' : '☀️'}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Coordinates Card ────────────────────────────────── */}
        <LinearGradient
          colors={['#4F46E5', '#10B981']}
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
        <Text style={[styles.sectionTitle, { color: theme === 'light' ? '#0F172A' : '#FFFFFF' }]}>Select Category</Text>
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
                { backgroundColor: theme === 'light' ? '#FFFFFF' : '#111112', borderColor: theme === 'light' ? '#E2E8F0' : '#2A2A2B' },
                selectedCategory === cat && (theme === 'light' ? styles.categoryChipActive : { backgroundColor: 'rgba(129, 140, 248, 0.12)', borderColor: '#818CF8' }),
              ]}
              onPress={() => setSelectedCategory(cat)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  { color: theme === 'light' ? '#64748B' : '#94A3B8' },
                  selectedCategory === cat && (theme === 'light' ? styles.categoryChipTextActive : { color: '#818CF8' }),
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
            colors={['#4F46E5', '#6366F1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.pinButtonGradient}
          >
            {pinning ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.pinButtonText}>📍 Pin This Store</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* ── Saved Locations ─────────────────────────────────── */}
        <View style={styles.savedHeader}>
          <Text style={[styles.sectionTitle, { color: theme === 'light' ? '#0F172A' : '#FFFFFF' }]}>Saved Locations</Text>
          <TouchableOpacity onPress={handleReRegister} activeOpacity={0.7}>
            <Text style={[styles.syncText, { color: theme === 'light' ? '#4F46E5' : '#818CF8' }]}>↻ Sync Fences</Text>
          </TouchableOpacity>
        </View>

        {savedLocations.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: theme === 'light' ? '#FFFFFF' : '#111112', borderColor: theme === 'light' ? '#F1F5F9' : '#2A2A2B' }]}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={[styles.emptyText, { color: theme === 'light' ? '#94A3B8' : '#64748B' }]}>No stores pinned yet</Text>
          </View>
        ) : (
          savedLocations.map((loc, i) => (
            <View key={loc.id || i} style={[styles.locationCard, { backgroundColor: theme === 'light' ? '#FFFFFF' : '#111112', borderColor: theme === 'light' ? '#F1F5F9' : '#2A2A2B' }]}>
              <View style={styles.locationInfo}>
                <Text style={[styles.locationName, { color: theme === 'light' ? '#0F172A' : '#FFFFFF' }]}>{loc.name}</Text>
                <Text style={[styles.locationCoords, { color: theme === 'light' ? '#94A3B8' : '#64748B' }]}>
                  {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                </Text>
              </View>
              <View style={[styles.locationBadge, { backgroundColor: theme === 'light' ? '#F5F3FF' : '#1E1B4B' }]}>
                <Text style={[styles.locationBadgeText, { color: theme === 'light' ? '#4F46E5' : '#818CF8' }]}>{loc.category}</Text>
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
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  // ── Header ─────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  themeToggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  themeIcon: {
    fontSize: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  // ── Coords Card ────────────────────────────────────────────────
  coordsCard: {
    borderRadius: 28,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  coordsLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 20,
  },
  coordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  coordKey: {
    color: 'rgba(255,255,255,0.6)',
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
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginRight: 8,
  },
  liveDotActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFF',
    shadowRadius: 10,
    shadowOpacity: 0.8,
  },
  liveText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  // ── Category Picker ────────────────────────────────────────────
  sectionTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  categoryRow: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  categoryChipActive: {
    backgroundColor: '#F5F3FF',
    borderColor: '#4F46E5',
  },
  categoryChipText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  // ── Pin Button ─────────────────────────────────────────────────
  pinButton: {
    marginBottom: 32,
    borderRadius: 18,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  pinButtonDisabled: {
    opacity: 0.4,
  },
  pinButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: 18,
  },
  pinButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  // ── Saved Locations ────────────────────────────────────────────
  savedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  syncText: {
    color: '#4F46E5',
    fontSize: 13,
    fontWeight: '700',
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
  },
  locationCoords: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  locationBadge: {
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 12,
  },
  locationBadgeText: {
    color: '#4F46E5',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  // ── Empty State ────────────────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderStyle: 'dashed',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
});
