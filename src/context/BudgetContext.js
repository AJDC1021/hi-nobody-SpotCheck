import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Storage Keys ────────────────────────────────────────────────
const BUDGETS_KEY = '@spotcheck_budgets';
const LOCATIONS_KEY = '@spotcheck_locations';
const THEME_KEY = '@spotcheck_theme';
const OVERALL_BUDGET_KEY = '@spotcheck_overall_budget';
const TRANSACTIONS_KEY = '@spotcheck_transactions';

// ─── Demo Data (pre-populated for hackathon presentation) ────────
const DEMO_BUDGETS = {
  Coffee: { allocated: 20, spent: 0 },
  Food: { allocated: 150, spent: 0 },
  Tech: { allocated: 0, spent: 0 },
  Transport: { allocated: 60, spent: 0 },
  Entertainment: { allocated: 40, spent: 0 },
};

const DEMO_LOCATIONS = [
  { id: '1', name: 'Starbucks Reserve', lat: 14.5547, lng: 121.0244, category: 'Coffee' },
  { id: '2', name: 'Jollibee Katipunan', lat: 14.6312, lng: 121.0756, category: 'Food' },
  { id: '3', name: 'SM Cyberzone', lat: 14.5876, lng: 121.0568, category: 'Tech' },
];

// ─── Context ─────────────────────────────────────────────────────
const BudgetContext = createContext(null);

