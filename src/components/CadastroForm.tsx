import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Wallet, ArrowRight, User, Mail, Phone, Loader2, AlertCircle } from 'lucide-react';
import type { User as UserType } from '../types';
import { signIn, signUp } from '../lib/auth';
import { isSupabaseEnabled } from '../lib/supabase';

interface AuthProps {
  onLogin: (user: UserType) => void;
}

const NEUMORPHIC_BG = '#E9ECF1';
const CARD_SHADOW = '12px 12px 28px rgba(163,177,198,0.55), -12px -12px 28px rgba(255,255,255,0.85)';
const INSET_SHADOW = 'inset 5px 5px 10px rgba(163,177,198,0.5), inset -5px -5px 10px rgba(255,255,255,0.85)';
const BUTTON_SHADOW = '6px 6px 14px rgba(163,177,198,0.5), -4px -4px 10px rgba(255,255,255,0.6)';

export default function Auth({ onLogin }: AuthProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ nome: '', email: '', celular: '', senha: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isSupabaseEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#0A0B0E' }}>
        <div className="max-w-sm text-center space-y-3">
          <AlertCircle size={32} className="text-danger mx-auto" />
          <h1 className="text-white font-bold text-lg">Banco de dados não configurado</h1>
          <p className="text-gray-400 text-sm">
            Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.local para habilitar o login.
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    const emailNorm = form.email.trim().toLowerCase();
    if (!emailNorm.includes('@')) return setError('E-mail inválido');
    if (form.senha.length < 6) return setError('Senha muito curta (mínimo 6 caracteres)');

    setLoading(true);
    try {
      if (mode === 'register') {
        if (!form.nome.trim()) throw new Error('Nome é obrigatório');
        if (form.nome.trim().split(' ').length < 2) throw new Error('Digite nome e sobrenome');
        const { user, needsConfirmation } = await signUp(form.nome.trim(), emailNorm, form.celular.trim(), form.senha);
        if (needsConfirmation) {
          setInfo('Conta criada! Verifique seu e-mail para confirmar o cadastro antes de entrar.');
          setMode('login');
          setForm(f => ({ ...f, senha: '' }));
        } else {
          onLogin(user);
        }
      } else {
        const user = await signIn(emailNorm, form.senha);
        onLogin(user);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo deu errado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const neumorphicInput = 'w-full bg-transparent rounded-full px-5 py-3.5 pl-11 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none transition-shadow';

  return (
    <div className="min-h-screen flex" style={{ background: '#0A0B0E' }}>
      {/* Left panel — vídeo de fundo */}
      <div className="hidden lg:block relative w-1/2 overflow-hidden">
        <video
          autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/media/login-bg.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/60" />

        <div className="relative h-full flex flex-col justify-between p-12">
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
              <p className="text-gray-300 mt-3 leading-relaxed">
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
                  <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center text-base">
                    {f.emoji}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{f.title}</p>
                    <p className="text-xs text-gray-400">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-gray-400">
            © 2026 FinanceFlow Pro · Seus dados ficam protegidos na nuvem
          </p>
        </div>
      </div>

      {/* Right panel — cartão neumórfico */}
      <div className="flex-1 flex items-center justify-center p-6" style={{ background: NEUMORPHIC_BG }}>
        <div className="w-full max-w-sm rounded-[28px] p-8" style={{ background: NEUMORPHIC_BG, boxShadow: CARD_SHADOW }}>
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
              <Wallet size={16} className="text-white" />
            </div>
            <span className="text-gray-700 font-bold">FinanceFlow Pro</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={mode} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <h2 className="text-2xl font-bold text-gray-700 mb-1">
                {mode === 'login' ? 'Bem-vindo de volta' : 'Criar conta'}
              </h2>
              <p className="text-gray-500 text-sm mb-8">
                {mode === 'login' ? 'Entre para continuar' : 'Comece a controlar suas finanças'}
              </p>

              {error && (
                <div className="mb-4 px-4 py-2.5 rounded-2xl bg-red-100/70 text-red-600 text-sm">
                  {error}
                </div>
              )}

              {info && (
                <div className="mb-4 px-4 py-2.5 rounded-2xl bg-blue-100/70 text-blue-700 text-sm">
                  {info}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {mode === 'register' && (
                  <div className="relative" style={{ borderRadius: 9999, boxShadow: INSET_SHADOW }}>
                    <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Nome completo"
                      value={form.nome}
                      onChange={e => setForm({ ...form, nome: e.target.value })}
                      className={neumorphicInput}
                      required
                    />
                  </div>
                )}

                <div className="relative" style={{ borderRadius: 9999, boxShadow: INSET_SHADOW }}>
                  <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    placeholder="E-mail"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className={neumorphicInput}
                    required
                  />
                </div>

                {mode === 'register' && (
                  <div className="relative" style={{ borderRadius: 9999, boxShadow: INSET_SHADOW }}>
                    <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      placeholder="Celular (opcional)"
                      value={form.celular}
                      onChange={e => setForm({ ...form, celular: e.target.value })}
                      className={neumorphicInput}
                    />
                  </div>
                )}

                <div className="relative" style={{ borderRadius: 9999, boxShadow: INSET_SHADOW }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="Senha (mínimo 6 caracteres)"
                    value={form.senha}
                    onChange={e => setForm({ ...form, senha: e.target.value })}
                    className={`${neumorphicInput} pr-11`}
                    required
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-600 disabled:opacity-60 text-white font-medium py-3.5 rounded-full transition-colors"
                  style={{ boxShadow: BUTTON_SHADOW }}>
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      {mode === 'login' ? 'Entrar' : 'Criar conta'}
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                {mode === 'login' ? 'Não tem conta?' : 'Já tem conta?'}{' '}
                <button
                  onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setInfo(''); }}
                  className="text-brand-600 hover:text-brand-700 font-medium transition-colors"
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
