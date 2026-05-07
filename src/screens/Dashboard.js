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

// ─── Category icons ───────────────────────────────────────────────
const ICONS = {
  Coffee: '☕',
  Food: '🍽️',
  Tech: '⚡',
  Transport: '🚲',
  Entertainment: '✨',
};

// ─── Accent gradients per category ───────────────────────────────
const ACCENT = {
  Coffee: ['#4F46E5', '#818CF8'], // Indigo
  Food: ['#10B981', '#34D399'], // Emerald
  Tech: ['#F59E0B', '#FBBF24'], // Amber
  Transport: ['#06B6D4', '#22D3EE'], // Cyan
  Entertainment: ['#EC4899', '#F472B6'], // Pink
};

const ICON_BG = {
  Coffee: 'rgba(79, 70, 229, 0.08)',
  Food: 'rgba(16, 185, 129, 0.08)',
  Tech: 'rgba(245, 158, 11, 0.08)',
  Transport: 'rgba(6, 182, 212, 0.08)',
  Entertainment: 'rgba(236, 72, 153, 0.08)',
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
    theme,
    toggleTheme,
  } = useBudget();

  const categories = Object.keys(budgets);
  const totalAllocated = categories.reduce((s, c) => s + budgets[c].allocated, 0);
  const totalSpent = categories.reduce((s, c) => s + budgets[c].spent, 0);
  const totalRemaining = Math.max(totalAllocated - totalSpent, 0);
  const overallProgress = totalAllocated > 0 ? Math.min(totalSpent / totalAllocated, 1) : 0;
  const daysLeft = getDaysLeftInMonth();
  const dayOfMonth = new Date().getDate();
  const dailyBurnRate = dayOfMonth > 1 ? totalSpent / dayOfMonth : totalSpent;

  return (
    <View style={[styles.container, { backgroundColor: theme === 'light' ? '#F8FAFC' : '#0A0A0B' }]}>
      <StatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} backgroundColor={theme === 'light' ? '#F8FAFC' : '#0A0A0B'} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Header ─────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme === 'light' ? '#0F172A' : '#FFFFFF' }]}>SpotCheck 👋</Text>
            <Text style={[styles.subtitle, { color: theme === 'light' ? '#64748B' : '#94A3B8' }]}>Budget Intelligence</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={[styles.themeToggle, { backgroundColor: theme === 'light' ? '#FFFFFF' : '#1A1A1B', borderColor: theme === 'light' ? '#E2E8F0' : '#2A2A2B' }]} 
              onPress={toggleTheme}
              activeOpacity={0.7}
            >
              <Text style={styles.themeIcon}>{theme === 'light' ? '🌙' : '☀️'}</Text>
            </TouchableOpacity>
            <View style={[styles.avatarCircle, { backgroundColor: theme === 'light' ? '#FFFFFF' : '#1A1A1B', borderColor: theme === 'light' ? '#E2E8F0' : '#2A2A2B' }]}>
              <Text style={styles.avatarText}>💰</Text>
            </View>
          </View>
        </View>

        {/* ── Hero / Summary Card ─────────────────────────────────── */}
        <LinearGradient
          colors={['#4F46E5', '#10B981']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroHeader}>
            <Text style={styles.heroLabel}>Net Balance</Text>
            <View style={styles.burnBadge}>
              <Text style={styles.burnText}>🔥 ${dailyBurnRate.toFixed(2)}/day</Text>
            </View>
          </View>

          <Text style={styles.heroAmount}>${totalRemaining.toFixed(2)}</Text>

          <View style={styles.heroProgressContainer}>
            <View style={styles.heroProgressTrack}>
              <View style={[styles.heroProgressFill, { width: `${overallProgress * 100}%` }]} />
            </View>
            <Text style={styles.heroProgressPct}>
              {(overallProgress * 100).toFixed(0)}%
            </Text>
          </View>

          <View style={styles.heroStatsGrid}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>Limit</Text>
              <Text style={styles.heroStatValue}>${totalAllocated.toFixed(0)}</Text>
            </View>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>Spent</Text>
              <Text style={styles.heroStatValue}>${totalSpent.toFixed(0)}</Text>
            </View>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>Days</Text>
              <Text style={styles.heroStatValue}>{daysLeft}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Insights Gallery ────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.insightsScroll}
        >
          <View style={[styles.insightCard, { backgroundColor: theme === 'light' ? '#F5F3FF' : '#1E1B4B', borderColor: theme === 'light' ? 'rgba(79, 70, 229, 0.2)' : 'rgba(129, 140, 248, 0.3)' }]}>
            <Text style={styles.insightEmoji}>🎯</Text>
            <Text style={[styles.insightLabel, { color: theme === 'light' ? '#475569' : '#C7D2FE' }]}>Daily Safe Spend</Text>
            <Text style={[styles.insightValue, { color: theme === 'light' ? '#4F46E5' : '#818CF8' }]}>
              ${(totalRemaining / daysLeft).toFixed(2)}
            </Text>
          </View>

          <View style={[styles.insightCard, { backgroundColor: theme === 'light' ? '#F0FDF4' : '#064E3B', borderColor: theme === 'light' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(52, 211, 153, 0.3)' }]}>
            <Text style={styles.insightEmoji}>📈</Text>
            <Text style={[styles.insightLabel, { color: theme === 'light' ? '#475569' : '#A7F3D0' }]}>Est. Savings</Text>
            <Text style={[styles.insightValue, { color: theme === 'light' ? '#10B981' : '#34D399' }]}>
              ${(totalRemaining * 0.2).toFixed(0)}
            </Text>
          </View>

          <View style={[styles.insightCard, { backgroundColor: theme === 'light' ? '#FFFBEB' : '#78350F', borderColor: theme === 'light' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(251, 191, 36, 0.3)' }]}>
            <Text style={styles.insightEmoji}>🔥</Text>
            <Text style={[styles.insightLabel, { color: theme === 'light' ? '#475569' : '#FDE68A' }]}>Spend Streak</Text>
            <Text style={[styles.insightValue, { color: theme === 'light' ? '#F59E0B' : '#FBBF24' }]}>
              12 Days
            </Text>
          </View>
        </ScrollView>

        {/* ── Section Title ───────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: theme === 'light' ? '#0F172A' : '#FFFFFF' }]}>Categories</Text>

        {/* ── Budget Cards ────────────────────────────────────────── */}
        {categories.map((category) => {
          const balance = getBalance(category);
          const allowance = getDailyAllowance(category);
          const progress = getProgress(category);
          const accentColors = ACCENT[category] || ['#6366F1', '#818CF8'];
          const iconBg = ICON_BG[category] || 'rgba(99,102,241,0.12)';
          const icon = ICONS[category] || '📦';
          const isOverBudget = progress >= 1;
          const allocated = budgets[category].allocated;
          const spent = budgets[category].spent;
          const pct = Math.min(progress * 100, 100);

          return (
            <View key={category} style={[styles.card, { backgroundColor: theme === 'light' ? '#FFFFFF' : '#111112', borderColor: theme === 'light' ? '#F1F5F9' : '#2A2A2B' }]}>
              <View style={styles.cardTop}>
                <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
                  <Text style={styles.cardIcon}>{icon}</Text>
                </View>

                <View style={styles.cardMeta}>
                  <Text style={[styles.cardTitle, { color: theme === 'light' ? '#0F172A' : '#FFFFFF' }]}>{category}</Text>
                  <Text style={[styles.cardSubtitle, { color: theme === 'light' ? '#94A3B8' : '#64748B' }]}>
                    ${spent.toFixed(0)} spent of ${allocated.toFixed(0)}
                  </Text>
                </View>

                <View style={[
                  styles.balancePill,
                  { backgroundColor: isOverBudget ? 'rgba(239,68,68,0.1)' : (theme === 'light' ? 'rgba(16,185,129,0.1)' : 'rgba(52,211,153,0.1)') },
                ]}>
                  <Text style={[
                    styles.balanceText,
                    { color: isOverBudget ? '#EF4444' : '#10B981' },
                  ]}>
                    ${Math.abs(balance).toFixed(0)} left
                  </Text>
                </View>
              </View>

              <View style={styles.progressContainer}>
                <View style={[styles.progressTrack, { backgroundColor: theme === 'light' ? '#F1F5F9' : '#1F2937' }]}>
                  <LinearGradient
                    colors={isOverBudget ? ['#EF4444', '#F87171'] : accentColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressFill, { width: `${pct}%` }]}
                  />
                  {/* Safe spend marker at 70% */}
                  {!isOverBudget && (
                    <View style={[styles.safeMarker, { left: '70%', backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)' }]} />
                  )}
                </View>
                <View style={styles.progressLabels}>
                  <Text style={[styles.progressText, { color: theme === 'light' ? '#94A3B8' : '#64748B' }]}>{pct.toFixed(0)}% used</Text>
                  <Text style={[styles.progressText, { color: theme === 'light' ? '#94A3B8' : '#64748B' }]}>Budget Limit</Text>
                </View>
              </View>

              <View style={[styles.cardFooter, { borderTopColor: theme === 'light' ? '#F1F5F9' : '#2A2A2B' }]}>
                <View>
                  <Text style={[styles.allowanceLabel, { color: theme === 'light' ? '#94A3B8' : '#64748B' }]}>DAILY BUDGET</Text>
                  <Text style={[styles.allowanceValue, { color: theme === 'light' ? '#0F172A' : '#FFFFFF' }]}>${allowance}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.quickSpendButton, allocated === 0 && styles.spendButtonDisabled, { backgroundColor: theme === 'light' ? '#F8FAFC' : '#1F2937', borderColor: theme === 'light' ? '#E2E8F0' : '#374151' }]}
                  onPress={() => spendFromCategory(category, 10)}
                  disabled={allocated === 0}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.quickSpendText, { color: theme === 'light' ? '#475569' : '#94A3B8' }]}>Quick Spend $10</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* ── Activity Pulse ────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { marginTop: 12, color: theme === 'light' ? '#0F172A' : '#FFFFFF' }]}>Activity Pulse</Text>
        <View style={[styles.activityCard, { backgroundColor: theme === 'light' ? '#FFFFFF' : '#111112', borderColor: theme === 'light' ? '#F1F5F9' : '#2A2A2B' }]}>
          {[
            { id: 1, type: 'spent', label: 'Starbucks Coffee', amount: '-$10', time: '2h ago', icon: '☕' },
            { id: 2, type: 'limit', label: 'Food Budget increased', amount: '+$50', time: 'Yesterday', icon: '📈' },
            { id: 3, type: 'spent', label: 'Uber Ride', amount: '-$15', time: '2 days ago', icon: '🚗' },
          ].map((item, idx, arr) => (
            <View key={item.id} style={[styles.activityItem, idx === arr.length - 1 && { borderBottomWidth: 0 }, { borderBottomColor: theme === 'light' ? '#F1F5F9' : '#2A2A2B' }]}>
              <View style={[styles.activityIconCircle, { backgroundColor: theme === 'light' ? '#F8FAFC' : '#1F2937' }]}>
                <Text style={styles.activityEmoji}>{item.icon}</Text>
              </View>
              <View style={styles.activityMeta}>
                <Text style={[styles.activityLabel, { color: theme === 'light' ? '#0F172A' : '#FFFFFF' }]}>{item.label}</Text>
                <Text style={[styles.activityTime, { color: theme === 'light' ? '#94A3B8' : '#64748B' }]}>{item.time}</Text>
              </View>
              <Text style={[
                styles.activityAmount,
                { color: item.type === 'spent' ? '#EF4444' : '#10B981' }
              ]}>
                {item.amount}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Reset Button ─────────────────────────────────────────── */}
        <TouchableOpacity style={[styles.resetButton, { backgroundColor: theme === 'light' ? '#FFFFFF' : '#1A1A1B', borderColor: theme === 'light' ? '#E2E8F0' : '#2A2A2B' }]} onPress={resetToDemo} activeOpacity={0.7}>
          <Text style={[styles.resetButtonText, { color: theme === 'light' ? '#64748B' : '#94A3B8' }]}>↻  Reset Demo Data</Text>
        </TouchableOpacity>

        {/* ── Test Notification Button ─────────────────────────────── */}
        <TouchableOpacity
          style={[styles.resetButton, { marginTop: 12, backgroundColor: theme === 'light' ? '#FFFFFF' : '#1A1A1B', borderColor: theme === 'light' ? 'rgba(79, 70, 229, 0.2)' : 'rgba(129, 140, 248, 0.2)' }]}
          onPress={async () => {
            const Notifications = require('expo-notifications');
            await Notifications.scheduleNotificationAsync({
              content: {
                title: '📍 Welcome to Starbucks!',
                body: 'You have $20.00 left for Coffee. Your safe spend today is $2.50.',
                sound: true,
              },
              trigger: null,
            });
          }}
        >
          <Text style={[styles.resetButtonText, { color: theme === 'light' ? '#4F46E5' : '#818CF8' }]}>
            🚀  Test Notification Alert
          </Text>
        </TouchableOpacity>

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  STYLES  — Light Mode
// ═══════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  // ── Layout ─────────────────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: '#0A0A0B', // Default to dark, will override in style prop
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 20,
  },

  // ── Header ─────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  themeIcon: {
    fontSize: 20,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
  avatarText: {
    fontSize: 20,
  },

  // ── Hero Card ──────────────────────────────────────────────────
  heroCard: {
    borderRadius: 32,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
  burnBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  burnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  heroAmount: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 24,
  },
  heroProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  heroProgressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    marginRight: 12,
    overflow: 'hidden',
  },
  heroProgressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  heroProgressPct: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    width: 35,
  },
  heroStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 16,
  },
  heroStatItem: {
    alignItems: 'center',
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  heroStatValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // ── Insights ──────────────────────────────────────────────────
  insightsScroll: {
    paddingRight: 20,
    marginBottom: 32,
  },
  insightCard: {
    width: 140,
    padding: 18,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 1.5,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  insightEmoji: {
    fontSize: 20,
    marginBottom: 8,
  },
  insightLabel: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  insightValue: {
    fontSize: 18,
    fontWeight: '800',
  },

  // ── Section ────────────────────────────────────────────────────
  sectionTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: -0.5,
  },

  // ── Card ───────────────────────────────────────────────────────
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardIcon: {
    fontSize: 24,
  },
  cardMeta: {
    flex: 1,
  },
  cardTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  balancePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  balanceText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // ── Progress ───────────────────────────────────────────────────
  progressContainer: {
    marginBottom: 24,
  },
  progressTrack: {
    height: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  safeMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },

  // ── Card Footer ────────────────────────────────────────────────
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  allowanceLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  allowanceValue: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  quickSpendButton: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  quickSpendText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
  },
  spendButtonDisabled: {
    opacity: 0.35,
  },

  // ── Activity Pulse ──────────────────────────────────────────
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  activityIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  activityEmoji: {
    fontSize: 18,
  },
  activityMeta: {
    flex: 1,
  },
  activityLabel: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
  },
  activityTime: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  activityAmount: {
    fontSize: 14,
    fontWeight: '700',
  },

  // ── Bottom Buttons ─────────────────────────────────────────────
  resetButton: {
    alignSelf: 'center',
    marginTop: 32,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resetButtonText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
});
