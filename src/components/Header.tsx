import { Menu, Calculator, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeProvider';

interface HeaderProps {
  onMobileMenuToggle: () => void;
  onCalculatorToggle: () => void;
  activeSection: string;
}

const sectionTitles: Record<string, { title: string; subtitle: string }> = {
  dashboard:    { title: 'Dashboard',      subtitle: 'Visão geral das suas finanças' },
  bills:        { title: 'Contas',         subtitle: 'Gerencie suas despesas' },
  income:       { title: 'Receitas',       subtitle: 'Controle suas entradas' },
  analytics:    { title: 'Análises',       subtitle: 'Insights financeiros' },
  goals:        { title: 'Metas',          subtitle: 'Acompanhe seus objetivos' },
  calendar:     { title: 'Calendário',     subtitle: 'Lembretes e vencimentos' },
  openfinance:  { title: 'Open Finance',   subtitle: 'Conecte seus bancos' },
  notifications:{ title: 'Notificações',  subtitle: 'Alertas e avisos' },
  settings:     { title: 'Configurações', subtitle: 'Preferências do app' },
};

export default function Header({
  onMobileMenuToggle, onCalculatorToggle, activeSection,
}: HeaderProps) {
  const { darkMode, toggleTheme } = useTheme();
  const currentSection = sectionTitles[activeSection] ?? sectionTitles.dashboard;

  return (
    <header className="h-14 bg-surface border-b border-surface-200 flex items-center px-3 sm:px-4 gap-2 sm:gap-4 sticky top-0 z-30">

      {/* Mobile menu toggle */}
      <button onClick={onMobileMenuToggle} className="md:hidden btn-ghost !px-2">
        <Menu size={20} />
      </button>

      {/* Page title */}
      <div className="min-w-0 flex-1">
        <h1 className="text-sm font-semibold text-ink leading-tight truncate">{currentSection.title}</h1>
        <p className="hidden sm:block text-xs text-ink-faint leading-tight">{currentSection.subtitle}</p>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">

        {/* Theme toggle */}
        <button onClick={toggleTheme} className="btn-ghost !px-2" title={darkMode ? 'Modo claro' : 'Modo escuro'}>
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Calculator */}
        <button onClick={onCalculatorToggle} className="btn-ghost !px-2" title="Calculadora">
          <Calculator size={18} />
        </button>
      </div>
    </header>
  );
}