export function BudgetProvider({ children }) {
  const [budgets, setBudgets] = useState(DEMO_BUDGETS);
  const [overallBudget, setOverallBudget] = useState(500);
  const [transactions, setTransactions] = useState([]);
  const [savedLocations, setSavedLocations] = useState(DEMO_LOCATIONS);
  const [theme, setTheme] = useState('light');
  const [isLoaded, setIsLoaded] = useState(false);

  // ── Hydrate from AsyncStorage on mount ─────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [rawBudgets, rawLocations, rawTheme, rawOverall, rawTx] = await Promise.all([
          AsyncStorage.getItem(BUDGETS_KEY),
          AsyncStorage.getItem(LOCATIONS_KEY),
          AsyncStorage.getItem(THEME_KEY),
          AsyncStorage.getItem(OVERALL_BUDGET_KEY),
          AsyncStorage.getItem(TRANSACTIONS_KEY),
        ]);
        if (rawBudgets) setBudgets(JSON.parse(rawBudgets));
        if (rawLocations) setSavedLocations(JSON.parse(rawLocations));
        if (rawTheme) setTheme(rawTheme);
        if (rawOverall) setOverallBudget(parseFloat(rawOverall));
        if (rawTx) setTransactions(JSON.parse(rawTx));
      } catch (err) {
        console.warn('[SpotCheck] AsyncStorage hydration failed:', err);
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  // ── Persist whenever budgets change ────────────────────────────
  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets)).catch(console.warn);
  }, [budgets, isLoaded]);

  // ── Persist whenever locations change ──────────────────────────
  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(LOCATIONS_KEY, JSON.stringify(savedLocations)).catch(console.warn);
  }, [savedLocations, isLoaded]);

  // ── Persist whenever theme changes ─────────────────────────────
  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(THEME_KEY, theme).catch(console.warn);
  }, [theme, isLoaded]);

  // ── Persist whenever transactions change ───────────────────────
  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions)).catch(console.warn);
  }, [transactions, isLoaded]);

  // ── Remaining balance for a category ───────────────────────────
  const getBalance = useCallback(
    (category) => {
      const b = budgets[category];
      if (!b) return 0;
      return Math.max(b.allocated - b.spent, 0);
    },
    [budgets],
  );

  // ── Days remaining in the current month ────────────────────────
  const getDaysLeftInMonth = useCallback(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return Math.max(lastDay - now.getDate(), 1); // at least 1 to avoid div/0
  }, []);

  // ── Safe daily allowance = remaining / days left ───────────────
  const getDailyAllowance = useCallback(
    (category) => {
      const remaining = getBalance(category);
      const daysLeft = getDaysLeftInMonth();
      return parseFloat((remaining / daysLeft).toFixed(2));
    },
    [getBalance, getDaysLeftInMonth],
  );

  // ── Spend money from a category ────────────────────────────────
  const spendFromCategory = useCallback((category, amount) => {
    setBudgets((prev) => {
      const entry = prev[category];
      if (!entry) return prev;
      return {
        ...prev,
        [category]: { ...entry, spent: entry.spent + amount },
      };
    });

    // Record transaction
    setTransactions(prev => [
      {
        id: Date.now().toString(),
        category,
        amount,
        timestamp: new Date().toISOString(),
      },
      ...prev
    ].slice(0, 50)); // Keep last 50
  }, []);

  const refundTransaction = useCallback((id) => {
    setTransactions((prev) => {
      const tx = prev.find(t => t.id === id);
      if (!tx) return prev;

      setBudgets(bPrev => {
        const cat = bPrev[tx.category];
        if (!cat) return bPrev;
        return {
          ...bPrev,
          [tx.category]: { ...cat, spent: Math.max(cat.spent - tx.amount, 0) }
        };
      });

      return prev.filter(t => t.id !== id);
    });
  }, []);

  // ── Update allocated budget ────────────────────────────────────
  const updateBudget = useCallback((category, allocated) => {
    if (category === 'Total') {
      setOverallBudget(allocated);
      AsyncStorage.setItem(OVERALL_BUDGET_KEY, allocated.toString());
      return;
    }

    setBudgets((prev) => {
      // Logic: Ensure sum of all categories doesn't exceed overallBudget
      const keys = Object.keys(prev);
      const otherTotal = keys.reduce((s, k) => k === category ? s : s + prev[k].allocated, 0);
      
      // Cap the new allocation at what's left in the overall budget
      const available = Math.max(overallBudget - otherTotal, 0);
      const cappedAllocated = Math.min(allocated, available);

      const next = {
        ...prev,
        [category]: { allocated: cappedAllocated, spent: prev[category]?.spent ?? 0 },
      };
      AsyncStorage.setItem(BUDGETS_KEY, JSON.stringify(next));
      return next;
    });
  }, [overallBudget]);

  // ── Add a new category ─────────────────────────────────────────
  const addCategory = useCallback((category, allocated = 0) => {
    setBudgets((prev) => ({
      ...prev,
      [category]: { allocated, spent: 0 },
    }));
  }, []);

  // ── Save a new pinned location ─────────────────────────────────
  const addLocation = useCallback((location) => {
    setSavedLocations((prev) => [...prev, { ...location, id: Date.now().toString() }]);
  }, []);

  // ── Remove a pinned location ───────────────────────────────────
  const removeLocation = useCallback((id) => {
    setSavedLocations((prev) => prev.filter((loc) => loc.id !== id));
  }, []);

  // ── Reset to demo data (handy for live demo) ──────────────────
  const resetToDemo = useCallback(async () => {
    setBudgets(DEMO_BUDGETS);
    setSavedLocations(DEMO_LOCATIONS);
    setTransactions([]);
    await AsyncStorage.multiRemove([BUDGETS_KEY, LOCATIONS_KEY, TRANSACTIONS_KEY]);
  }, []);

  const resetAllBudgets = useCallback(async () => {
    setBudgets((prev) => {
      const next = {};
      Object.keys(prev).forEach(k => {
        next[k] = { allocated: 0, spent: 0 };
      });
      return next;
    });
    setTransactions([]);
    await AsyncStorage.multiRemove([BUDGETS_KEY, TRANSACTIONS_KEY]);
  }, []);

  const resetTransactions = useCallback(async () => {
    setTransactions([]);
    setBudgets(prev => {
      const next = {};
      Object.keys(prev).forEach(k => {
        next[k] = { ...prev[k], spent: 0 };
      });
      return next;
    });
    await AsyncStorage.removeItem(TRANSACTIONS_KEY);
  }, []);

  // ── Progress ratio (0-1) for progress bars ─────────────────────
  const getProgress = useCallback(
    (category) => {
      const b = budgets[category];
      if (!b || b.allocated === 0) return 0;
      return Math.min(b.spent / b.allocated, 1);
    },
    [budgets],
  );

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const value = {
    budgets,
    overallBudget,
    transactions,
    savedLocations,
    isLoaded,
    getBalance,
    getDailyAllowance,
    getDaysLeftInMonth,
    getProgress,
    spendFromCategory,
    refundTransaction,
    updateBudget,
    addCategory,
    addLocation,
    removeLocation,
    resetToDemo,
    resetAllBudgets,
    resetTransactions,
    theme,
    toggleTheme,
  };

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
}

/** Hook – always call inside a BudgetProvider tree */
export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error('useBudget must be used within a <BudgetProvider>');
  return ctx;
}

export default BudgetContext;
