import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Calculator from './Calculator';
import type { User, Notification } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
  user: User;
  onLogout: () => void;
  notifications: Notification[];
}

export default function Layout({
  children,
  activeSection,
  onSectionChange,
  user,
  onLogout,
  notifications,
}: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex h-screen bg-surface-50 overflow-hidden">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={onSectionChange}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(v => !v)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        notificationCount={unreadCount}
        userName={user.nome}
        onLogout={onLogout}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          onMobileMenuToggle={() => setMobileOpen(true)}
          onCalculatorToggle={() => setCalculatorOpen(v => !v)}
          activeSection={activeSection}
        />

        <main className="flex-1 overflow-y-auto bg-surface-50">
          <div className="max-w-7xl mx-auto p-4 sm:p-6">
            {children}
          </div>
        </main>
      </div>

      <Calculator
        isOpen={calculatorOpen}
        onClose={() => setCalculatorOpen(false)}
      />
    </div>
  );
}
