/**
 * Database abstraction layer.
 * Uses Supabase when env vars are configured, otherwise falls back to localStorage.
 */
import { supabase, isSupabaseEnabled } from './supabase';
import type { Bill, Income, Goal, Reminder, Notification, FutureTransaction } from '../types';

export type SaveResult = { ok: true } | { ok: false; message: string };

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

// Salva de verdade, com 1 nova tentativa se der timeout/erro na primeira vez
// (ex.: rede instável no celular). Sem isso, uma gravação que falha em
// silêncio faz o dado sumir no próximo recarregamento — parecia salvo (o
// estado local mostrava certo) mas nunca chegou na nuvem de fato.
async function withRetry(
  attempt: () => PromiseLike<{ error: { message: string } | null }>
): Promise<{ ok: true } | { ok: false; message: string }> {
  for (let i = 0; i < 2; i++) {
    const result = await withTimeout(attempt(), 10000);
    if (result && !result.error) return { ok: true };
    if (i === 0) await new Promise(r => setTimeout(r, 1000));
    else return { ok: false, message: result?.error?.message || 'Tempo esgotado ao salvar' };
  }
  return { ok: false, message: 'Tempo esgotado ao salvar' };
}

// Mesma ideia para leitura: tenta de novo antes de desistir e cair para o
// cache local, para uma rede lenta (ex.: celular) não parecer "sem dados".
async function fetchWithRetry<T>(attempt: () => PromiseLike<{ data: T | null; error: unknown }>): Promise<T | null> {
  for (let i = 0; i < 2; i++) {
    const result = await withTimeout(attempt(), 8000);
    if (result && !result.error && result.data) return result.data;
    if (i === 0) await new Promise(r => setTimeout(r, 800));
  }
  return null;
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
    const client = supabase;
    const data = await fetchWithRetry(() => client
      .from('bills')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: true }));
    if (data) return data.map(mapBillFromDb);
  }
  return lsGet<Bill[]>('bills', []);
}

// Remove de verdade da nuvem — o upsert acima nunca apaga linhas que saíram
// da lista local, então sem isso uma conta excluída simplesmente reaparecia
// no próximo login/dispositivo.
export async function deleteBill(id: string, userId?: string): Promise<SaveResult> {
  if (!isSupabaseEnabled || !supabase || !userId) return { ok: true };
  const client = supabase;
  return withRetry(() => client.from('bills').delete().eq('id', id).eq('user_id', userId));
}

export async function saveBills(bills: Bill[], userId?: string): Promise<SaveResult> {
  lsSet('bills', bills);
  if (!isSupabaseEnabled || !supabase || !userId || bills.length === 0) return { ok: true };
  const client = supabase;
  return withRetry(() => client.from('bills').upsert(bills.map(b => mapBillToDb(b, userId))));
}

// ── Incomes ────────────────────────────────────────────────────────────────

export async function getIncomes(userId: string): Promise<Income[]> {
  if (isSupabaseEnabled && supabase) {
    const client = supabase;
    const data = await fetchWithRetry(() => client
      .from('incomes')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false }));
    if (data) return data.map(mapIncomeFromDb);
  }
  return lsGet<Income[]>('incomes', []);
}

export async function deleteIncome(id: string, userId?: string): Promise<SaveResult> {
  if (!isSupabaseEnabled || !supabase || !userId) return { ok: true };
  const client = supabase;
  return withRetry(() => client.from('incomes').delete().eq('id', id).eq('user_id', userId));
}

export async function saveIncomes(incomes: Income[], userId?: string): Promise<SaveResult> {
  lsSet('incomes', incomes);
  if (!isSupabaseEnabled || !supabase || !userId || incomes.length === 0) return { ok: true };
  const client = supabase;
  return withRetry(() => client.from('incomes').upsert(incomes.map(i => mapIncomeToDb(i, userId))));
}

// ── Goals ──────────────────────────────────────────────────────────────────

export async function getGoals(userId: string): Promise<Goal[]> {
  if (isSupabaseEnabled && supabase) {
    const client = supabase;
    const data = await fetchWithRetry(() => client
      .from('goals')
      .select('*')
      .eq('user_id', userId));
    if (data) return data.map(mapGoalFromDb);
  }
  return lsGet<Goal[]>('goals', []);
}

export async function deleteGoal(id: string, userId?: string): Promise<SaveResult> {
  if (!isSupabaseEnabled || !supabase || !userId) return { ok: true };
  const client = supabase;
  return withRetry(() => client.from('goals').delete().eq('id', id).eq('user_id', userId));
}

export async function saveGoals(goals: Goal[], userId?: string): Promise<SaveResult> {
  lsSet('goals', goals);
  if (!isSupabaseEnabled || !supabase || !userId || goals.length === 0) return { ok: true };
  const client = supabase;
  return withRetry(() => client.from('goals').upsert(goals.map(g => mapGoalToDb(g, userId))));
}

// ── Reminders ─────────────────────────────────────────────────────────────

export async function getReminders(userId: string): Promise<Reminder[]> {
  if (isSupabaseEnabled && supabase) {
    const client = supabase;
    const data = await fetchWithRetry(() => client
      .from('reminders')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true }));
    if (data) return data.map(mapReminderFromDb);
  }
  return lsGet<Reminder[]>('reminders', []);
}

export async function deleteReminder(id: string, userId?: string): Promise<SaveResult> {
  if (!isSupabaseEnabled || !supabase || !userId) return { ok: true };
  const client = supabase;
  return withRetry(() => client.from('reminders').delete().eq('id', id).eq('user_id', userId));
}

export async function saveReminders(reminders: Reminder[], userId?: string): Promise<SaveResult> {
  lsSet('reminders', reminders);
  if (!isSupabaseEnabled || !supabase || !userId || reminders.length === 0) return { ok: true };
  const client = supabase;
  return withRetry(() => client.from('reminders').upsert(reminders.map(r => mapReminderToDb(r, userId))));
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

export async function saveAvailableMoney(value: number, userId?: string): Promise<SaveResult> {
  localStorage.setItem('availableMoney', value.toString());
  if (!isSupabaseEnabled || !supabase || !userId) return { ok: true };
  const client = supabase;
  return withRetry(() => client.from('user_prefs').upsert({
    user_id: userId,
    available_money: value,
    updated_at: new Date().toISOString(),
  }));
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
    const client = supabase;
    const data = await fetchWithRetry(() => client
      .from('future_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('expected_date', { ascending: true }));
    if (data) return data.map(mapFutureTransactionFromDb);
  }
  return lsGet<FutureTransaction[]>('futureTransactions', []);
}

export async function deleteFutureTransaction(id: string, userId?: string): Promise<SaveResult> {
  if (!isSupabaseEnabled || !supabase || !userId) return { ok: true };
  const client = supabase;
  return withRetry(() => client.from('future_transactions').delete().eq('id', id).eq('user_id', userId));
}

export async function saveFutureTransactions(t: FutureTransaction[], userId?: string): Promise<SaveResult> {
  lsSet('futureTransactions', t);
  if (!isSupabaseEnabled || !supabase || !userId || t.length === 0) return { ok: true };
  const client = supabase;
  return withRetry(() => client.from('future_transactions').upsert(t.map(item => mapFutureTransactionToDb(item, userId))));
}
