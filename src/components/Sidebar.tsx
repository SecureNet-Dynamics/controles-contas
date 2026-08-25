import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Receipt, BarChart3, CalendarDays,
  Bell, Settings, TrendingUp, Target, Landmark,
  ChevronLeft, ChevronRight, Wallet, X, LogOut
} from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  notificationCount: number;
  userName: string;
  onLogout: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'bills', label: 'Contas', icon: Receipt },
  { id: 'income', label: 'Receitas', icon: TrendingUp },
  { id: 'analytics', label: 'Análises', icon: BarChart3 },
  { id: 'goals', label: 'Metas', icon: Target },
  { id: 'calendar', label: 'Calendário', icon: CalendarDays },
  { id: 'openfinance', label: 'Open Finance', icon: Landmark },
];

const bottomItems = [
  { id: 'notifications', label: 'Notificações', icon: Bell },
  { id: 'settings', label: 'Configurações', icon: Settings },
];

function NavItem({
  item,
  active,
  collapsed,
  badge,
  onClick,
}: {
  item: { id: string; label: string; icon: React.ElementType };
  active: boolean;
  collapsed: boolean;
  badge?: number;
  onClick: () => void;
}) {
  const Icon = item.icon;

  return (
    <button
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={`nav-item w-full text-left ${active ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`}
    >
      <div className="relative flex-shrink-0">
        <Icon size={18} />
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-brand text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </div>
      {!collapsed && (
        <span className="flex-1 truncate">{item.label}</span>
      )}
    </button>
  );
}

export default function Sidebar({
  activeSection,
  onSectionChange,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose,
  notificationCount,
  userName,
  onLogout,
}: SidebarProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userMenuOpen) return;
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [userMenuOpen]);

  const initials = userName
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase();

  const sidebarContent = (isMobile: boolean) => (
    <div className="flex flex-col h-full">
      {/* Top bar: brand + collapse toggle */}
      <div className={`flex items-center gap-2 p-3 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        <div className={`flex items-center gap-2.5 min-w-0 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center flex-shrink-0">
            <Wallet size={16} className="text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <span className="text-white font-bold text-sm leading-tight block truncate">FinanceFlow</span>
              <span className="block text-[10px] text-sidebar-text leading-tight">Pro</span>
            </div>
          )}
        </div>
        {!collapsed && !isMobile && (
          <button
            onClick={onToggleCollapse}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active transition-colors flex-shrink-0"
          >
            <ChevronLeft size={14} />
          </button>
        )}
      </div>

      {collapsed && !isMobile && (
        <button
          onClick={onToggleCollapse}
          className="mx-auto mb-1 w-7 h-7 rounded-lg flex items-center justify-center text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active transition-colors flex-shrink-0"
        >
          <ChevronRight size={14} />
        </button>
      )}

      {/* Main nav */}
      <nav className="flex-1 px-2.5 py-2 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <NavItem
            key={item.id}
            item={item}
            active={activeSection === item.id}
            collapsed={collapsed}
            onClick={() => { onSectionChange(item.id); onMobileClose(); }}
          />
        ))}
      </nav>

      <div className="sidebar-divider mx-2.5" />

      {/* Bottom nav */}
      <nav className="px-2.5 py-2 space-y-1">
        {bottomItems.map(item => (
          <NavItem
            key={item.id}
            item={item}
            active={activeSection === item.id}
            collapsed={collapsed}
            badge={item.id === 'notifications' ? notificationCount : undefined}
            onClick={() => { onSectionChange(item.id); onMobileClose(); }}
          />
        ))}
      </nav>

      <div className="sidebar-divider mx-2.5" />

      {/* User */}
      <div className="px-2.5 pb-2.5" ref={userMenuRef}>
        <button
          onClick={() => setUserMenuOpen(v => !v)}
          title={collapsed ? userName : undefined}
          className={`w-full flex items-center gap-2.5 py-2 rounded-lg hover:bg-white/5 transition-colors ${collapsed ? 'justify-center' : ''}`}
        >
          <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">{initials}</span>
          </div>
          {!collapsed && (
            <span className="text-sidebar-text text-xs truncate flex-1 text-left">{userName}</span>
          )}
        </button>

        <AnimatePresence>
          {userMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <button
                onClick={onLogout}
                title={collapsed ? 'Sair do sistema' : undefined}
                className={`w-full flex items-center gap-2.5 mt-1 px-3 py-2.5 rounded-lg text-sm text-danger hover:bg-danger/10 transition-colors ${collapsed ? 'justify-center px-0' : ''}`}
              >
                <LogOut size={14} className="flex-shrink-0" />
                {!collapsed && <span>Sair do sistema</span>}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar — floating card */}
      <div className="hidden md:flex p-3 h-screen sticky top-0 flex-shrink-0">
        <motion.aside
          animate={{ width: collapsed ? 68 : 224 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="flex flex-col h-full overflow-hidden bg-sidebar border border-sidebar-border rounded-2xl shadow-modal"
        >
          {sidebarContent(false)}
        </motion.aside>
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={onMobileClose}
            />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="fixed left-0 top-0 bottom-0 w-60 z-50 md:hidden flex flex-col bg-sidebar border-r border-sidebar-border"
            >
              <button
                onClick={onMobileClose}
                className="absolute top-4 right-4 text-sidebar-text hover:text-sidebar-text-active"
              >
                <X size={18} />
              </button>
              {sidebarContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
