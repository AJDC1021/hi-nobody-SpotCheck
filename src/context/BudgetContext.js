import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Storage Keys ────────────────────────────────────────────────
const BUDGETS_KEY = '@spotcheck_budgets';
const LOCATIONS_KEY = '@spotcheck_locations';

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
  const [savedLocations, setSavedLocations] = useState(DEMO_LOCATIONS);
  const [isLoaded, setIsLoaded] = useState(false);

  // ── Hydrate from AsyncStorage on mount ─────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [rawBudgets, rawLocations] = await Promise.all([
          AsyncStorage.getItem(BUDGETS_KEY),
          AsyncStorage.getItem(LOCATIONS_KEY),
        ]);
        if (rawBudgets) setBudgets(JSON.parse(rawBudgets));
        if (rawLocations) setSavedLocations(JSON.parse(rawLocations));
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
  }, []);

  // ── Update allocated budget ────────────────────────────────────
  const updateBudget = useCallback((category, allocated) => {
    setBudgets((prev) => ({
      ...prev,
      [category]: { allocated, spent: prev[category]?.spent ?? 0 },
    }));
  }, []);

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
    await AsyncStorage.multiRemove([BUDGETS_KEY, LOCATIONS_KEY]);
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

  const value = {
    budgets,
    savedLocations,
    isLoaded,
    getBalance,
    getDailyAllowance,
    getDaysLeftInMonth,
    getProgress,
    spendFromCategory,
    updateBudget,
    addCategory,
    addLocation,
    removeLocation,
    resetToDemo,
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
