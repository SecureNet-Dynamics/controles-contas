import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Wallet, TrendingUp, TrendingDown, AlertCircle,
  Plus, X, CalendarDays, Trash2, ArrowUpRight, ArrowDownRight,
  Clock, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { formatCurrency, parseFormattedNumber, formatInputCurrency } from '../utils/formatters';
import type { Bill, Income, FutureTransaction } from '../types';
import { getCategoryInfo } from '../types';

interface DashboardProps {
  availableMoney: number;
  onMoneyChange: (v: number) => void;
  bills: Bill[];
  incomes: Income[];
  futureTransactions: FutureTransaction[];
  onAddFutureTransaction: (t: Omit<FutureTransaction, 'id'>) => void;
  onDeleteFutureTransaction: (id: string) => void;
  addNotification: (n: { title: string; message: string; date: string; type: 'bill' | 'reminder' | 'system' | 'income' }) => void;
}

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function KpiCard({
  label, value, sub, icon: Icon, color, editable, onEdit, rawValue,
}: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; color: string; editable?: boolean;
  onEdit?: (v: number) => void; rawValue?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState('');

  const handleSave = () => {
    if (raw.trim() !== '') {
      onEdit?.(parseFormattedNumber(raw));
    }
    setEditing(false);
  };

  return (
    <motion.div
      className="kpi-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-ink-muted">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center`} style={{ background: color + '20' }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      {editing ? (
        <input
          autoFocus
          className="input text-lg font-bold py-1"
          value={raw}
          onChange={e => setRaw(formatInputCurrency(e.target.value))}
          onBlur={handleSave}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') setEditing(false);
          }}
        />
      ) : (
        <button
          className={`text-left w-full ${editable ? 'cursor-text' : 'cursor-default'}`}
          onClick={() => {
            if (editable) {
              setRaw(formatInputCurrency(rawValue !== undefined ? rawValue.toString() : ''));
              setEditing(true);
            }
          }}
        >
          <p className="text-xl font-bold text-ink">{value}</p>
          {sub && <p className="text-xs text-ink-muted mt-0.5">{sub}</p>}
        </button>
      )}
      {editable && !editing && (
        <p className="text-[10px] text-ink-faint">Clique para editar</p>
      )}
    </motion.div>
  );
}

function AddTransactionModal({ onClose, onAdd }: {
  onClose: () => void;
  onAdd: (t: Omit<FutureTransaction, 'id'>) => void;
}) {
  const [form, setForm] = useState({
    description: '', amount: '', expectedDate: new Date().toISOString().split('T')[0], received: false,
  });

  return (
    <div className="modal-overlay">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="modal-box p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-ink">Nova Transação Futura</h3>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={16} /></button>
        </div>
        <form onSubmit={e => {
          e.preventDefault();
          if (form.description && form.amount) {
            onAdd({ description: form.description, amount: parseFormattedNumber(form.amount), expectedDate: form.expectedDate, received: form.received });
            onClose();
          }
        }} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">Descrição</label>
            <input className="input" placeholder="Ex: Salário, Freelance..." value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">Valor (R$)</label>
            <input className="input" placeholder="0,00"
              value={formatInputCurrency(form.amount)}
              onChange={e => setForm({ ...form, amount: e.target.value })} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">Data Prevista</label>
            <input className="input" type="date" value={form.expectedDate}
              onChange={e => setForm({ ...form, expectedDate: e.target.value })} required />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.received}
              onChange={e => setForm({ ...form, received: e.target.checked })}
              className="w-4 h-4 accent-brand rounded" />
            <span className="text-sm text-ink-muted">Já recebido?</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1">Adicionar</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function Dashboard({
  availableMoney, onMoneyChange, bills, incomes,
  futureTransactions, onAddFutureTransaction, onDeleteFutureTransaction, addNotification,
}: DashboardProps) {
  const [showModal, setShowModal] = useState(false);

  const today = new Date();
  const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const getDayDiff = (dueDateStr: string) => {
    const parts = dueDateStr.split('-');
    if (parts.length < 3) return 0;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const targetTime = new Date(y, m, d).getTime();
    return (targetTime - todayTime) / 86400000;
  };

  const totalBills = bills.reduce((s, b) => s + b.amount, 0);
  const totalPaid = bills.filter(b => b.paid).reduce((s, b) => s + b.amount, 0);
  const totalPending = totalBills - totalPaid;

  // Correct contábil balance calculation avoiding double counting received items
  const totalPendingIncome = incomes.filter(i => !i.received).reduce((s, i) => s + i.amount, 0);
  const balance = availableMoney + totalPendingIncome - totalPending;

  const overdueBills = bills.filter(b => !b.paid && getDayDiff(b.dueDate) < 0);
  const dueSoonBills = bills.filter(b => {
    if (b.paid) return false;
    const diff = getDayDiff(b.dueDate);
    return diff >= 0 && diff <= 7;
  });

  // Monthly bar chart data (last 6 months)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1);
    const monthBills = bills.filter(b => {
      const parts = b.dueDate.split('-');
      if (parts.length < 2) return false;
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      return month === d.getMonth() && year === d.getFullYear();
    });
    const monthIncome = incomes.filter(inc => {
      const parts = inc.date.split('-');
      if (parts.length < 2) return false;
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      return month === d.getMonth() && year === d.getFullYear() && inc.received;
    });
    return {
      month: MONTHS[d.getMonth()],
      despesas: monthBills.reduce((s, b) => s + b.amount, 0),
      receitas: monthIncome.reduce((s, inc) => s + inc.amount, 0),
    };
  });

  // Category pie data
  const categoryData = Object.entries(
    bills.reduce((acc, b) => {
      acc[b.category] = (acc[b.category] ?? 0) + b.amount;
      return acc;
    }, {} as Record<string, number>)
  ).map(([cat, value]) => ({ name: getCategoryInfo(cat).label, value, color: getCategoryInfo(cat).color }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const handleAddTransaction = (t: Omit<FutureTransaction, 'id'>) => {
    onAddFutureTransaction(t);
    addNotification({ title: 'Transação adicionada', message: `${t.description}: ${formatCurrency(t.amount)}`, date: new Date().toISOString(), type: 'income' });
  };

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Alerts */}
      {(overdueBills.length > 0 || dueSoonBills.length > 0) && (
        <div className="space-y-2">
          {overdueBills.length > 0 && (
            <div className="flex items-start gap-3 px-4 py-3 bg-danger-light border border-danger/20 rounded-xl text-sm">
              <AlertTriangle size={16} className="text-danger flex-shrink-0 mt-0.5" />
              <p className="text-danger min-w-0">
                <span className="font-medium">{overdueBills.length} conta{overdueBills.length > 1 ? 's' : ''} em atraso: </span>
                <span className="opacity-80 break-words">
                  {overdueBills.slice(0, 2).map(b => b.name).join(', ')}{overdueBills.length > 2 ? '...' : ''}
                </span>
              </p>
            </div>
          )}
          {dueSoonBills.length > 0 && (
            <div className="flex items-start gap-3 px-4 py-3 bg-warning-light border border-warning/20 rounded-xl text-sm">
              <Clock size={16} className="text-warning flex-shrink-0 mt-0.5" />
              <p className="text-warning-dark font-medium">
                {dueSoonBills.length} conta{dueSoonBills.length > 1 ? 's' : ''} vence{dueSoonBills.length > 1 ? 'm' : ''} em até 7 dias
              </p>
            </div>
          )}
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Saldo Disponível" value={formatCurrency(availableMoney)}
          sub="Clique para atualizar" icon={Wallet} color="#22D68A"
          editable onEdit={onMoneyChange} rawValue={availableMoney} />
        <KpiCard label="Total em Contas" value={formatCurrency(totalBills)}
          sub={`${bills.length} conta${bills.length !== 1 ? 's' : ''}`} icon={AlertCircle} color="#4F8EF7" />
        <KpiCard label="Já Pago" value={formatCurrency(totalPaid)}
          sub={`${bills.filter(b => b.paid).length} pagas`} icon={CheckCircle2} color="#22D68A" />
        <KpiCard label="Saldo Final" value={formatCurrency(balance)}
          sub={balance >= 0 ? 'Positivo ✓' : 'Negativo ✗'}
          icon={balance >= 0 ? TrendingUp : TrendingDown}
          color={balance >= 0 ? '#22D68A' : '#FF4D4D'} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Bar chart */}
        <div className="card-p lg:col-span-2">
          <h3 className="font-semibold text-ink text-sm mb-4">Receitas vs Despesas (6 meses)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyData} barGap={2} margin={{ left: -10, right: 4 }}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B6B88' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6B6B88' }} axisLine={false} tickLine={false}
                tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
              <Tooltip
                contentStyle={{ border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12 }}
                formatter={(v: any) => formatCurrency(Number(v || 0))}
              />
              <Bar dataKey="receitas" fill="#22D68A" radius={[4, 4, 0, 0]} name="Receitas" />
              <Bar dataKey="despesas" fill="#4F8EF7" radius={[4, 4, 0, 0]} name="Despesas" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="card-p">
          <h3 className="font-semibold text-ink text-sm mb-4">Despesas por Categoria</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="45%" innerRadius={45} outerRadius={65}
                  dataKey="value" paddingAngle={2}>
                  {categoryData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => formatCurrency(Number(v || 0))}
                  contentStyle={{ border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }}
                  formatter={(v) => <span style={{ fontSize: 11, color: '#6B6B88' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-ink-faint text-sm">
              Sem dados de despesas
            </div>
          )}
        </div>
      </div>

      {/* Recent bills + future transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* Recent bills */}
        <div className="card-p">
          <h3 className="font-semibold text-ink text-sm mb-4">Contas Recentes</h3>
          {bills.length === 0 ? (
            <p className="text-sm text-ink-faint text-center py-6">Nenhuma conta cadastrada</p>
          ) : (
            <div className="space-y-2">
              {bills.slice(0, 6).map(bill => {
                const overdue = !bill.paid && new Date(bill.dueDate) < today;
                return (
                  <div key={bill.id} className="flex items-center justify-between py-2 border-b border-surface-100 last:border-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${bill.paid ? 'bg-brand' : overdue ? 'bg-danger' : 'bg-warning'}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{bill.name}</p>
                        <p className="text-xs text-ink-muted">
                          {new Date(bill.dueDate).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="text-sm font-semibold text-ink">{formatCurrency(bill.amount)}</p>
                      <span className={`text-[10px] font-medium ${bill.paid ? 'text-brand-600' : overdue ? 'text-danger' : 'text-warning-dark'}`}>
                        {bill.paid ? 'Pago' : overdue ? 'Atrasado' : 'Pendente'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Future transactions */}
        <div className="card-p">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-ink text-sm">Entradas Previstas</h3>
            <button onClick={() => setShowModal(true)} className="btn-primary py-1.5 text-xs">
              <Plus size={13} /> Adicionar
            </button>
          </div>
          {futureTransactions.length === 0 ? (
            <div className="text-center py-6">
              <CalendarDays size={28} className="text-ink-faint mx-auto mb-2" />
              <p className="text-sm text-ink-faint">Nenhuma entrada prevista</p>
              <p className="text-xs text-ink-faint mt-1">Adicione salários, freelances, etc.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {futureTransactions.map(t => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-surface-100 last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${t.received ? 'bg-brand-100' : 'bg-info-light'}`}>
                      {t.received
                        ? <ArrowDownRight size={14} className="text-brand-600" />
                        : <ArrowUpRight size={14} className="text-info" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{t.description}</p>
                      <p className="text-xs text-ink-muted">{new Date(t.expectedDate).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-brand-600">{formatCurrency(t.amount)}</p>
                      <span className={`text-[10px] ${t.received ? 'text-brand-600' : 'text-info'}`}>
                        {t.received ? 'Recebido' : 'Previsto'}
                      </span>
                    </div>
                    <button onClick={() => onDeleteFutureTransaction(t.id)}
                      className="text-ink-faint hover:text-danger transition-colors p-1">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-surface-100 flex justify-between text-sm">
                <span className="text-ink-muted">Total previsto:</span>
                <span className="font-semibold text-brand-600">
                  {formatCurrency(futureTransactions.reduce((s, t) => s + t.amount, 0))}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showModal && <AddTransactionModal onClose={() => setShowModal(false)} onAdd={handleAddTransaction} />}
      </AnimatePresence>
    </motion.div>
  );
}
