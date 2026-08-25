import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2, AlertCircle, Info, CalendarDays, TrendingUp, CheckCheck } from 'lucide-react';
import type { Notification } from '../types';

interface NotificationsProps {
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  addNotification?: (n: Omit<Notification, 'id' | 'read'>) => void;
}

const typeConfig: Record<Notification['type'], { icon: React.ElementType; color: string; bg: string }> = {
  bill: { icon: AlertCircle, color: '#FF6B6B', bg: 'rgba(255,107,107,0.12)' },
  reminder: { icon: CalendarDays, color: '#8C9EFF', bg: 'rgba(140,158,255,0.12)' },
  system: { icon: Info, color: '#9497A0', bg: 'rgba(148,151,160,0.12)' },
  income: { icon: TrendingUp, color: '#5EA6E8', bg: 'rgba(94,166,232,0.12)' },
};

export default function Notifications({ notifications, setNotifications }: NotificationsProps) {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const markRead = (id: string) =>
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  const markAllRead = () =>
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  const del = (id: string) =>
    setNotifications(prev => prev.filter(n => n.id !== id));

  const clearAll = () => setNotifications([]);

  const filtered = notifications.filter(n => filter === 'unread' ? !n.read : true);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <motion.div className="space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="section-title">Notificações</h2>
          <p className="section-subtitle">{unreadCount} não lida{unreadCount !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="btn-secondary py-2 text-xs">
              <CheckCheck size={14} /> Marcar todas
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={clearAll} className="btn-danger py-2 text-xs">
              <Trash2 size={14} /> Limpar
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: notifications.length, color: '#9497A0' },
          { label: 'Não lidas', value: unreadCount, color: '#8C9EFF' },
          { label: 'Lidas', value: notifications.filter(n => n.read).length, color: '#4C97D6' },
        ].map(s => (
          <div key={s.label} className="card px-4 py-3 text-center">
            <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-ink-muted">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="card-p">
        <div className="flex items-center gap-1 border-b border-surface-100 -mx-6 px-6 pb-3 mb-3">
          {(['all', 'unread'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f ? 'bg-brand/10 text-accent' : 'text-ink-muted hover:bg-surface-100'
              }`}>
              {f === 'all' ? `Todas (${notifications.length})` : `Não lidas (${unreadCount})`}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-10">
            <Bell size={32} className="text-ink-faint mx-auto mb-3" />
            <p className="text-sm text-ink-muted">
              {filter === 'unread' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {filtered.map(n => {
                const cfg = typeConfig[n.type] ?? typeConfig.system;
                const Icon = cfg.icon;
                return (
                  <motion.div key={n.id} layout
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                      !n.read ? 'border-brand/20 bg-brand/10' : 'border-surface-100'
                    }`}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: cfg.bg }}>
                      <Icon size={15} style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium ${n.read ? 'text-ink-muted' : 'text-ink'}`}>
                          {n.title}
                        </p>
                        <span className="text-[10px] text-ink-faint whitespace-nowrap flex-shrink-0">
                          {new Date(n.date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-ink-muted mt-0.5">{n.message}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {!n.read && (
                          <button onClick={() => markRead(n.id)}
                            className="text-[10px] px-2 py-1 bg-brand/15 text-accent rounded-full hover:bg-brand/20 transition-colors flex items-center gap-1">
                            <Check size={9} /> Marcar como lida
                          </button>
                        )}
                        <button onClick={() => del(n.id)}
                          className="text-[10px] text-ink-faint hover:text-danger transition-colors px-2 py-1">
                          Excluir
                        </button>
                      </div>
                    </div>
                    {!n.read && (
                      <div className="w-2 h-2 rounded-full bg-brand flex-shrink-0 mt-1" />
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
