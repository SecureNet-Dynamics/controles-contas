/**
 * Database abstraction layer.
 * Uses Supabase when env vars are configured, otherwise falls back to localStorage.
 */
import { supabase, isSupabaseEnabled } from './supabase';
import type { Bill, Income, Goal, Reminder, Notification, FutureTransaction } from '../types';

// ── Local Storage helpers ──────────────────────────────────────────────────

function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function lsSet(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* quota exceeded */ }
}

// Evita que uma consulta ao Supabase deixe a tela travada para sempre (ex.:
// perda de conexão) — depois do prazo, cai para o cache local em vez de
// ficar esperando indefinidamente.
function withTimeout<T>(promise: PromiseLike<T>, ms = 8000): Promise<T | null> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<null>(resolve => setTimeout(() => resolve(null), ms)),
  ]);
}

// ── Mappers between TypeScript (camelCase) and Postgres (snake_case) ──────────

function mapBillToDb(b: Bill, userId: string) {
  return {
    id: b.id,
    user_id: userId,
    name: b.name,
    amount: b.amount,
    due_date: b.dueDate,
    paid: b.paid,
    paid_at: b.paidAt || null,
    category: b.category,
    description: b.description || null,
    installments: b.installments || null,
    current_installment: b.currentInstallment || null,
    recurring: b.recurring || false,
  };
}

function mapBillFromDb(row: any): Bill {
  return {
    id: row.id,
    name: row.name,
    amount: typeof row.amount === 'string' ? parseFloat(row.amount) : row.amount,
    dueDate: row.due_date,
    paid: row.paid,
    paidAt: row.paid_at || undefined,
    category: row.category,
    description: row.description || undefined,
    installments: row.installments || undefined,
    currentInstallment: row.current_installment || undefined,
    recurring: row.recurring || false,
  };
}

function mapIncomeToDb(i: Income, userId: string) {
  return {
    id: i.id,
    user_id: userId,
    description: i.description,
    amount: i.amount,
    date: i.date,
    category: i.category,
    received: i.received,
    recurring: i.recurring,
    recurring_period: i.recurringPeriod || null,
  };
}

function mapIncomeFromDb(row: any): Income {
  return {
    id: row.id,
    description: row.description,
    amount: typeof row.amount === 'string' ? parseFloat(row.amount) : row.amount,
    date: row.date,
    category: row.category,
    received: row.received,
    recurring: row.recurring,
    recurringPeriod: (row.recurring_period as Income['recurringPeriod']) || undefined,
  };
}

function mapGoalToDb(g: Goal, userId: string) {
  return {
    id: g.id,
    user_id: userId,
    category: g.category,
    limit_amount: g.limitAmount,
    period: g.period,
    color: g.color || null,
  };
}

function mapGoalFromDb(row: any): Goal {
  return {
    id: row.id,
    category: row.category,
    limitAmount: typeof row.limit_amount === 'string' ? parseFloat(row.limit_amount) : row.limit_amount,
    period: row.period,
    color: row.color || undefined,
  };
}

function mapReminderToDb(r: Reminder, userId: string) {
  return {
    id: r.id,
    user_id: userId,
    title: r.title,
    description: r.description || null,
    date: r.date,
    time: r.time || null,
    completed: r.completed,
    bill_id: r.billId || null,
  };
}

function mapReminderFromDb(row: any): Reminder {
  return {
    id: row.id,
    title: row.title,
    description: row.description || undefined,
    date: row.date,
    time: row.time || undefined,
    completed: row.completed,
    billId: row.bill_id || undefined,
  };
}

// ── Bills ──────────────────────────────────────────────────────────────────

export async function getBills(userId: string): Promise<Bill[]> {
  if (isSupabaseEnabled && supabase) {
    const result = await withTimeout(supabase
      .from('bills')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: true }));
    if (result && !result.error && result.data) return result.data.map(mapBillFromDb);
  }
  return lsGet<Bill[]>('bills', []);
}

export async function saveBills(bills: Bill[], userId?: string): Promise<void> {
  lsSet('bills', bills);
  if (isSupabaseEnabled && supabase && userId) {
    // Delete existing and bulk upsert
    // To prevent orphans or duplication, standard Supabase upsert will match primary keys.
    await supabase.from('bills').upsert(
      bills.map(b => mapBillToDb(b, userId))
    );
  }
}

// ── Incomes ────────────────────────────────────────────────────────────────

