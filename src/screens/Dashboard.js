import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useBudget } from '../context/BudgetContext';

const { width } = Dimensions.get('window');

// ─── Category icons (emoji for zero-dependency demo) ─────────────
const ICONS = {
  Coffee: '☕',
  Food: '🍔',
  Tech: '💻',
  Transport: '🚗',
  Entertainment: '🎮',
};

// ─── Accent palette per category ─────────────────────────────────
const ACCENT = {
  Coffee: ['#6F4E37', '#A67B5B'],
  Food: ['#FF6B35', '#FF9F1C'],
  Tech: ['#00FF41', '#00CC33'],
  Transport: ['#4361EE', '#3A86FF'],
  Entertainment: ['#F72585', '#B5179E'],
};

export default function Dashboard() {
  const {
    budgets,
    getBalance,
    getDailyAllowance,
    getProgress,
    spendFromCategory,
    resetToDemo,
    getDaysLeftInMonth,
  } = useBudget();

  const categories = Object.keys(budgets);
  const totalAllocated = categories.reduce((s, c) => s + budgets[c].allocated, 0);
  const totalSpent = categories.reduce((s, c) => s + budgets[c].spent, 0);
  const totalRemaining = Math.max(totalAllocated - totalSpent, 0);
  const daysLeft = getDaysLeftInMonth();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ──────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.greeting}>SpotCheck</Text>
          <Text style={styles.subtitle}>Proactive Budget Tracking</Text>
        </View>

        {/* ── Summary Card ────────────────────────────────────── */}
        <LinearGradient
          colors={['#1A1A2E', '#16213E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryCard}
        >
          <Text style={styles.summaryLabel}>REMAINING THIS MONTH</Text>
          <Text style={styles.summaryAmount}>${totalRemaining.toFixed(2)}</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryChip}>
              <Text style={styles.chipLabel}>Allocated</Text>
              <Text style={styles.chipValue}>${totalAllocated.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryChip}>
              <Text style={styles.chipLabel}>Spent</Text>
              <Text style={[styles.chipValue, { color: '#FF6B6B' }]}>
                ${totalSpent.toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryChip}>
              <Text style={styles.chipLabel}>Days Left</Text>
              <Text style={[styles.chipValue, { color: '#00FF41' }]}>{daysLeft}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Budget Cards ────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Budget Categories</Text>

        {categories.map((category) => {
          const balance = getBalance(category);
          const allowance = getDailyAllowance(category);
          const progress = getProgress(category);
          const colors = ACCENT[category] || ['#00FF41', '#00CC33'];
          const icon = ICONS[category] || '📦';
          const isOverBudget = progress >= 1;
          const allocated = budgets[category].allocated;
          const spent = budgets[category].spent;

          return (
            <View key={category} style={styles.card}>
              {/* Card header */}
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardIcon}>{icon}</Text>
                  <View>
                    <Text style={styles.cardTitle}>{category}</Text>
                    <Text style={styles.cardSubtitle}>
                      ${spent.toFixed(2)} / ${allocated.toFixed(2)}
                    </Text>
                  </View>
                </View>
                <View style={styles.balanceBadge}>
                  <Text
                    style={[
                      styles.balanceText,
                      { color: isOverBudget ? '#FF6B6B' : '#00FF41' },
                    ]}
                  >
                    ${balance.toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={styles.progressTrack}>
                <LinearGradient
                  colors={isOverBudget ? ['#FF6B6B', '#EE4444'] : colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%` }]}
                />
              </View>

              {/* Daily allowance + spend button */}
              <View style={styles.cardFooter}>
                <Text style={styles.allowanceText}>
                  Safe today: <Text style={styles.allowanceValue}>${allowance}</Text>
                </Text>
                <TouchableOpacity
                  style={[
                    styles.spendButton,
                    allocated === 0 && styles.spendButtonDisabled,
                  ]}
                  onPress={() => spendFromCategory(category, 10)}
                  disabled={allocated === 0}
                  activeOpacity={0.7}
                >
                  <Text style={styles.spendButtonText}>− $10</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* ── Reset Button ────────────────────────────────────── */}
        <TouchableOpacity style={styles.resetButton} onPress={resetToDemo} activeOpacity={0.7}>
          <Text style={styles.resetButtonText}>↻ Reset Demo Data</Text>
        </TouchableOpacity>

        {/* ── SECRET HACKATHON TEST BUTTON ────────────────────── */}
        <TouchableOpacity 
          style={[styles.resetButton, { marginTop: 10, borderColor: '#00FF41' }]} 
          onPress={async () => {
            const Notifications = require('expo-notifications');
            await Notifications.scheduleNotificationAsync({
              content: {
                title: "📍 Welcome to Starbucks!",
                body: "You have $20.00 left for Coffee. Your safe spend today is $2.50.",
                sound: true,
              },
              trigger: null,
            });
          }}
        >
          <Text style={[styles.resetButtonText, { color: '#00FF41' }]}>🚀 Test Notification Alert</Text>
        </TouchableOpacity>

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
  greeting: {
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
  // ── Summary Card ───────────────────────────────────────────────
  summaryCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(0,255,65,0.15)',
  },
  summaryLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  summaryAmount: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '800',
    marginVertical: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  summaryChip: {
    alignItems: 'center',
  },
  chipLabel: {
    color: '#666',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  chipValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  // ── Section ────────────────────────────────────────────────────
  sectionTitle: {
    color: '#888',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 16,
  },
  // ── Card ───────────────────────────────────────────────────────
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: '#666',
    fontSize: 13,
    marginTop: 2,
  },
  balanceBadge: {
    backgroundColor: 'rgba(0,255,65,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  balanceText: {
    fontSize: 16,
    fontWeight: '800',
  },
  // ── Progress ───────────────────────────────────────────────────
  progressTrack: {
    height: 6,
    backgroundColor: '#2A2A2A',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  // ── Footer ─────────────────────────────────────────────────────
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  allowanceText: {
    color: '#888',
    fontSize: 13,
  },
  allowanceValue: {
    color: '#00FF41',
    fontWeight: '700',
  },
  spendButton: {
    backgroundColor: 'rgba(255,107,107,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.3)',
  },
  spendButtonDisabled: {
    opacity: 0.3,
  },
  spendButtonText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '700',
  },
  // ── Reset ──────────────────────────────────────────────────────
  resetButton: {
    alignSelf: 'center',
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  resetButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
});
