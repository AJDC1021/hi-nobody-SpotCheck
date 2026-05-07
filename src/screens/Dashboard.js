import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  TextInput,
  Dimensions,
  Modal,
  KeyboardAvoidingView,
  Platform,
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
    refundTransaction,
    updateBudget,
    resetToDemo,
    resetAllBudgets,
    resetTransactions,
    getDaysLeftInMonth,
    overallBudget,
    transactions,
    theme,
    toggleTheme,
  } = useBudget();

  const [editingCategory, setEditingCategory] = useState(null);
  const [newLimit, setNewLimit] = useState('');
  const [manualSpendAmounts, setManualSpendAmounts] = useState({});
  const [selectedFilter, setSelectedFilter] = useState('All');

  const handleManualSpend = (category) => {
    const amount = parseFloat(manualSpendAmounts[category]);
    if (!isNaN(amount) && amount > 0) {
      spendFromCategory(category, amount);
      setManualSpendAmounts(prev => ({ ...prev, [category]: '' }));
    }
  };

  const categories = Object.keys(budgets);
  const totalAllocated = categories.reduce((s, c) => s + budgets[c].allocated, 0);
  const totalSpent = categories.reduce((s, c) => s + budgets[c].spent, 0);
  const totalRemaining = Math.max(totalAllocated - totalSpent, 0);
  const overallProgress = totalAllocated > 0 ? Math.min(totalSpent / totalAllocated, 1) : 0;
  const daysLeft = getDaysLeftInMonth();
  const dayOfMonth = new Date().getDate();

  // Calculate stats based on filter
  let displaySpent = totalSpent;
  let displayAllocated = overallBudget; // Default "Total Money" to the fixed pool

  if (selectedFilter !== 'All') {
    displaySpent = budgets[selectedFilter]?.spent || 0;
    displayAllocated = budgets[selectedFilter]?.allocated || 0;
  }

  const displayBurnRate = dayOfMonth > 1 ? displaySpent / dayOfMonth : displaySpent;
  const displayRemaining = displayAllocated - displaySpent;
  const dailyBurnRate = dayOfMonth > 1 ? totalSpent / dayOfMonth : totalSpent;

  // Real Transaction-based Stats
  const now = new Date();
  const todayStr = now.toDateString();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const getFilteredTotal = (filterFn) => {
    return transactions
      .filter(tx => {
        const matchesCategory = selectedFilter === 'All' ? true : tx.category === selectedFilter;
        return filterFn(new Date(tx.timestamp)) && matchesCategory;
      })
      .reduce((s, tx) => s + tx.amount, 0);
  };

  const spentToday = getFilteredTotal(d => d.toDateString() === todayStr);
  const spentWeekly = getFilteredTotal(d => d >= oneWeekAgo);
  const spentMonthlyReal = getFilteredTotal(d => d >= startOfMonth);

  // Fallback Monthly to displaySpent if no transactions found (for demo compatibility)
  const displayMonthly = transactions.length > 0 ? spentMonthlyReal : displaySpent;

  const handleStartEdit = (category, currentLimit) => {
    setEditingCategory(category);
    setNewLimit(currentLimit.toString());
  };

  const handleSaveLimit = () => {
    if (editingCategory) {
      updateBudget(editingCategory, parseFloat(newLimit) || 0);
      setEditingCategory(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme === 'light' ? '#F8FAFC' : '#0A0A0B' }]}>
      <StatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} backgroundColor={theme === 'light' ? '#F8FAFC' : '#0A0A0B'} />

      {/* ── Edit Limit Modal ─────────────────────────────────────── */}
      <Modal
        visible={!!editingCategory}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingCategory(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setEditingCategory(null)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <View style={[styles.modalContent, { backgroundColor: theme === 'light' ? '#FFFFFF' : '#1A1A1B' }]}>
              <Text style={[styles.modalTitle, { color: theme === 'light' ? '#0F172A' : '#FFFFFF' }]}>
                {editingCategory === 'Total' ? 'Set Total Budget' : `Set ${editingCategory} Limit`}
              </Text>
              <Text style={styles.modalSubtitle}>
                {editingCategory === 'Total' 
                  ? 'Adjust your overall monthly spending target'
                  : 'How much do you want to spend?'}
              </Text>

              <View style={[styles.modalInputWrapper, { backgroundColor: theme === 'light' ? '#F8FAFC' : '#0F172A' }]}>
                <Text style={styles.modalCurrency}>₱</Text>
                <TextInput
                  style={[styles.modalInput, { color: theme === 'light' ? '#4F46E5' : '#818CF8' }]}
                  value={newLimit}
                  onChangeText={setNewLimit}
                  keyboardType="numeric"
                  autoFocus
                  placeholder="0"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalCancel]}
                  onPress={() => setEditingCategory(null)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalSave]}
                  onPress={handleSaveLimit}
                >
                  <LinearGradient
                    colors={['#4F46E5', '#6366F1']}
                    style={styles.modalSaveGradient}
                  >
                    <Text style={styles.modalSaveText}>Save Limit</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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

          <View style={styles.heroMainRow}>
            <View style={styles.heroGroup}>
              <View style={styles.heroLabelRow}>
                <Text style={styles.heroLabelSmall}>Total Money</Text>
                <TouchableOpacity 
                  onPress={() => handleStartEdit('Total', overallBudget)}
                  style={styles.heroEditButton}
                >
                  <Text style={styles.heroEditIcon}>✏️</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.heroValueLarge}>₱{(overallBudget - totalAllocated).toFixed(0)}</Text>
            </View>
            <View style={styles.heroVerticalDivider} />
            <View style={styles.heroGroup}>
              <Text style={styles.heroLabelSmall}>Net Balance</Text>
              <Text style={styles.heroValueLarge}>₱{(overallBudget - totalSpent).toFixed(0)}</Text>
            </View>
          </View>

          <View style={styles.heroProgressArea}>
            <View style={styles.heroProgressBarTrack}>
              <View style={[styles.heroProgressBarFill, { width: `${(displaySpent / (displayAllocated || 1)) * 100}%` }]} />
            </View>
            <Text style={styles.heroProgressText}>
              {displayAllocated > 0 ? ((displaySpent / displayAllocated) * 100).toFixed(0) : 0}%
            </Text>
          </View>



          <View style={styles.heroStatsGrid}>

            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>LIMIT</Text>
              <Text style={styles.heroStatValue}>₱{displayAllocated.toFixed(0)}</Text>
            </View>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>SPENT</Text>
              <Text style={styles.heroStatValue}>₱{displaySpent.toFixed(0)}</Text>
            </View>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>DAYS</Text>
              <Text style={styles.heroStatValue}>{daysLeft}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Category Filter for Insights ──────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {['All', ...categories].map(cat => (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedFilter(cat)}
              style={[
                styles.filterChip,
                selectedFilter === cat && styles.filterChipActive,
                { backgroundColor: theme === 'light' ? '#FFFFFF' : '#1A1A1B', borderColor: theme === 'light' ? '#E2E8F0' : '#2A2A2B' },
                selectedFilter === cat && { backgroundColor: theme === 'light' ? '#4F46E5' : '#818CF8', borderColor: '#4F46E5' }
              ]}
            >
              <Text style={[
                styles.filterChipText,
                { color: theme === 'light' ? '#64748B' : '#94A3B8' },
                selectedFilter === cat && { color: '#FFFFFF' }
              ]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Insights Gallery ────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.insightsScroll}
        >
          <View style={[styles.insightCard, { backgroundColor: theme === 'light' ? '#F5F3FF' : '#1E1B4B', borderColor: theme === 'light' ? 'rgba(79, 70, 229, 0.2)' : 'rgba(129, 140, 248, 0.3)' }]}>
            <Text style={styles.insightEmoji}>📉</Text>
            <Text style={[styles.insightLabel, { color: theme === 'light' ? '#475569' : '#C7D2FE' }]}>Daily Spent</Text>
            <Text style={[styles.insightValue, { color: theme === 'light' ? '#4F46E5' : '#818CF8' }]}>
              ₱{spentToday.toFixed(0)}
            </Text>
          </View>

          <View style={[styles.insightCard, { backgroundColor: theme === 'light' ? '#FDF2F8' : '#500724', borderColor: theme === 'light' ? 'rgba(236, 72, 153, 0.2)' : 'rgba(244, 114, 182, 0.3)' }]}>
            <Text style={styles.insightEmoji}>📅</Text>
            <Text style={[styles.insightLabel, { color: theme === 'light' ? '#475569' : '#FBCFE8' }]}>Weekly Spent</Text>
            <Text style={[styles.insightValue, { color: theme === 'light' ? '#EC4899' : '#F472B6' }]}>
              ₱{spentWeekly.toFixed(0)}
            </Text>
          </View>

          <View style={[styles.insightCard, { backgroundColor: theme === 'light' ? '#F0FDF4' : '#064E3B', borderColor: theme === 'light' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(52, 211, 153, 0.3)' }]}>
            <Text style={styles.insightEmoji}>💰</Text>
            <Text style={[styles.insightLabel, { color: theme === 'light' ? '#475569' : '#A7F3D0' }]}>Monthly Spent</Text>
            <Text style={[styles.insightValue, { color: theme === 'light' ? '#10B981' : '#34D399' }]}>
              ₱{displayMonthly.toFixed(0)}
            </Text>
          </View>

          <View style={[styles.insightCard, { backgroundColor: theme === 'light' ? '#FFFBEB' : '#78350F', borderColor: theme === 'light' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(251, 191, 36, 0.3)' }]}>
            <Text style={styles.insightEmoji}>🔥</Text>
            <Text style={[styles.insightLabel, { color: theme === 'light' ? '#475569' : '#FDE68A' }]}>Spend Streak</Text>
            <Text style={[styles.insightValue, { color: theme === 'light' ? '#F59E0B' : '#FBBF24' }]}>
              {transactions.length > 0 ? '1 Day' : '0 Days'}
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.insightCard, styles.resetStatsCard, { backgroundColor: theme === 'light' ? '#F8FAFC' : '#111112', borderColor: theme === 'light' ? '#E2E8F0' : '#2A2A2B' }]}
            onPress={resetTransactions}
            activeOpacity={0.7}
          >
            <Text style={styles.insightEmoji}>↻</Text>
            <Text style={[styles.insightLabel, { color: theme === 'light' ? '#64748B' : '#94A3B8' }]}>Reset Stats</Text>
            <Text style={[styles.insightValue, { fontSize: 14, color: theme === 'light' ? '#94A3B8' : '#64748B' }]}>Clear History</Text>
          </TouchableOpacity>
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
                    ₱{spent.toFixed(0)} spent of ₱{allocated.toFixed(0)}
                  </Text>
                </View>

                <View style={styles.cardRight}>
                  <View style={[
                    styles.balancePill,
                    { backgroundColor: isOverBudget ? 'rgba(239,68,68,0.1)' : (theme === 'light' ? 'rgba(16,185,129,0.1)' : 'rgba(52,211,153,0.1)') },
                  ]}>
                    <Text style={[
                      styles.balanceText,
                      { color: isOverBudget ? '#EF4444' : '#10B981' },
                    ]}>
                      ₱{Math.abs(balance).toFixed(0)} left
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleStartEdit(category, allocated)}
                    style={styles.editButtonTop}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.editIconLarge}>✏️</Text>
                  </TouchableOpacity>
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
                <View style={styles.spendActionRow}>
                  <View style={[styles.spendInputWrapper, allocated === 0 && styles.spendDisabled, { backgroundColor: theme === 'light' ? '#F8FAFC' : '#1F2937' }]}>
                    <Text style={styles.spendPesoPrefix}>₱</Text>
                    <TextInput
                      style={[styles.spendInput, { color: theme === 'light' ? '#0F172A' : '#FFFFFF' }]}
                      value={manualSpendAmounts[category] || ''}
                      onChangeText={(val) => setManualSpendAmounts(prev => ({ ...prev, [category]: val }))}
                      placeholder="0"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      editable={allocated > 0}
                    />
                  </View>
                  <TouchableOpacity
                    style={[styles.spendButtonAction, allocated === 0 && styles.spendDisabled, { backgroundColor: theme === 'light' ? '#4F46E5' : '#818CF8' }]}
                    onPress={() => handleManualSpend(category)}
                    disabled={allocated <= 0}
                  >
                    <Text style={styles.spendButtonText}>Spend</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}

        {/* ── Activity Pulse ────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { marginTop: 12, color: theme === 'light' ? '#0F172A' : '#FFFFFF' }]}>Activity Pulse</Text>
        <View style={[styles.activityCard, { backgroundColor: theme === 'light' ? '#FFFFFF' : '#111112', borderColor: theme === 'light' ? '#F1F5F9' : '#2A2A2B' }]}>
          {transactions.length === 0 ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: '#94A3B8' }}>No activity yet</Text>
            </View>
          ) : (
            transactions.map((item, idx, arr) => (
              <View key={item.id} style={[styles.activityItem, idx === arr.length - 1 && { borderBottomWidth: 0 }, { borderBottomColor: theme === 'light' ? '#F1F5F9' : '#2A2A2B' }]}>
                <View style={[styles.activityIconCircle, { backgroundColor: theme === 'light' ? '#F8FAFC' : '#1F2937' }]}>
                  <Text style={styles.activityEmoji}>{ICONS[item.category] || '📦'}</Text>
                </View>
                <View style={styles.activityMeta}>
                  <Text style={[styles.activityLabel, { color: theme === 'light' ? '#0F172A' : '#FFFFFF' }]}>{item.category}</Text>
                  <Text style={[styles.activityTime, { color: theme === 'light' ? '#94A3B8' : '#64748B' }]}>
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <View style={styles.activityRight}>
                  <Text style={[styles.activityAmount, { color: '#EF4444' }]}>
                    -₱{item.amount.toFixed(0)}
                  </Text>
                  <TouchableOpacity 
                    onPress={() => refundTransaction(item.id)}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.refundText}>↺ Refund</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* ── Reset Button ─────────────────────────────────────────── */}
        <View style={styles.resetRow}>
          <TouchableOpacity 
            style={[styles.resetButtonHalf, { backgroundColor: theme === 'light' ? '#FFFFFF' : '#1A1A1B', borderColor: theme === 'light' ? '#E2E8F0' : '#2A2A2B' }]} 
            onPress={resetToDemo} 
            activeOpacity={0.7}
          >
            <Text style={[styles.resetButtonText, { color: theme === 'light' ? '#64748B' : '#94A3B8' }]}>↻  Reset Demo</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.resetButtonHalf, { backgroundColor: theme === 'light' ? '#FFFFFF' : '#1A1A1B', borderColor: theme === 'light' ? '#FEE2E2' : '#450A0A' }]} 
            onPress={resetAllBudgets} 
            activeOpacity={0.7}
          >
            <Text style={[styles.resetButtonText, { color: '#EF4444' }]}>🗑️  Clear All</Text>
          </TouchableOpacity>
        </View>

        {/* ── Test Notification Button ─────────────────────────────── */}
        <TouchableOpacity
          style={[styles.resetButton, { marginTop: 12, backgroundColor: theme === 'light' ? '#FFFFFF' : '#1A1A1B', borderColor: theme === 'light' ? 'rgba(79, 70, 229, 0.2)' : 'rgba(129, 140, 248, 0.2)' }]}
          onPress={async () => {
            const Notifications = require('expo-notifications');
            await Notifications.scheduleNotificationAsync({
              content: {
                title: '📍 Welcome to Starbucks!',
                body: 'You have ₱20.00 left for Coffee. Your safe spend today is ₱2.50.',
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
    backgroundColor: '#0A0A0B',
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

  // ── Hero Card ─────────────────────────────────────────────────
  heroCard: {
    borderRadius: 32,
    padding: 24,
    marginBottom: 28,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  heroMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  heroGroup: {
    flex: 1,
    alignItems: 'center',
  },
  heroVerticalDivider: {
    width: 1,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 16,
  },
  heroLabelSmall: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  heroEditButton: {
    padding: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 6,
  },
  heroEditIcon: {
    fontSize: 10,
  },
  heroValueLarge: {
    color: '#FFFFFF',
    fontSize: 60,
    fontWeight: '900',
    letterSpacing: -1.5,
    textAlign: 'center',
  },
  heroProgressArea: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroProgressBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 4,
    marginRight: 12,
    overflow: 'hidden',
  },
  heroProgressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  heroProgressText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    width: 32,
    textAlign: 'right',
  },
  heroBurnRow: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    alignSelf: 'center',
    marginBottom: 20,
  },
  heroBurnTextSmall: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
    flex: 1,
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  heroStatValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },

  // ── Insights Gallery ──────────────────────────────────────────
  insightsScroll: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  insightCard: {
    width: 130,
    height: 120,
    borderRadius: 24,
    padding: 16,
    marginRight: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetStatsCard: {
    borderStyle: 'dashed',
  },
  insightEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  insightLabel: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  insightValue: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
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
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButtonTop: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 10,
  },
  editIconLarge: {
    fontSize: 14,
  },
  cardTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '700',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  limitEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  editIcon: {
    fontSize: 12,
    marginLeft: 6,
    opacity: 0.6,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '600',
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
    justifyContent: 'flex-end',
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
  spendActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  spendInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: 90,
  },
  spendPesoPrefix: {
    fontSize: 14,
    color: '#94A3B8',
    marginRight: 4,
    fontWeight: '700',
  },
  spendInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    padding: 0,
  },
  spendButtonAction: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  spendButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  spendDisabled: {
    opacity: 0.4,
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
  activityRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  refundText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4F46E5',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ── Bottom Buttons ─────────────────────────────────────────────
  resetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 32,
  },
  resetButtonHalf: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  // ── Filter Chips ─────────────────────────────────────────────
  filterScroll: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterChipActive: {
    borderWidth: 0,
    elevation: 4,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  // ── Modal Styles ──────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    maxWidth: 400,
  },
  modalContent: {
    borderRadius: 32,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  modalSubtitle: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 24,
  },
  modalInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 20,
    marginBottom: 24,
  },
  modalCurrency: {
    fontSize: 24,
    fontWeight: '800',
    color: '#94A3B8',
    marginRight: 8,
  },
  modalInput: {
    fontSize: 28,
    fontWeight: '800',
    flex: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancel: {
    backgroundColor: '#F1F5F9',
  },
  modalCancelText: {
    color: '#64748B',
    fontWeight: '700',
    fontSize: 16,
  },
  modalSave: {
    overflow: 'hidden',
  },
  modalSaveGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
});
