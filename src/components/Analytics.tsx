import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, CartesianGrid, AreaChart, Area,
} from 'recharts';
import { Download, TrendingUp, TrendingDown, Target, DollarSign } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import type { Bill, Income } from '../types';
import { getCategoryInfo } from '../types';

interface AnalyticsProps {
  bills: Bill[];
  incomes: Income[];
}

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

type Period = '3m' | '6m' | '12m';

export default function Analytics({ bills, incomes }: AnalyticsProps) {
  const [period, setPeriod] = useState<Period>('6m');
  const today = new Date();

  const todayStr = today.toISOString().split('T')[0];
  const months = period === '3m' ? 3 : period === '6m' ? 6 : 12;

  const monthlyData = Array.from({ length: months }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (months - 1 - i), 1);
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
    const despesas = monthBills.reduce((s, b) => s + b.amount, 0);
    const receitas = monthIncome.reduce((s, inc) => s + inc.amount, 0);
    return {
      month: MONTHS[d.getMonth()],
      despesas,
      receitas,
      economia: receitas - despesas,
    };
  });

  const categoryData = Object.entries(
    bills.reduce((acc, b) => {
      acc[b.category] = (acc[b.category] ?? 0) + b.amount;
      return acc;
    }, {} as Record<string, number>)
  ).map(([cat, value]) => ({
    name: getCategoryInfo(cat).label,
    value,
    color: getCategoryInfo(cat).color,
    emoji: getCategoryInfo(cat).emoji,
  })).sort((a, b) => b.value - a.value);

  const totalBills = bills.reduce((s, b) => s + b.amount, 0);
  const totalPaid = bills.filter(b => b.paid).reduce((s, b) => s + b.amount, 0);
  const totalIncomeReceived = incomes.filter(i => i.received).reduce((s, i) => s + i.amount, 0);
  const savingsRate = totalIncomeReceived > 0
    ? Math.max(0, ((totalIncomeReceived - totalBills) / totalIncomeReceived) * 100)
    : 0;
  const onTimeRate = bills.length > 0
    ? (bills.filter(b => b.paid && b.dueDate >= todayStr).length / bills.length) * 100
    : 0;

  const exportReport = () => {
    const rows = [
      ['Relatório Financeiro - FinanceFlow Pro'],
      [''],
      ['Resumo Geral'],
      ['Total de Contas', formatCurrency(totalBills)],
      ['Total Pago', formatCurrency(totalPaid)],
      ['Total de Receitas', formatCurrency(totalIncomeReceived)],
      ['Taxa de Economia', `${savingsRate.toFixed(1)}%`],
      [''],
      ['Despesas por Categoria'],
      ...categoryData.map(c => [c.name, formatCurrency(c.value), `${((c.value / totalBills) * 100).toFixed(1)}%`]),
    ];
    const csvContent = rows.map(r => r.join(';')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'relatorio-financeiro.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div className="space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="section-title">Análises Financeiras</h2>
          <p className="section-subtitle">Insights detalhados sobre suas finanças</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1 bg-surface-100 rounded-lg p-1">
            {(['3m', '6m', '12m'] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  period === p ? 'bg-surface shadow-card text-ink' : 'text-ink-muted hover:text-ink'
                }`}>{p}</button>
            ))}
          </div>
          <button onClick={exportReport} className="btn-secondary py-2 text-xs">
            <Download size={14} /><span className="hidden sm:inline"> Exportar</span>
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Despesas', value: formatCurrency(totalBills), icon: TrendingDown, color: '#FF6B6B', sub: `${bills.length} contas` },
          { label: 'Total Receitas', value: formatCurrency(totalIncomeReceived), icon: TrendingUp, color: '#4C97D6', sub: `${incomes.filter(i => i.received).length} entradas` },
          { label: 'Taxa de Economia', value: `${savingsRate.toFixed(1)}%`, icon: Target, color: '#8C9EFF', sub: savingsRate >= 20 ? 'Excelente!' : 'Pode melhorar' },
          { label: 'Pagamentos em Dia', value: `${onTimeRate.toFixed(0)}%`, icon: DollarSign, color: '#8B5CF6', sub: `${bills.filter(b => b.paid).length} de ${bills.length}` },
        ].map(kpi => {
          const Icon = kpi.icon;
          return (
            <motion.div key={kpi.label} className="kpi-card"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-start justify-between">
                <p className="text-xs font-medium text-ink-muted">{kpi.label}</p>
                <Icon size={16} style={{ color: kpi.color }} strokeWidth={2} />
              </div>
              <p className="text-xl font-bold text-ink">{kpi.value}</p>
              <p className="text-xs text-ink-muted">{kpi.sub}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Area chart - Receitas vs Despesas */}
      <div className="card-p">
        <h3 className="font-semibold text-ink text-sm mb-4">Evolução Financeira</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={monthlyData}>
            <defs>
              <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4C97D6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#4C97D6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8C9EFF" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#8C9EFF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#20232A" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8A8F99' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#8A8F99' }} axisLine={false} tickLine={false}
              tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
            <Tooltip contentStyle={{ background: '#1A1C22', border: '1px solid #2A2D33', borderRadius: 8, fontSize: 12, color: '#F2F3F5' }}
              formatter={(v: any) => formatCurrency(Number(v || 0))} />
            <Area type="monotone" dataKey="receitas" stroke="#4C97D6" fill="url(#colorReceitas)" strokeWidth={2} name="Receitas" />
            <Area type="monotone" dataKey="despesas" stroke="#8C9EFF" fill="url(#colorDespesas)" strokeWidth={2} name="Despesas" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Row: bar chart + pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Economy bar chart */}
        <div className="card-p">
          <h3 className="font-semibold text-ink text-sm mb-4">Economia Mensal</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} barSize={28}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8A8F99' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#8A8F99' }} axisLine={false} tickLine={false}
                tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
              <Tooltip contentStyle={{ background: '#1A1C22', border: '1px solid #2A2D33', borderRadius: 8, fontSize: 12, color: '#F2F3F5' }}
                formatter={(v: any) => formatCurrency(Number(v || 0))} />
              <Bar dataKey="economia" radius={[4, 4, 0, 0]} name="Economia"
                fill="#4C97D6"
                label={{ position: 'top', fontSize: 10, fill: '#8A8F99',
                  formatter: (v: any) => v !== 0 && v !== undefined ? formatCurrency(Number(v)) : '' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category donut */}
        <div className="card-p">
          <h3 className="font-semibold text-ink text-sm mb-4">Despesas por Categoria</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={categoryData} cx="40%" cy="50%" innerRadius={55} outerRadius={80}
                  dataKey="value" paddingAngle={2}>
                  {categoryData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => formatCurrency(Number(v || 0))}
                  contentStyle={{ background: '#1A1C22', border: '1px solid #2A2D33', borderRadius: 8, fontSize: 12, color: '#F2F3F5' }} />
                <Legend iconType="circle" iconSize={8} layout="vertical" align="right" verticalAlign="middle"
                  formatter={(v) => <span style={{ fontSize: 11, color: '#8A8F99' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-ink-faint text-sm">
              Sem dados de despesas
            </div>
          )}
        </div>
      </div>

      {/* Category breakdown table */}
      {categoryData.length > 0 && (
        <div className="card-p">
          <h3 className="font-semibold text-ink text-sm mb-4">Detalhamento por Categoria</h3>
          <div className="space-y-3">
            {categoryData.map(cat => {
              const pct = totalBills > 0 ? (cat.value / totalBills) * 100 : 0;
              return (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span>{cat.emoji}</span>
                      <span className="text-sm font-medium text-ink">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-ink-muted">{pct.toFixed(1)}%</span>
                      <span className="text-sm font-bold text-ink w-24 text-right">{formatCurrency(cat.value)}</span>
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: cat.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
