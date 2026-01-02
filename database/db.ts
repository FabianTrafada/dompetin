import * as SQLite from 'expo-sqlite';

const DB_NAME = 'dompetin.db';

export interface Transaction {
  id?: number;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string; // ISO date string
  image?: string | null;
  createdAt?: string;
}

export interface Category {
  id?: number;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
}

export interface Budget {
  id?: number;
  category: string;
  amount: number;
  period: 'daily' | 'weekly' | 'monthly';
  createdAt?: string;
}

class Database {
  private db: SQLite.SQLiteDatabase | null = null;

  async init() {
    if (this.db) return this.db;

    this.db = await SQLite.openDatabaseAsync(DB_NAME);
    await this.createTables();
    await this.seedDefaultCategories();
    return this.db;
  }

  private async createTables() {
    if (!this.db) throw new Error('Database not initialized');

    // Transactions table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        date TEXT NOT NULL,
        image TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Attempt to add image column if it doesn't exist (for migration)
    try {
      await this.db.execAsync('ALTER TABLE transactions ADD COLUMN image TEXT;');
    } catch (e) {
      // Column likely already exists
    }

    // Categories table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
        icon TEXT NOT NULL,
        color TEXT NOT NULL
      );
    `);

    // Budgets table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS budgets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        period TEXT NOT NULL CHECK(period IN ('daily', 'weekly', 'monthly')),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for better query performance
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
      CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
      CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
      CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category);
    `);
  }

  private async seedDefaultCategories() {
    if (!this.db) throw new Error('Database not initialized');

    const count = await this.db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM categories'
    );

    if (count && count.count > 0) return; // Already seeded

    const defaultCategories = [
      // Income categories
      { name: 'Salary', type: 'income', icon: 'briefcase', color: '#10b981' },
      { name: 'Freelance', type: 'income', icon: 'laptop', color: '#3b82f6' },
      { name: 'Investment', type: 'income', icon: 'chart.line.uptrend.xyaxis', color: '#8b5cf6' },
      { name: 'Gift', type: 'income', icon: 'gift', color: '#ec4899' },
      { name: 'Other Income', type: 'income', icon: 'plus.circle', color: '#06b6d4' },
      
      // Expense categories
      { name: 'Food & Dining', type: 'expense', icon: 'fork.knife', color: '#ef4444' },
      { name: 'Transportation', type: 'expense', icon: 'car', color: '#f59e0b' },
      { name: 'Shopping', type: 'expense', icon: 'cart', color: '#ec4899' },
      { name: 'Entertainment', type: 'expense', icon: 'ticket', color: '#8b5cf6' },
      { name: 'Bills & Utilities', type: 'expense', icon: 'bolt', color: '#3b82f6' },
      { name: 'Healthcare', type: 'expense', icon: 'heart', color: '#f43f5e' },
      { name: 'Education', type: 'expense', icon: 'book', color: '#06b6d4' },
      { name: 'Other Expense', type: 'expense', icon: 'minus.circle', color: '#6b7280' },
    ];

    for (const category of defaultCategories) {
      await this.db.runAsync(
        'INSERT OR IGNORE INTO categories (name, type, icon, color) VALUES (?, ?, ?, ?)',
        [category.name, category.type, category.icon, category.color]
      );
    }
  }

  // Transaction operations
  async addTransaction(transaction: Transaction): Promise<number> {
    if (!this.db) await this.init();

    const result = await this.db!.runAsync(
      'INSERT INTO transactions (type, amount, category, description, date, image) VALUES (?, ?, ?, ?, ?, ?)',
      [transaction.type, transaction.amount, transaction.category, transaction.description || '', transaction.date, transaction.image || null]
    );

    return result.lastInsertRowId;
  }

  async getTransactions(limit?: number): Promise<Transaction[]> {
    if (!this.db) await this.init();

    const query = limit 
      ? `SELECT * FROM transactions ORDER BY date DESC, created_at DESC LIMIT ${limit}`
      : 'SELECT * FROM transactions ORDER BY date DESC, created_at DESC';

    const rows = await this.db!.getAllAsync<Transaction>(query);
    return rows;
  }

  async getTransactionsByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
    if (!this.db) await this.init();

    const rows = await this.db!.getAllAsync<Transaction>(
      'SELECT * FROM transactions WHERE date BETWEEN ? AND ? ORDER BY date DESC, created_at DESC',
      [startDate, endDate]
    );

    return rows;
  }

  async getTransactionsByType(type: 'income' | 'expense'): Promise<Transaction[]> {
    if (!this.db) await this.init();

    const rows = await this.db!.getAllAsync<Transaction>(
      'SELECT * FROM transactions WHERE type = ? ORDER BY date DESC, created_at DESC',
      [type]
    );

    return rows;
  }

  async getTransactionById(id: number): Promise<Transaction | null> {
    if (!this.db) await this.init();
    return await this.db!.getFirstAsync<Transaction>('SELECT * FROM transactions WHERE id = ?', [id]);
  }

  async updateTransaction(id: number, transaction: Partial<Transaction>): Promise<void> {
    if (!this.db) await this.init();

    const fields = [];
    const values = [];

    if (transaction.type) {
      fields.push('type = ?');
      values.push(transaction.type);
    }
    if (transaction.amount !== undefined) {
      fields.push('amount = ?');
      values.push(transaction.amount);
    }
    if (transaction.category) {
      fields.push('category = ?');
      values.push(transaction.category);
    }
    if (transaction.description !== undefined) {
      fields.push('description = ?');
      values.push(transaction.description);
    }
    if (transaction.date) {
      fields.push('date = ?');
      values.push(transaction.date);
    }
    if (transaction.image !== undefined) {
      fields.push('image = ?');
      values.push(transaction.image);
    }

    values.push(id);

    await this.db!.runAsync(
      `UPDATE transactions SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  async deleteTransaction(id: number): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
  }

  // Summary operations
  async getTotalIncome(startDate?: string, endDate?: string): Promise<number> {
    if (!this.db) await this.init();

    let query = "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'income'";
    const params: string[] = [];

    if (startDate && endDate) {
      query += ' AND date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    const result = await this.db!.getFirstAsync<{ total: number }>(query, params);
    return result?.total || 0;
  }

  async getTotalExpense(startDate?: string, endDate?: string): Promise<number> {
    if (!this.db) await this.init();

    let query = "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'expense'";
    const params: string[] = [];

    if (startDate && endDate) {
      query += ' AND date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    const result = await this.db!.getFirstAsync<{ total: number }>(query, params);
    return result?.total || 0;
  }

  async getBalance(startDate?: string, endDate?: string): Promise<number> {
    const income = await this.getTotalIncome(startDate, endDate);
    const expense = await this.getTotalExpense(startDate, endDate);
    return income - expense;
  }

  async getCategoryTotals(type: 'income' | 'expense', startDate?: string, endDate?: string): Promise<{ category: string; total: number }[]> {
    if (!this.db) await this.init();

    let query = 'SELECT category, SUM(amount) as total FROM transactions WHERE type = ? ';
    const params: any[] = [type];

    if (startDate && endDate) {
      query += 'AND date BETWEEN ? AND ? ';
      params.push(startDate, endDate);
    }

    query += 'GROUP BY category ORDER BY total DESC';

    const rows = await this.db!.getAllAsync<{ category: string; total: number }>(query, params);
    return rows;
  }

  async getDailyStats(startDate: string, endDate: string): Promise<{ day: string; income: number; expense: number }[]> {
    if (!this.db) await this.init();

    const query = `
      SELECT 
        strftime('%Y-%m-%d', date, 'localtime') as day,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
      FROM transactions 
      WHERE date BETWEEN ? AND ?
      GROUP BY day
      ORDER BY day
    `;

    const rows = await this.db!.getAllAsync<{ day: string; income: number; expense: number }>(query, [startDate, endDate]);
    return rows;
  }

  // Category operations
  async getCategories(type?: 'income' | 'expense'): Promise<Category[]> {
    if (!this.db) await this.init();

    const query = type 
      ? 'SELECT * FROM categories WHERE type = ? ORDER BY name'
      : 'SELECT * FROM categories ORDER BY type, name';

    const params = type ? [type] : [];
    const rows = await this.db!.getAllAsync<Category>(query, params);
    return rows;
  }

  async addCategory(category: Omit<Category, 'id'>): Promise<number> {
    if (!this.db) await this.init();

    const result = await this.db!.runAsync(
      'INSERT INTO categories (name, type, icon, color) VALUES (?, ?, ?, ?)',
      [category.name, category.type, category.icon, category.color]
    );

    return result.lastInsertRowId;
  }

  async deleteCategory(id: number): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.runAsync('DELETE FROM categories WHERE id = ?', [id]);
  }

  // Budget operations
  async getBudgets(): Promise<Budget[]> {
    if (!this.db) await this.init();
    return await this.db!.getAllAsync<Budget>('SELECT * FROM budgets ORDER BY created_at DESC');
  }

  async addBudget(budget: Omit<Budget, 'id'>): Promise<number> {
    if (!this.db) await this.init();
    const result = await this.db!.runAsync(
      'INSERT INTO budgets (category, amount, period) VALUES (?, ?, ?)',
      [budget.category, budget.amount, budget.period]
    );
    return result.lastInsertRowId;
  }

  async updateBudget(id: number, budget: Partial<Budget>): Promise<void> {
    if (!this.db) await this.init();

    const fields = [];
    const values = [];

    if (budget.amount !== undefined) {
      fields.push('amount = ?');
      values.push(budget.amount);
    }
    if (budget.period) {
      fields.push('period = ?');
      values.push(budget.period);
    }
    if (budget.category) {
      fields.push('category = ?');
      values.push(budget.category);
    }

    if (fields.length === 0) return;

    values.push(id);

    await this.db!.runAsync(
      `UPDATE budgets SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  async deleteBudget(id: number): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.runAsync('DELETE FROM budgets WHERE id = ?', [id]);
  }

  async getBudgetProgress(category: string, period: 'daily' | 'weekly' | 'monthly'): Promise<number> {
    if (!this.db) await this.init();
    
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    if (period === 'daily') {
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'weekly') {
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
      startDate.setDate(diff);
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(diff + 6);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'monthly') {
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
    }

    const result = await this.db!.getFirstAsync<{ total: number }>(
      `SELECT SUM(amount) as total FROM transactions 
       WHERE type = 'expense' 
       AND category = ? 
       AND date BETWEEN ? AND ?`,
      [category, startDate.toISOString(), endDate.toISOString()]
    );

    return result?.total || 0;
  }
}

export const database = new Database();
