import { motion } from 'framer-motion';
import { useState } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { Reminder, Bill } from '../types';

interface CalendarProps {
  reminders: Reminder[];
  setReminders: (reminders: Reminder[]) => void;
  bills: Bill[];
  addNotification: (notification: { title: string; message: string; date: string; type: 'bill' | 'reminder' | 'system' | 'income' }) => void;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function Calendar({ reminders, setReminders, bills, addNotification }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [newReminder, setNewReminder] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: '12:00',
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const navigate = (dir: number) => setCurrentDate(new Date(year, month + dir, 1));

  const pad = (n: number) => n.toString().padStart(2, '0');
  const dateStr = (day: number) => `${year}-${pad(month + 1)}-${pad(day)}`;

  const remindersForDay = (day: number) => reminders.filter(r => r.date === dateStr(day));
  const billsForDay = (day: number) => bills.filter(b => b.dueDate === dateStr(day) && !b.paid);

  const monthReminders = reminders.filter(r => {
    const parts = r.date.split('-');
    if (parts.length < 2) return false;
    const yearPart = parseInt(parts[0], 10);
    const monthPart = parseInt(parts[1], 10) - 1;
    return monthPart === month && yearPart === year;
  }).sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));

  const addReminder = () => {
    if (!newReminder.title.trim()) return;
    const reminder: Reminder = {
      id: Date.now().toString(),
      title: newReminder.title,
      description: newReminder.description,
      date: newReminder.date,
      time: newReminder.time,
      completed: false,
    };
    setReminders([...reminders, reminder]);
    setNewReminder({ title: '', description: '', date: new Date().toISOString().split('T')[0], time: '12:00' });
    setShowAddReminder(false);
    addNotification({
      title: 'Lembrete Adicionado',
      message: `"${reminder.title}" para ${new Date(reminder.date + 'T12:00').toLocaleDateString('pt-BR')}`,
      date: new Date().toISOString(),
      type: 'reminder',
    });
  };

  const toggleComplete = (id: string) => {
    setReminders(reminders.map(r => r.id === id ? { ...r, completed: !r.completed } : r));
  };

  const deleteReminder = (id: string) => {
    setReminders(reminders.filter(r => r.id !== id));
  };

  const today = new Date();
  const isToday = (day: number) =>
    today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;

  return (
    <motion.div className="space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="section-title">Calendário</h2>
          <p className="section-subtitle">Lembretes e contas a vencer</p>
        </div>
        <button onClick={() => setShowAddReminder(true)} className="btn-primary py-2 text-xs flex-shrink-0">
          <Plus size={14} /> Novo Lembrete
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calendar grid */}
        <div className="lg:col-span-2 card-p space-y-3">
          {/* Month nav */}
          <div className="flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="btn-ghost !px-2">
              <ChevronLeft size={18} />
            </button>
            <h3 className="font-semibold text-ink text-sm">
              {MONTH_NAMES[month]} {year}
            </h3>
            <button onClick={() => navigate(1)} className="btn-ghost !px-2">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1">
            {WEEK_DAYS.map(d => (
              <div key={d} className="text-center text-xs font-medium text-ink-muted py-1">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }, (_, i) => (
              <div key={`e-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dayReminders = remindersForDay(day);
              const dayBills = billsForDay(day);
              const todayCell = isToday(day);
              return (
                <div
                  key={day}
                  className={`min-h-[60px] sm:min-h-[72px] rounded-lg p-1.5 border transition-colors overflow-hidden ${
                    todayCell
                      ? 'border-brand bg-brand/10'
                      : 'border-surface-100 hover:bg-surface-50'
                  }`}
                >
                  <div className={`text-xs font-semibold mb-1 ${todayCell ? 'text-accent' : 'text-ink'}`}>
                    {day}
                  </div>
                  {dayReminders.slice(0, 2).map(r => (
                    <div key={r.id} className={`text-[10px] px-1 py-0.5 mb-0.5 rounded truncate ${
                      r.completed ? 'bg-brand/10 text-accent' : 'bg-info-light text-info-dark'
                    }`}>
                      {r.title}
                    </div>
                  ))}
                  {dayBills.slice(0, 1).map(b => (
                    <div key={b.id} className="text-[10px] px-1 py-0.5 mb-0.5 rounded bg-danger-light text-danger truncate">
                      💰 {b.name}
                    </div>
                  ))}
                  {(dayReminders.length + dayBills.length > 2) && (
                    <div className="text-[9px] text-ink-faint">
                      +{dayReminders.length + dayBills.length - 2}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Reminder list */}
        <div className="card-p space-y-3">
          <h3 className="font-semibold text-ink text-sm">Lembretes do Mês</h3>
          <div className="space-y-2 max-h-[480px] overflow-y-auto">
            {monthReminders.length === 0 ? (
              <p className="text-center text-sm text-ink-muted py-8">Nenhum lembrete este mês</p>
            ) : monthReminders.map(r => (
              <div key={r.id} className={`p-3 rounded-lg border ${
                r.completed
                  ? 'bg-brand/10 border-brand/20'
                  : 'bg-surface-50 border-surface-200'
              }`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <button onClick={() => toggleComplete(r.id)}
                        className={r.completed ? 'text-brand' : 'text-ink-faint hover:text-ink-muted'}>
                        {r.completed ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                      </button>
                      <span className={`text-sm font-medium truncate ${
                        r.completed ? 'line-through text-ink-muted' : 'text-ink'
                      }`}>{r.title}</span>
                    </div>
                    {r.description && (
                      <p className="text-xs text-ink-muted ml-5 truncate">{r.description}</p>
                    )}
                    <p className="text-xs text-ink-faint ml-5 mt-0.5">
                      {new Date(r.date + 'T12:00').toLocaleDateString('pt-BR')} às {r.time}
                    </p>
                  </div>
                  <button onClick={() => deleteReminder(r.id)}
                    className="text-ink-faint hover:text-danger transition-colors p-1 flex-shrink-0">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add reminder modal */}
      {showAddReminder && (
        <div className="modal-overlay">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="modal-box p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-ink">Novo Lembrete</h3>
              <button onClick={() => setShowAddReminder(false)} className="btn-ghost p-1.5">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1.5">Título *</label>
                <input className="input" placeholder="Ex: Pagar fatura, Reunião..."
                  value={newReminder.title}
                  onChange={e => setNewReminder({ ...newReminder, title: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1.5">Descrição (opcional)</label>
                <textarea className="input resize-none h-16" placeholder="Detalhes adicionais..."
                  value={newReminder.description}
                  onChange={e => setNewReminder({ ...newReminder, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1.5">Data</label>
                  <input className="input" type="date"
                    value={newReminder.date}
                    onChange={e => setNewReminder({ ...newReminder, date: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1.5">Hora</label>
                  <input className="input" type="time"
                    value={newReminder.time}
                    onChange={e => setNewReminder({ ...newReminder, time: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddReminder(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={addReminder} className="btn-primary flex-1">Adicionar</button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
