import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Wallet, ArrowRight, User, Mail, Phone } from 'lucide-react';
import type { User as UserType } from '../types';

interface AuthProps {
  onLogin: (user: UserType) => void;
}

export default function Auth({ onLogin }: AuthProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ nome: '', email: '', celular: '', senha: '' });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const emailNorm = form.email.trim().toLowerCase();
    if (!emailNorm.includes('@')) return setError('E-mail inválido');
    if (form.senha.length < 4) return setError('Senha muito curta (mínimo 4 caracteres)');

    // Load registered users list
    const rawUsers = localStorage.getItem('registeredUsers');
    let users: Array<UserType & { senha?: string }> = rawUsers ? JSON.parse(rawUsers) : [];

    // Seed legacy single user if present to prevent lockout
    const legacyUserRaw = localStorage.getItem('financeFlowUser');
    if (legacyUserRaw) {
      try {
        const legacyU = JSON.parse(legacyUserRaw);
        if (legacyU && legacyU.email && !users.find(x => x.email.toLowerCase() === legacyU.email.toLowerCase())) {
          users.push({ ...legacyU, senha: '123' });
          localStorage.setItem('registeredUsers', JSON.stringify(users));
        }
      } catch (err) {}
    }

    if (mode === 'register') {
      if (!form.nome.trim()) return setError('Nome é obrigatório');
      if (form.nome.trim().split(' ').length < 2) return setError('Digite nome e sobrenome');

      const exists = users.find(u => u.email.toLowerCase() === emailNorm);
      if (exists) {
        return setError('Este e-mail já está cadastrado. Vá para a tela de Login.');
      }

      const newUser: UserType & { senha?: string } = {
        id: Date.now().toString(),
        nome: form.nome.trim(),
        email: emailNorm,
        celular: form.celular.trim() || '',
        senha: form.senha,
      };

      users.push(newUser);
      localStorage.setItem('registeredUsers', JSON.stringify(users));

      const cleanUser: UserType = {
        id: newUser.id,
        nome: newUser.nome,
        email: newUser.email,
        celular: newUser.celular,
      };
      localStorage.setItem('financeFlowUser', JSON.stringify(cleanUser));
      localStorage.setItem('userLoggedIn', 'true');
      onLogin(cleanUser);
    } else {
      // Login mode
      const userMatch = users.find(u => u.email.toLowerCase() === emailNorm);
      if (!userMatch) {
        return setError('Usuário não encontrado. Crie uma conta.');
      }
      if (userMatch.senha && userMatch.senha !== form.senha) {
        return setError('E-mail ou senha incorretos.');
      }

      const cleanUser: UserType = {
        id: userMatch.id,
        nome: userMatch.nome,
        email: userMatch.email,
        celular: userMatch.celular,
      };
      localStorage.setItem('financeFlowUser', JSON.stringify(cleanUser));
      localStorage.setItem('userLoggedIn', 'true');
      onLogin(cleanUser);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#0A0A14' }}>
      {/* Left panel - branding */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] p-12" style={{ background: '#1C1C28' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center">
            <Wallet size={20} className="text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-lg leading-none">FinanceFlow</span>
            <span className="block text-xs text-gray-400 leading-none">Pro</span>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-white leading-tight">
              Controle total das suas finanças
            </h1>
            <p className="text-gray-400 mt-3 leading-relaxed">
              Gerencie contas, receitas e metas. Conecte seus bancos e tenha uma visão completa da sua vida financeira.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { emoji: '📊', title: 'Dashboard completo', desc: 'Gráficos e insights em tempo real' },
              { emoji: '🏦', title: 'Open Finance', desc: 'Conecte seus bancos com segurança' },
              { emoji: '🎯', title: 'Metas de orçamento', desc: 'Defina limites por categoria' },
              { emoji: '📅', title: 'Lembretes de vencimento', desc: 'Nunca perca um pagamento' },
            ].map(f => (
              <div key={f.title} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-sidebar-hover flex items-center justify-center text-base">
                  {f.emoji}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{f.title}</p>
                  <p className="text-xs text-gray-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-600">
          © 2026 FinanceFlow Pro · Seus dados ficam no seu dispositivo
        </p>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
              <Wallet size={16} className="text-white" />
            </div>
            <span className="text-white font-bold">FinanceFlow Pro</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={mode} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <h2 className="text-2xl font-bold text-white mb-1">
                {mode === 'login' ? 'Bem-vindo de volta' : 'Criar conta'}
              </h2>
              <p className="text-gray-400 text-sm mb-8">
                {mode === 'login' ? 'Entre para continuar' : 'Comece a controlar suas finanças'}
              </p>

              {error && (
                <div className="mb-4 px-3 py-2 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'register' && (
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Nome completo"
                      value={form.nome}
                      onChange={e => setForm({ ...form, nome: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-10 text-white placeholder:text-gray-500 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
                      required
                    />
                  </div>
                )}

                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="email"
                    placeholder="E-mail"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-10 text-white placeholder:text-gray-500 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
                    required
                  />
                </div>

                {mode === 'register' && (
                  <div className="relative">
                    <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="tel"
                      placeholder="Celular (opcional)"
                      value={form.celular}
                      onChange={e => setForm({ ...form, celular: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-10 text-white placeholder:text-gray-500 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
                    />
                  </div>
                )}

                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="Senha"
                    value={form.senha}
                    onChange={e => setForm({ ...form, senha: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-10 text-white placeholder:text-gray-500 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
                    required
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                <button type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-600 text-white font-semibold py-3 rounded-xl transition-colors shadow-brand">
                  {mode === 'login' ? 'Entrar' : 'Criar conta'}
                  <ArrowRight size={16} />
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                {mode === 'login' ? 'Não tem conta?' : 'Já tem conta?'}{' '}
                <button
                  onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
                  className="text-brand hover:text-brand-400 font-medium transition-colors"
                >
                  {mode === 'login' ? 'Criar agora' : 'Entrar'}
                </button>
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
