import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import LoadingScreen from './components/LoadingScreen';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import BillsManager from './components/BillsManager';
import IncomeManager from './components/Income';
import Analytics from './components/Analytics';
import Goals from './components/Goals';
import Calendar from './components/Calendar';
import OpenFinance from './components/OpenFinance';
import Notifications from './components/Notifications';
import Settings from './components/Settings';
import Auth from './components/CadastroForm';

import type { Bill, Income, Goal, Reminder, Notification, FutureTransaction, User } from './types';
import { onAuthChange, signOut, getStoredSessionUser } from './lib/auth';
import { formatCurrency, parseLocalDate, startOfToday } from './utils/formatters';
import {
  getBills,
  saveBills,
  getIncomes,
  saveIncomes,
  getGoals,
  saveGoals,
  getReminders,
  saveReminders,
  getNotifications,
  saveNotifications,
  getFutureTransactions,
  saveFutureTransactions,
  getAvailableMoney,
  saveAvailableMoney,
} from './lib/db';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [user, setUser] = useState<User | null>(null);

  const [bills, setBills] = useState<Bill[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [futureTransactions, setFutureTransactions] = useState<FutureTransaction[]>([]);
  const [availableMoney, setAvailableMoney] = useState<number>(0);

  // Custom wrapper setters to automatically adjust availableMoney cashflow contábil-style
  const setBillsAndDeduct = useCallback((action: React.SetStateAction<Bill[]>) => {
    setBills(prev => {
      const next = typeof action === 'function' ? action(prev) : action;
      prev.forEach(pBill => {
        const nBill = next.find(n => n.id === pBill.id);
        if (nBill && pBill.paid !== nBill.paid) {
          const diff = nBill.paid ? -nBill.amount : nBill.amount;
          setAvailableMoney(m => parseFloat((m + diff).toFixed(2)));
        }
      });
      return next;
    });
  }, []);

  const setIncomesAndAdd = useCallback((action: React.SetStateAction<Income[]>) => {
    setIncomes(prev => {
      const next = typeof action === 'function' ? action(prev) : action;
      prev.forEach(pIncome => {
        const nIncome = next.find(n => n.id === pIncome.id);
        if (nIncome && pIncome.received !== nIncome.received) {
          const diff = nIncome.received ? nIncome.amount : -nIncome.amount;
          setAvailableMoney(m => parseFloat((m + diff).toFixed(2)));
        }
      });
      return next;
    });
  }, []);

  const loadUserData = useCallback(async (userId: string) => {
    const [b, i, g, r, ft, money] = await Promise.all([
      getBills(userId),
      getIncomes(userId),
      getGoals(userId),
      getReminders(userId),
      getFutureTransactions(userId),
      getAvailableMoney(userId),
    ]);
    setBills(b);
    setIncomes(i);
    setGoals(g);
    setReminders(r);
    setFutureTransactions(ft);
    setAvailableMoney(money);
  }, []);

  // ── Session bootstrap ────────────────────────────────────────────────────
  useEffect(() => {
    setNotifications(getNotifications());

    // Os dados só são buscados depois que o onAuthChange confirma a sessão
    // de verdade — ler o cache do localStorage e já disparar a busca causaria
    // uma corrida em que a query sai antes do client anexar o token de auth,
    // voltando vazia por causa do RLS (mesmo com a conta tendo dados salvos).
    let settled = false;
    const unsubscribe = onAuthChange(nextUser => {
      setUser(prevUser => {
        if (nextUser && (!prevUser || prevUser.id !== nextUser.id)) {
          loadUserData(nextUser.id).catch(console.error);
        }
        if (!nextUser) {
          setBills([]);
          setIncomes([]);
          setGoals([]);
          setReminders([]);
          setFutureTransactions([]);
          setAvailableMoney(0);
        }
        return nextUser;
      });
      if (!settled) {
        settled = true;
        setAuthChecked(true);
        setTimeout(() => setIsLoading(false), 1200);
      }
    });

    // Rede de segurança: se o SDK não responder em 5s (ex.: ambiente com
    // Web Locks travado), não deixa o app preso na tela em branco — mostra
    // o cache local (se houver) ou a tela de login.
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        const cached = getStoredSessionUser();
        if (cached) { setUser(cached); loadUserData(cached.id).catch(console.error); }
        setAuthChecked(true);
        setIsLoading(false);
      }
    }, 5000);

    return () => { unsubscribe(); clearTimeout(timeout); };
  }, [loadUserData]);

  // ── Persist to cloud + local cache ──────────────────────────────────────
  useEffect(() => { if (authChecked && user) saveBills(bills, user.id); }, [bills, authChecked, user]);
  useEffect(() => { if (authChecked && user) saveIncomes(incomes, user.id); }, [incomes, authChecked, user]);
  useEffect(() => { if (authChecked && user) saveGoals(goals, user.id); }, [goals, authChecked, user]);
  useEffect(() => { if (authChecked && user) saveReminders(reminders, user.id); }, [reminders, authChecked, user]);
  useEffect(() => { if (authChecked) saveNotifications(notifications); }, [notifications, authChecked]);
  useEffect(() => { if (authChecked && user) saveFutureTransactions(futureTransactions, user.id); }, [futureTransactions, authChecked, user]);
  useEffect(() => { if (authChecked && user) saveAvailableMoney(availableMoney, user.id); }, [availableMoney, authChecked, user]);

  // ── Avisos automáticos de vencimento (hoje ou nos próximos 3 dias) ───────
  useEffect(() => {
    if (!authChecked || !user || bills.length === 0) return;
    const today = startOfToday();
    const todayStr = new Date().toISOString().split('T')[0];

    setNotifications(prev => {
      const additions: Notification[] = [];
      bills.forEach(bill => {
        if (bill.paid) return;
        const diffDays = Math.round((parseLocalDate(bill.dueDate).getTime() - today.getTime()) / 86400000);
        if (diffDays < 0 || diffDays > 3) return;
        const alreadyNotifiedToday = prev.some(n => n.billId === bill.id && n.date.slice(0, 10) === todayStr);
        if (alreadyNotifiedToday) return;
        additions.push({
          id: `${bill.id}-${todayStr}`,
          title: diffDays === 0 ? 'Conta vence hoje!' : `Conta vence em ${diffDays} dia${diffDays > 1 ? 's' : ''}`,
          message: `${bill.name}: ${formatCurrency(bill.amount)}`,
          date: new Date().toISOString(),
          read: false,
          type: 'bill',
          billId: bill.id,
        });
      });
      if (additions.length === 0) return prev;
      return [...additions, ...prev].slice(0, 100);
    });
  }, [bills, authChecked, user]);

  // ── Helpers ────────────────────────────────────────────────────────────
  const addNotification = useCallback((n: Omit<Notification, 'id' | 'read'>) => {
    const newN: Notification = { ...n, id: Date.now().toString(), read: false };
    setNotifications(prev => [newN, ...prev.slice(0, 99)]);
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    loadUserData(userData.id).catch(console.error);
    addNotification({
      title: `Bem-vindo(a), ${userData.nome.split(' ')[0]}!`,
      message: 'Suas finanças estão esperando por você.',
      date: new Date().toISOString(),
      type: 'system',
    });
  };

  const handleLogout = () => {
    signOut().catch(console.error);
    setUser(null);
    setActiveSection('dashboard');
  };

  const handleAddFutureTransaction = (t: Omit<FutureTransaction, 'id'>) =>
    setFutureTransactions(prev => [...prev, { ...t, id: Date.now().toString() }]);

  const handleDeleteFutureTransaction = (id: string) =>
    setFutureTransactions(prev => prev.filter(t => t.id !== id));

  // ── Render guards ──────────────────────────────────────────────────────
  if (!authChecked) return <div className="min-h-screen bg-surface-50" />;
  if (isLoading) return <LoadingScreen onLoadingComplete={() => setIsLoading(false)} />;
  if (!user) return <Auth onLogin={handleLogin} />;

  return (
    <Layout
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      user={user}
      onLogout={handleLogout}
      notifications={notifications}
    >
      <AnimatePresence mode="wait">
        {activeSection === 'dashboard' && (
          <motion.div key="dashboard" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Dashboard
              availableMoney={availableMoney}
              onMoneyChange={setAvailableMoney}
              bills={bills}
              incomes={incomes}
              futureTransactions={futureTransactions}
              onAddFutureTransaction={handleAddFutureTransaction}
              onDeleteFutureTransaction={handleDeleteFutureTransaction}
              addNotification={addNotification}
            />
          </motion.div>
        )}
        {activeSection === 'bills' && (
          <motion.div key="bills" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <BillsManager bills={bills} setBills={setBillsAndDeduct} addNotification={addNotification} />
          </motion.div>
        )}

        {activeSection === 'income' && (
          <motion.div key="income" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <IncomeManager incomes={incomes} setIncomes={setIncomesAndAdd} addNotification={addNotification} />
          </motion.div>
        )}        {activeSection === 'analytics' && (
          <motion.div key="analytics" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Analytics bills={bills} incomes={incomes} />
          </motion.div>
        )}

        {activeSection === 'goals' && (
          <motion.div key="goals" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Goals goals={goals} setGoals={setGoals} bills={bills} />
          </motion.div>
        )}

        {activeSection === 'calendar' && (
          <motion.div key="calendar" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Calendar
              reminders={reminders}
              setReminders={setReminders}
              bills={bills}
              addNotification={addNotification}
            />
          </motion.div>
        )}

        {activeSection === 'openfinance' && (
          <motion.div key="openfinance" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <OpenFinance />
          </motion.div>
        )}

        {activeSection === 'notifications' && (
          <motion.div key="notifications" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Notifications
              notifications={notifications}
              setNotifications={setNotifications}
              addNotification={addNotification}
            />
          </motion.div>
        )}

        {activeSection === 'settings' && (
          <motion.div key="settings" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Settings user={user} onLogout={handleLogout} onUserUpdate={setUser} />
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
