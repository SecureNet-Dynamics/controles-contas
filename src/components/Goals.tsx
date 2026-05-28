import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Target, Trash2, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import { formatCurrency, parseFormattedNumber, formatInputCurrency } from '../utils/formatters';
import type { Goal, Bill } from '../types';
import { CATEGORIES, getCategoryInfo } from '../types';

interface GoalsProps {
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  bills: Bill[];
}

function GoalForm({ onClose, onSave }: {
  onClose: () => void;
  onSave: (goal: Omit<Goal, 'id'>) => void;
}) {
  const [form, setForm] = useState({
    category: 'moradia', limitAmount: '', period: 'monthly' as Goal['period'],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.limitAmount || parseFormattedNumber(form.limitAmount) <= 0) return;
    onSave({
      category: form.category,
      limitAmount: parseFormattedNumber(form.limitAmount),
      period: form.period,
      color: getCategoryInfo(form.category).color,
    });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="modal-box p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-ink">Nova Meta de Orçamento</h3>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">Categoria</label>
            <select className="input" value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">Limite de Gasto (R$)</label>
            <input className="input" placeholder="0,00"
              value={formatInputCurrency(form.limitAmount)}
              onChange={e => setForm({ ...form, limitAmount: e.target.value })} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">Período</label>
            <select className="input" value={form.period}
              onChange={e => setForm({ ...form, period: e.target.value as Goal['period'] })}>
              <option value="monthly">Mensal</option>
              <option value="yearly">Anual</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1">Criar Meta</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function Goals({ goals, setGoals, bills }: GoalsProps) {
  const [showForm, setShowForm] = useState(false);

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const getSpentForCategory = (category: string, period: Goal['period']) => {
    return bills
      .filter(b => {
        const parts = b.dueDate.split('-');
        if (parts.length < 2) return false;
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // 0-indexed month
        if (period === 'monthly') {
          return b.category === category && month === currentMonth && year === currentYear;
        }
        return b.category === category && year === currentYear;
      })
      .reduce((s, b) => s + b.amount, 0);
  };

  const handleAdd = (data: Omit<Goal, 'id'>) => {
    const existing = goals.find(g => g.category === data.category && g.period === data.period);
    if (existing) {
      setGoals(prev => prev.map(g => g.id === existing.id ? { ...g, ...data } : g));
    } else {
      setGoals(prev => [...prev, { ...data, id: Date.now().toString() }]);
    }
  };

  const handleDelete = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const totalBudget = goals.reduce((s, g) => s + g.limitAmount, 0);
  const totalSpent = goals.reduce((s, g) => s + getSpentForCategory(g.category, g.period), 0);
  const goalsOk = goals.filter(g => getSpentForCategory(g.category, g.period) <= g.limitAmount).length;

  return (
    <motion.div className="space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="section-title">Metas de Orçamento</h2>
          <p className="section-subtitle">Defina limites de gasto por categoria</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary py-2 text-xs flex-shrink-0">
          <Plus size={14} /> Nova Meta
        </button>
      </div>

      {/* Summary */}
      {goals.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Orçamento Total', value: formatCurrency(totalBudget), icon: Target, color: '#4F8EF7' },
            { label: 'Gasto até agora', value: formatCurrency(totalSpent), icon: TrendingUp, color: totalSpent > totalBudget ? '#FF4D4D' : '#22D68A' },
            { label: 'Metas no controle', value: `${goalsOk} de ${goals.length}`, icon: CheckCircle2, color: '#22D68A' },
          ].map(k => {
            const Icon = k.icon;
            return (
              <motion.div key={k.label} className="kpi-card"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-start justify-between">
                  <p className="text-xs font-medium text-ink-muted">{k.label}</p>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: k.color + '20' }}>
                    <Icon size={16} style={{ color: k.color }} />
                  </div>
                </div>
                <p className="text-xl font-bold text-ink">{k.value}</p>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Goals list */}
      {goals.length === 0 ? (
        <div className="card-p text-center py-12">
          <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target size={28} className="text-brand-600" />
          </div>
          <h3 className="font-semibold text-ink mb-2">Nenhuma meta criada</h3>
          <p className="text-sm text-ink-muted mb-6">
            Defina limites de gastos por categoria e acompanhe seu orçamento
          </p>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus size={14} /> Criar primeira meta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AnimatePresence>
            {goals.map(goal => {
              const catInfo = getCategoryInfo(goal.category);
              const spent = getSpentForCategory(goal.category, goal.period);
              const pct = Math.min(100, (spent / goal.limitAmount) * 100);
              const isOver = spent > goal.limitAmount;
              const isWarning = pct >= 80 && !isOver;

              return (
                <motion.div key={goal.id} layout
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="card-p">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{catInfo.emoji}</span>
                      <div>
                        <p className="font-semibold text-ink text-sm">{catInfo.label}</p>
                        <p className="text-xs text-ink-muted capitalize">
                          {goal.period === 'monthly' ? 'Mensal' : 'Anual'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isOver && <AlertTriangle size={14} className="text-danger" />}
                      {isWarning && <AlertTriangle size={14} className="text-warning" />}
                      {!isOver && !isWarning && <CheckCircle2 size={14} className="text-brand" />}
                      <button onClick={() => handleDelete(goal.id)}
                        className="text-ink-faint hover:text-danger transition-colors p-1">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className={`font-bold ${isOver ? 'text-danger' : 'text-ink'}`}>
                        {formatCurrency(spent)}
                      </span>
                      <span className="text-ink-muted">de {formatCurrency(goal.limitAmount)}</span>
                    </div>
                    <div className="progress-bar">
                      <motion.div
                        className="progress-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        style={{
                          background: isOver ? '#FF4D4D' : isWarning ? '#F5A623' : catInfo.color,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium ${
                        isOver ? 'text-danger' : isWarning ? 'text-warning-dark' : 'text-brand-600'
                      }`}>
                        {isOver
                          ? `Excedeu ${formatCurrency(spent - goal.limitAmount)}`
                          : isWarning
                          ? `${(100 - pct).toFixed(0)}% restante — atenção!`
                          : `${(100 - pct).toFixed(0)}% restante`}
                      </span>
                      <span className="text-xs text-ink-faint">{pct.toFixed(0)}%</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {showForm && <GoalForm onClose={() => setShowForm(false)} onSave={handleAdd} />}
      </AnimatePresence>
    </motion.div>
  );
}
