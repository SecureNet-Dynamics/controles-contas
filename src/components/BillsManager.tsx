import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, Search, CheckCircle2, Clock, AlertTriangle,
  Trash2, Filter, ArrowUpDown, Download, Upload, RefreshCw, Pencil,
} from 'lucide-react';
import { formatCurrency, parseFormattedNumber, formatInputCurrency, parseLocalDate, formatDateBR, startOfToday } from '../utils/formatters';
import type { Bill, Notification } from '../types';
import { CATEGORIES, getCategoryInfo } from '../types';
import CategorySelect from './CategorySelect';

interface BillsManagerProps {
  bills: Bill[];
  setBills: React.Dispatch<React.SetStateAction<Bill[]>>;
  addNotification: (n: Omit<Notification, 'id' | 'read'>) => void;
}

type FilterType = 'all' | 'pending' | 'paid' | 'overdue';
type SortType = 'dueDate' | 'amount' | 'name';

const emptyForm = {
  name: '', amount: '', dueDate: '', category: 'outros',
  description: '', installments: '', recurring: false,
};

function BillForm({ initial, onClose, onSave }: {
  initial?: Bill;
  onClose: () => void;
  onSave: (bill: Omit<Bill, 'id' | 'paid'>) => void;
}) {
  const [form, setForm] = useState(() => initial ? {
    name: initial.name,
    amount: initial.amount.toString().replace('.', ','),
    dueDate: initial.dueDate,
    category: initial.category,
    description: initial.description || '',
    installments: initial.installments ? initial.installments.toString() : '',
    recurring: initial.recurring || false,
  } : emptyForm);
  const [error, setError] = useState('');
  const isEditing = !!initial;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Nome é obrigatório');
    if (!form.amount || parseFormattedNumber(form.amount) <= 0) return setError('Valor inválido');
    if (!form.dueDate) return setError('Data de vencimento é obrigatória');
    setError('');
    onSave({
      name: form.name.trim(),
      amount: parseFormattedNumber(form.amount),
      dueDate: form.dueDate,
      category: form.category,
      description: form.description,
      installments: form.installments ? parseInt(form.installments) : undefined,
      recurring: form.recurring,
    });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="modal-box p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-ink">{isEditing ? 'Editar Conta' : 'Nova Conta'}</h3>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={16} /></button>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 bg-danger-light text-danger text-sm rounded-lg border border-danger/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">Nome da conta *</label>
            <input className="input" placeholder="Ex: Aluguel, Internet, Luz..."
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
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
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Vencimento *</label>
              <input className="input" type="date" value={form.dueDate}
                onChange={e => setForm({ ...form, dueDate: e.target.value })} required />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">Categoria</label>
            <CategorySelect kind="bill" baseCategories={CATEGORIES} value={form.category}
              onChange={cat => setForm({ ...form, category: cat })} />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">Descrição (opcional)</label>
            <textarea className="input resize-none h-16" placeholder="Notas adicionais..."
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Parcelas (opcional)</label>
              <input className="input" type="number" min="1" max="60" placeholder="Ex: 12"
                value={form.installments} onChange={e => setForm({ ...form, installments: e.target.value })} />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.recurring}
                  onChange={e => setForm({ ...form, recurring: e.target.checked })}
                  className="w-4 h-4 accent-brand rounded" />
                <span className="text-sm text-ink-muted">Recorrente</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1">{isEditing ? 'Salvar Alterações' : 'Salvar Conta'}</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function BillsManager({ bills, setBills, addNotification }: BillsManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [filter, setFilter] = useState<FilterType>('pending');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortType>('dueDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const today = startOfToday();

  const filtered = useMemo(() => {
    let list = [...bills];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(b => b.name.toLowerCase().includes(q) || b.category.toLowerCase().includes(q));
    }

    if (filter === 'paid') list = list.filter(b => b.paid);
    else if (filter === 'pending') list = list.filter(b => !b.paid && parseLocalDate(b.dueDate) >= today);
    else if (filter === 'overdue') list = list.filter(b => !b.paid && parseLocalDate(b.dueDate) < today);

    list.sort((a, b) => {
      let cmp = 0;
      if (sort === 'dueDate') cmp = parseLocalDate(a.dueDate).getTime() - parseLocalDate(b.dueDate).getTime();
      else if (sort === 'amount') cmp = a.amount - b.amount;
      else cmp = a.name.localeCompare(b.name);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [bills, filter, search, sort, sortDir]);

  const toggleSort = (s: SortType) => {
    if (sort === s) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSort(s); setSortDir('asc'); }
  };

  const addMonthsToDateStr = (dateStr: string, monthsToAdd: number) => {
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    const date = new Date(y, m - 1 + monthsToAdd, d);
    const newY = date.getFullYear();
    const newM = (date.getMonth() + 1).toString().padStart(2, '0');
    const newD = date.getDate().toString().padStart(2, '0');
    return `${newY}-${newM}-${newD}`;
  };

  const handleAdd = (data: Omit<Bill, 'id' | 'paid'>) => {
    const newBills: Bill[] = [];
    const installmentsCount = data.installments || 1;

    if (installmentsCount > 1) {
      for (let i = 0; i < installmentsCount; i++) {
        const dueDate = addMonthsToDateStr(data.dueDate, i);
        newBills.push({
          ...data,
          id: `${Date.now()}-${i}`,
          name: `${data.name} (${i + 1}/${installmentsCount})`,
          dueDate,
          paid: false,
          currentInstallment: i + 1,
          installments: installmentsCount,
        });
      }
    } else if (data.recurring) {
      // Pre-generate 6 months of recurring bills for projection
      for (let i = 0; i < 6; i++) {
        const dueDate = addMonthsToDateStr(data.dueDate, i);
        newBills.push({
          ...data,
          id: `${Date.now()}-rec-${i}`,
          name: data.name,
          dueDate,
          paid: false,
        });
      }
    } else {
      newBills.push({
        ...data,
        id: Date.now().toString(),
        paid: false,
      });
    }

    setBills(prev => [...prev, ...newBills]);
    addNotification({
      title: installmentsCount > 1 ? `${installmentsCount} parcelas adicionadas` : 'Conta adicionada',
      message: `${data.name}: ${formatCurrency(data.amount)}`,
      date: new Date().toISOString(),
      type: 'bill',
    });
  };

  const handleTogglePaid = (id: string) => {
    setBills(prev => prev.map(b => {
      if (b.id !== id) return b;
      const nowPaid = !b.paid;
      const updated = { ...b, paid: nowPaid, paidAt: nowPaid ? new Date().toISOString() : undefined };
      addNotification({
        title: updated.paid ? 'Conta marcada como paga!' : 'Pagamento desfeito',
        message: `${b.name}: ${formatCurrency(b.amount)}`,
        date: new Date().toISOString(),
        type: 'bill',
      });
      return updated;
    }));
  };

  const handleEditSave = (id: string, data: Omit<Bill, 'id' | 'paid'>) => {
    setBills(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));
    addNotification({ title: 'Conta atualizada', message: `${data.name}: ${formatCurrency(data.amount)}`, date: new Date().toISOString(), type: 'bill' });
  };

  const handleDelete = (id: string) => {
    const bill = bills.find(b => b.id === id);
    setBills(prev => prev.filter(b => b.id !== id));
    if (bill) addNotification({ title: 'Conta removida', message: bill.name, date: new Date().toISOString(), type: 'bill' });
  };

  const exportCsv = () => {
    const rows = [['Nome', 'Valor', 'Vencimento', 'Categoria', 'Status']];
    bills.forEach(b => rows.push([b.name, b.amount.toString().replace('.', ','), b.dueDate, b.category, b.paid ? 'Pago' : 'Pendente']));
    const csvContent = rows.map(r => r.join(';')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contas.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCsvLine = (line: string): string[] => {
    const delimiter = line.includes(';') ? ';' : ',';
    return line.split(delimiter).map(cell => cell.trim().replace(/^"|"$/g, ''));
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const text = (ev.target?.result as string).replace(/^﻿/, '');
        const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
        if (lines.length < 2) throw new Error('Arquivo vazio');

        const header = parseCsvLine(lines[0]).map(h => h.toLowerCase());
        const idxName = header.findIndex(h => h.includes('nome'));
        const idxAmount = header.findIndex(h => h.includes('valor'));
        const idxDate = header.findIndex(h => h.includes('vencimento') || h.includes('data'));
        const idxCategory = header.findIndex(h => h.includes('categoria'));
        const idxStatus = header.findIndex(h => h.includes('status'));

        if (idxName < 0 || idxAmount < 0 || idxDate < 0) {
          throw new Error('Colunas esperadas: Nome, Valor, Vencimento, Categoria, Status');
        }

        const imported: Bill[] = lines.slice(1).map((line, i) => {
          const cells = parseCsvLine(line);
          const rawCategory = (cells[idxCategory] || 'outros').toLowerCase();
          const category = CATEGORIES.find(c => c.value === rawCategory || c.label.toLowerCase() === rawCategory)?.value || 'outros';
          const statusCell = (cells[idxStatus] || '').toLowerCase();
          return {
            id: `import-${Date.now()}-${i}`,
            name: cells[idxName] || 'Conta importada',
            amount: parseFormattedNumber(cells[idxAmount] || '0'),
            dueDate: cells[idxDate] || new Date().toISOString().split('T')[0],
            category,
            paid: statusCell.includes('pago'),
          };
        }).filter(b => b.amount > 0 && b.name);

        if (imported.length === 0) throw new Error('Nenhuma conta válida encontrada no arquivo');

        setBills(prev => [...prev, ...imported]);
        addNotification({
          title: `${imported.length} conta${imported.length > 1 ? 's' : ''} importada${imported.length > 1 ? 's' : ''}`,
          message: `Arquivo ${file.name}`,
          date: new Date().toISOString(),
          type: 'bill',
        });
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Não foi possível importar o arquivo. Verifique se é um CSV válido.');
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const stats = {
    total: bills.length,
    paid: bills.filter(b => b.paid).length,
    overdueCount: bills.filter(b => !b.paid && parseLocalDate(b.dueDate) < today).length,
    totalValue: bills.reduce((s, b) => s + b.amount, 0),
    paidValue: bills.filter(b => b.paid).reduce((s, b) => s + b.amount, 0),
  };

  const filterTabs: { id: FilterType; label: string; count: number }[] = [
    { id: 'pending', label: 'Pendentes', count: bills.filter(b => !b.paid && parseLocalDate(b.dueDate) >= today).length },
    { id: 'overdue', label: 'Atrasadas', count: stats.overdueCount },
    { id: 'paid', label: 'Contas Pagas', count: stats.paid },
    { id: 'all', label: 'Todas', count: bills.length },
  ];

  return (
    <motion.div className="space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="section-title">Contas a Pagar</h2>
          <p className="section-subtitle">
            {formatCurrency(stats.paidValue)} pagos de {formatCurrency(stats.totalValue)}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleImportFile} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="btn-secondary py-2 text-xs" title="Importar CSV">
            <Upload size={14} />
            <span className="hidden sm:inline">Importar</span>
          </button>
          <button onClick={exportCsv} className="btn-secondary py-2 text-xs" title="Exportar CSV">
            <Download size={14} />
            <span className="hidden sm:inline">Exportar</span>
          </button>
          <button onClick={() => setShowForm(true)} className="btn-primary py-2 text-xs">
            <Plus size={14} /> Nova Conta
          </button>
        </div>
      </div>

      {/* Stats mini-cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: formatCurrency(stats.totalValue), color: 'text-ink' },
          { label: 'Pago', value: formatCurrency(stats.paidValue), color: 'text-accent' },
          { label: 'Pendente', value: formatCurrency(stats.totalValue - stats.paidValue), color: 'text-warning-dark' },
          { label: 'Atrasadas', value: `${stats.overdueCount} conta${stats.overdueCount !== 1 ? 's' : ''}`, color: 'text-danger' },
        ].map(s => (
          <div key={s.label} className="card px-4 py-3">
            <p className="text-xs text-ink-muted mb-1">{s.label}</p>
            <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters + list */}
      <div className="card-p space-y-3">
        {/* Filter tabs */}
        <div className="tabs-scroll">
          {filterTabs.map(tab => (
            <button key={tab.id} onClick={() => setFilter(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                filter === tab.id ? 'bg-brand/10 text-accent' : 'text-ink-muted hover:bg-surface-100 hover:text-ink'
              }`}>
              {tab.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                filter === tab.id ? 'bg-brand/20 text-accent' : 'bg-surface-100'
              }`}>{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Search + sort */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="relative flex-1 min-w-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input className="input-sm pl-8" placeholder="Buscar por nome ou categoria..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-1">
            <Filter size={13} className="text-ink-muted" />
            {(['dueDate', 'amount', 'name'] as SortType[]).map(s => (
              <button key={s} onClick={() => toggleSort(s)}
                className={`text-xs px-2 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                  sort === s ? 'bg-brand/10 text-accent' : 'text-ink-muted hover:bg-surface-100'
                }`}>
                {s === 'dueDate' ? 'Data' : s === 'amount' ? 'Valor' : 'Nome'}
                {sort === s && <ArrowUpDown size={10} />}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="text-center py-10">
            <Search size={28} className="text-ink-faint mx-auto mb-3" />
            <p className="text-sm text-ink-muted">Nenhuma conta encontrada</p>
          </div>
        ) : (
          <div className="-mx-4 sm:-mx-6">
            <AnimatePresence>
              {filtered.map(bill => {
                const overdue = !bill.paid && parseLocalDate(bill.dueDate) < today;
                const catInfo = getCategoryInfo(bill.category);
                return (
                  <motion.div
                    key={bill.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="list-row"
                  >
                    <button
                      onClick={() => handleTogglePaid(bill.id)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mr-3 transition-all ${
                        bill.paid ? 'bg-brand border-brand text-white' : overdue ? 'border-danger hover:bg-danger/10' : 'border-surface-200 hover:border-brand'
                      }`}
                    >
                      {bill.paid && <CheckCircle2 size={11} />}
                    </button>

                    <span className="text-base mr-3 flex-shrink-0">{catInfo.emoji}</span>

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${bill.paid ? 'line-through text-ink-muted' : 'text-ink'}`}>
                        {bill.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-ink-muted">
                          {formatDateBR(bill.dueDate)}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                          style={{ background: catInfo.color + '20', color: catInfo.color }}>
                          {catInfo.label}
                        </span>
                        {bill.recurring && (
                          <span className="badge bg-info-light text-info-dark text-[10px]">
                            <RefreshCw size={9} /> Recorrente
                          </span>
                        )}
                        {bill.installments && (
                          <span className="text-[10px] text-ink-faint">{bill.installments}x</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right ml-3 flex-shrink-0">
                      <p className="text-sm font-bold text-ink">{formatCurrency(bill.amount)}</p>
                      <div className="flex items-center justify-end gap-1 mt-0.5">
                        {bill.paid ? (
                          <span className="badge-green text-[10px]"><CheckCircle2 size={9} /> Pago</span>
                        ) : overdue ? (
                          <span className="badge-red text-[10px]"><AlertTriangle size={9} /> Atrasado</span>
                        ) : (
                          <span className="badge-yellow text-[10px]"><Clock size={9} /> Pendente</span>
                        )}
                      </div>
                    </div>

                    <button onClick={() => setEditingBill(bill)}
                      className="ml-3 text-ink-faint hover:text-brand transition-colors p-1 flex-shrink-0">
                      <Pencil size={14} />
                    </button>

                    <button onClick={() => handleDelete(bill.id)}
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
        {showForm && <BillForm onClose={() => setShowForm(false)} onSave={handleAdd} />}
        {editingBill && (
          <BillForm
            initial={editingBill}
            onClose={() => setEditingBill(null)}
            onSave={data => handleEditSave(editingBill.id, data)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
