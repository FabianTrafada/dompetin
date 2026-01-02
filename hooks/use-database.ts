import { Budget, Category, database, Transaction } from '@/database/db';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';

export function useDatabase() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    database.init().then(() => setIsReady(true));
  }, []);

  return { isReady, db: database };
}

export function useTransactions(startDate?: string, endDate?: string, limit?: number) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { isReady, db } = useDatabase();

  const refresh = async () => {
    if (!isReady) return;
    setLoading(true);
    let data;
    if (startDate && endDate) {
      data = await db.getTransactionsByDateRange(startDate, endDate);
    } else {
      data = await db.getTransactions(limit);
    }
    setTransactions(data);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, [isReady, startDate, endDate, limit]);

  const addTransaction = async (transaction: Transaction) => {
    const id = await db.addTransaction(transaction);
    await refresh();
    return id;
  };

  const updateTransaction = async (id: number, transaction: Partial<Transaction>) => {
    await db.updateTransaction(id, transaction);
    await refresh();
  };

  const deleteTransaction = async (id: number) => {
    await db.deleteTransaction(id);
    await refresh();
  };

  return {
    transactions,
    loading,
    refresh,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  };
}

export function useTransaction(id: number) {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const { isReady, db } = useDatabase();

  const refresh = useCallback(async () => {
    if (!isReady || !id) return;
    setLoading(true);
    const data = await db.getTransactionById(id);
    setTransaction(data);
    setLoading(false);
  }, [isReady, id, db]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateTransaction = async (updates: Partial<Transaction>) => {
    if (!isReady || !id) return;
    await db.updateTransaction(id, updates);
    await refresh();
  };

  const deleteTransaction = async () => {
    if (!isReady || !id) return;
    await db.deleteTransaction(id);
  };

  return {
    transaction,
    loading,
    refresh,
    updateTransaction,
    deleteTransaction,
  };
}

export function useCategories(type?: 'income' | 'expense') {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { isReady, db } = useDatabase();

  const refresh = async () => {
    if (!isReady) return;
    setLoading(true);
    const data = await db.getCategories(type);
    setCategories(data);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, [isReady, type]);

  return {
    categories,
    loading,
    refresh,
  };
}

export function useSummary(startDate?: string, endDate?: string) {
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const { isReady, db } = useDatabase();

  const refresh = async () => {
    if (!isReady) return;
    setLoading(true);
    const [incomeTotal, expenseTotal, balanceTotal] = await Promise.all([
      db.getTotalIncome(startDate, endDate),
      db.getTotalExpense(startDate, endDate),
      db.getBalance(startDate, endDate),
    ]);
    setIncome(incomeTotal);
    setExpense(expenseTotal);
    setBalance(balanceTotal);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, [isReady, startDate, endDate]);

  return {
    income,
    expense,
    balance,
    loading,
    refresh,
  };
}

export function useStats(startDate: string, endDate: string) {
  const [dailyStats, setDailyStats] = useState<{ day: string; income: number; expense: number }[]>([]);
  const [categoryIncome, setCategoryIncome] = useState<{ category: string; total: number }[]>([]);
  const [categoryExpense, setCategoryExpense] = useState<{ category: string; total: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const { isReady, db } = useDatabase();

  const refresh = useCallback(async () => {
    if (!isReady) return;
    setLoading(true);
    
    const [daily, inc, exp] = await Promise.all([
      db.getDailyStats(startDate, endDate),
      db.getCategoryTotals('income', startDate, endDate),
      db.getCategoryTotals('expense', startDate, endDate)
    ]);

    setDailyStats(daily);
    setCategoryIncome(inc);
    setCategoryExpense(exp);
    setLoading(false);
  }, [isReady, startDate, endDate, db]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { dailyStats, categoryIncome, categoryExpense, loading, refresh };
}

export function useBudgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const { isReady, db } = useDatabase();

  const refresh = async () => {
    if (!isReady) return;
    setLoading(true);
    const data = await db.getBudgets();
    setBudgets(data);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, [isReady]);

  const addBudget = async (budget: Omit<Budget, 'id'>) => {
    await db.addBudget(budget);
    await refresh();
  };

  const updateBudget = async (id: number, budget: Partial<Budget>) => {
    await db.updateBudget(id, budget);
    await refresh();
  };

  const deleteBudget = async (id: number) => {
    await db.deleteBudget(id);
    await refresh();
  };

  return { budgets, loading, refresh, addBudget, updateBudget, deleteBudget };
}

export function useBudgetProgress(category: string, period: 'daily' | 'weekly' | 'monthly') {
  const [spent, setSpent] = useState(0);
  const { isReady, db } = useDatabase();

  useFocusEffect(
    useCallback(() => {
      if (!isReady) return;
      db.getBudgetProgress(category, period).then(setSpent);
    }, [isReady, category, period])
  );

  return spent;
}
