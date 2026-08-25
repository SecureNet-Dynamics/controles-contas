import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, CheckCircle2, Clock, Trash2, Download,
  RefreshCw, DollarSign, Calendar, Pencil,
} from 'lucide-react';
import { formatCurrency, parseFormattedNumber, formatInputCurrency, formatDateBR } from '../utils/formatters';
import type { Income, Notification } from '../types';
import { INCOME_CATEGORIES, getIncomeCategoryInfo } from '../types';
import CategorySelect from './CategorySelect';

interface IncomeProps {
  incomes: Income[];
  setIncomes: React.Dispatch<React.SetStateAction<Income[]>>;
  addNotification: (n: Omit<Notification, 'id' | 'read'>) => void;
}

const emptyForm = {
  description: '', amount: '', date: new Date().toISOString().split('T')[0],
  category: 'salario', received: false, recurring: false,
  recurringPeriod: 'monthly' as Income['recurringPeriod'],
};

function IncomeForm({ initial, onClose, onSave }: {
  initial?: Income;
  onClose: () => void;
  onSave: (income: Omit<Income, 'id'>) => void;
}) {
  const [form, setForm] = useState(() => initial ? {
    description: initial.description,
    amount: initial.amount.toString().replace('.', ','),
    date: initial.date,
    category: initial.category,
    received: initial.received,
    recurring: initial.recurring,
    recurringPeriod: initial.recurringPeriod || 'monthly' as Income['recurringPeriod'],
  } : emptyForm);
  const isEditing = !!initial;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description || !form.amount || !form.date) return;
    onSave({
      description: form.description.trim(),
      amount: parseFormattedNumber(form.amount),
      date: form.date,
      category: form.category,
      received: form.received,
      recurring: form.recurring,
      recurringPeriod: form.recurring ? form.recurringPeriod : undefined,
    });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="modal-box p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-ink">{isEditing ? 'Editar Receita' : 'Nova Receita'}</h3>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">Descrição *</label>
            <input className="input" placeholder="Ex: Salário, Freelance, Aluguel..."
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Valor *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint text-sm pointer-events-none">R$</span>
                <input className="input pl-9" placeholder="0,00"
                  value={formatInputCurrency(form.amount)}
                  onChange={e => setForm({ ...form, amount: e.target.value })} required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Data *</label>
              <input className="input" type="date" value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">Categoria</label>
            <CategorySelect kind="income" baseCategories={INCOME_CATEGORIES} value={form.category}
              onChange={cat => setForm({ ...form, category: cat })} />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.received}
                onChange={e => setForm({ ...form, received: e.target.checked })}
                className="w-4 h-4 accent-brand rounded" />
              <span className="text-sm text-ink-muted">Já recebido?</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.recurring}
                onChange={e => setForm({ ...form, recurring: e.target.checked })}
                className="w-4 h-4 accent-brand rounded" />
              <span className="text-sm text-ink-muted">Recorrente?</span>
            </label>
          </div>
          {form.recurring && (
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Periodicidade</label>
              <select className="input" value={form.recurringPeriod}
                onChange={e => setForm({ ...form, recurringPeriod: e.target.value as Income['recurringPeriod'] })}>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
                <option value="yearly">Anual</option>
              </select>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1">{isEditing ? 'Salvar Alterações' : 'Salvar Receita'}</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function IncomeManager({ incomes, setIncomes, addNotification }: IncomeProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [filterReceived, setFilterReceived] = useState<'all' | 'received' | 'pending'>('all');

  const filtered = useMemo(() => {
    if (filterReceived === 'received') return incomes.filter(i => i.received);
    if (filterReceived === 'pending') return incomes.filter(i => !i.received);
    return incomes;
  }, [incomes, filterReceived]);

  const totalReceived = incomes.filter(i => i.received).reduce((s, i) => s + i.amount, 0);
  const totalPending = incomes.filter(i => !i.received).reduce((s, i) => s + i.amount, 0);
  const totalRecurring = incomes.filter(i => i.recurring).reduce((s, i) => s + i.amount, 0);

  const handleAdd = (data: Omit<Income, 'id'>) => {
    const newIncome: Income = { ...data, id: Date.now().toString() };
    setIncomes(prev => [newIncome, ...prev]);
    addNotification({ title: 'Receita adicionada', message: `${data.description}: ${formatCurrency(data.amount)}`, date: new Date().toISOString(), type: 'income' });
  };

  const handleEditSave = (id: string, data: Omit<Income, 'id'>) => {
    setIncomes(prev => prev.map(i => i.id === id ? { ...i, ...data } : i));
    addNotification({ title: 'Receita atualizada', message: `${data.description}: ${formatCurrency(data.amount)}`, date: new Date().toISOString(), type: 'income' });
  };

  const handleToggle = (id: string) => {
    setIncomes(prev => prev.map(i => i.id === id ? { ...i, received: !i.received } : i));
  };

  const handleDelete = (id: string) => {
    const income = incomes.find(i => i.id === id);
    setIncomes(prev => prev.filter(i => i.id !== id));
    if (income) addNotification({ title: 'Receita removida', message: income.description, date: new Date().toISOString(), type: 'income' });
  };

  const exportCsv = () => {
    const rows = [['Descrição', 'Valor', 'Data', 'Categoria', 'Status', 'Recorrente']];
    incomes.forEach(i => rows.push([i.description, i.amount.toString().replace('.', ','), i.date, i.category, i.received ? 'Recebido' : 'Pendente', i.recurring ? 'Sim' : 'Não']));
    const csvContent = rows.map(r => r.join(';')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'receitas.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div className="space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="section-title">Receitas</h2>
          <p className="section-subtitle">Controle suas entradas de dinheiro</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCsv} className="btn-secondary py-2 text-xs">
            <Download size={14} /><span className="hidden sm:inline">Exportar</span>
          </button>
          <button onClick={() => setShowForm(true)} className="btn-primary py-2 text-xs">
            <Plus size={14} /> Nova Receita
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Recebido', value: formatCurrency(totalReceived), icon: CheckCircle2, color: '#4C97D6', sub: `${incomes.filter(i => i.received).length} entradas` },
          { label: 'A Receber', value: formatCurrency(totalPending), icon: Clock, color: '#F5A623', sub: `${incomes.filter(i => !i.received).length} pendentes` },
          { label: 'Renda Recorrente', value: formatCurrency(totalRecurring), icon: RefreshCw, color: '#8C9EFF', sub: `${incomes.filter(i => i.recurring).length} fixas` },
        ].map(k => {
          const Icon = k.icon;
          return (
            <motion.div key={k.label} className="kpi-card"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-start justify-between">
                <p className="text-xs font-medium text-ink-muted">{k.label}</p>
                <Icon size={16} style={{ color: k.color }} strokeWidth={2} />
              </div>
              <p className="text-xl font-bold text-ink">{k.value}</p>
              <p className="text-xs text-ink-muted">{k.sub}</p>
            </motion.div>
          );
        })}
      </div>

      {/* List */}
      <div className="card-p space-y-3">
        <div className="tabs-scroll">
          {(['all', 'received', 'pending'] as const).map(f => (
            <button key={f} onClick={() => setFilterReceived(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterReceived === f ? 'bg-brand/10 text-accent' : 'text-ink-muted hover:bg-surface-100'
              }`}>
              {f === 'all' ? 'Todas' : f === 'received' ? 'Recebidas' : 'Pendentes'}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-10">
            <DollarSign size={28} className="text-ink-faint mx-auto mb-3" />
            <p className="text-sm text-ink-muted">Nenhuma receita cadastrada</p>
            <button onClick={() => setShowForm(true)} className="btn-primary mt-4 text-xs">
              <Plus size={13} /> Adicionar primeira receita
            </button>
          </div>
        ) : (
          <div className="-mx-4 sm:-mx-6">
            <AnimatePresence>
              {filtered.map(income => {
                const catInfo = getIncomeCategoryInfo(income.category);
                return (
                  <motion.div key={income.id} layout
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="list-row">
                    <button onClick={() => handleToggle(income.id)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mr-3 transition-all ${
                        income.received ? 'bg-brand border-brand text-white' : 'border-surface-200 hover:border-brand'
                      }`}>
                      {income.received && <CheckCircle2 size={11} />}
                    </button>
                    <span className="text-base mr-3 flex-shrink-0">{catInfo.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${income.received ? 'text-ink' : 'text-ink'}`}>
                        {income.description}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-ink-muted flex items-center gap-1">
                          <Calendar size={10} />
                          {formatDateBR(income.date)}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                          style={{ background: catInfo.color + '20', color: catInfo.color }}>
                          {catInfo.label}
                        </span>
                        {income.recurring && (
                          <span className="badge bg-info-light text-info-dark text-[10px]">
                            <RefreshCw size={9} />
                            {income.recurringPeriod === 'monthly' ? 'Mensal' : income.recurringPeriod === 'weekly' ? 'Semanal' : 'Anual'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                      <p className="text-sm font-bold text-accent">+{formatCurrency(income.amount)}</p>
                      <span className={`text-[10px] font-medium ${income.received ? 'text-accent' : 'text-warning-dark'}`}>
                        {income.received ? '✓ Recebido' : '⏳ Pendente'}
                      </span>
                    </div>
                    <button onClick={() => setEditingIncome(income)}
                      className="ml-3 text-ink-faint hover:text-brand transition-colors p-1 flex-shrink-0">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(income.id)}
                      className="ml-1 text-ink-faint hover:text-danger transition-colors p-1 flex-shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && <IncomeForm onClose={() => setShowForm(false)} onSave={handleAdd} />}
        {editingIncome && (
          <IncomeForm
            initial={editingIncome}
            onClose={() => setEditingIncome(null)}
            onSave={data => handleEditSave(editingIncome.id, data)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