export async function getIncomes(userId: string): Promise<Income[]> {
  if (isSupabaseEnabled && supabase) {
    const result = await withTimeout(supabase
      .from('incomes')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false }));
    if (result && !result.error && result.data) return result.data.map(mapIncomeFromDb);
  }
  return lsGet<Income[]>('incomes', []);
}

export async function saveIncomes(incomes: Income[], userId?: string): Promise<void> {
  lsSet('incomes', incomes);
  if (isSupabaseEnabled && supabase && userId) {
    await supabase.from('incomes').upsert(
      incomes.map(i => mapIncomeToDb(i, userId))
    );
  }
}

// ── Goals ──────────────────────────────────────────────────────────────────

export async function getGoals(userId: string): Promise<Goal[]> {
  if (isSupabaseEnabled && supabase) {
    const result = await withTimeout(supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId));
    if (result && !result.error && result.data) return result.data.map(mapGoalFromDb);
  }
  return lsGet<Goal[]>('goals', []);
}

export async function saveGoals(goals: Goal[], userId?: string): Promise<void> {
  lsSet('goals', goals);
  if (isSupabaseEnabled && supabase && userId) {
    await supabase.from('goals').upsert(
      goals.map(g => mapGoalToDb(g, userId))
    );
  }
}

// ── Reminders ─────────────────────────────────────────────────────────────

export async function getReminders(userId: string): Promise<Reminder[]> {
  if (isSupabaseEnabled && supabase) {
    const result = await withTimeout(supabase
      .from('reminders')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true }));
    if (result && !result.error && result.data) return result.data.map(mapReminderFromDb);
  }
  return lsGet<Reminder[]>('reminders', []);
}

export async function saveReminders(reminders: Reminder[], userId?: string): Promise<void> {
  lsSet('reminders', reminders);
  if (isSupabaseEnabled && supabase && userId) {
    await supabase.from('reminders').upsert(
      reminders.map(r => mapReminderToDb(r, userId))
    );
  }
}

// ── Available money (saldo atual) ───────────────────────────────────────────

export async function getAvailableMoney(userId?: string): Promise<number> {
  if (isSupabaseEnabled && supabase && userId) {
    const result = await withTimeout(supabase
      .from('user_prefs')
      .select('available_money')
      .eq('user_id', userId)
      .maybeSingle());
    if (result && !result.error && result.data) {
      return typeof result.data.available_money === 'string'
        ? parseFloat(result.data.available_money)
        : result.data.available_money;
    }
  }
  return parseFloat(localStorage.getItem('availableMoney') ?? '0') || 0;
}

export async function saveAvailableMoney(value: number, userId?: string): Promise<void> {
  localStorage.setItem('availableMoney', value.toString());
  if (isSupabaseEnabled && supabase && userId) {
    await supabase.from('user_prefs').upsert({
      user_id: userId,
      available_money: value,
      updated_at: new Date().toISOString(),
    });
  }
}

// ── Notifications (local only) ──────────────────────────────────────────────

export function getNotifications(): Notification[] {
  return lsGet<Notification[]>('notifications', []);
}
export function saveNotifications(n: Notification[]) { lsSet('notifications', n); }

// ── Future transactions (entradas previstas) ────────────────────────────────

function mapFutureTransactionToDb(t: FutureTransaction, userId: string) {
  return {
    id: t.id,
    user_id: userId,
    description: t.description,
    amount: t.amount,
    expected_date: t.expectedDate,
    received: t.received,
  };
}

function mapFutureTransactionFromDb(row: any): FutureTransaction {
  return {
    id: row.id,
    description: row.description,
    amount: typeof row.amount === 'string' ? parseFloat(row.amount) : row.amount,
    expectedDate: row.expected_date,
    received: row.received,
  };
}

export async function getFutureTransactions(userId?: string): Promise<FutureTransaction[]> {
  if (isSupabaseEnabled && supabase && userId) {
    const result = await withTimeout(supabase
      .from('future_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('expected_date', { ascending: true }));
    if (result && !result.error && result.data) return result.data.map(mapFutureTransactionFromDb);
  }
  return lsGet<FutureTransaction[]>('futureTransactions', []);
}

export async function saveFutureTransactions(t: FutureTransaction[], userId?: string): Promise<void> {
  lsSet('futureTransactions', t);
  if (isSupabaseEnabled && supabase && userId) {
    await supabase.from('future_transactions').upsert(
      t.map(item => mapFutureTransactionToDb(item, userId))
    );
  }
}
