import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Zap, CheckCircle2,
  Lock, RefreshCw, Search, FileText, AlertCircle,
  Building2, CreditCard, TrendingUp, ArrowRight,
} from 'lucide-react';

const BANKS = [
  { id: 'itau', name: 'Itaú', color: '#EC7000', logo: '🟠' },
  { id: 'bradesco', name: 'Bradesco', color: '#CC0000', logo: '🔴' },
  { id: 'bb', name: 'Banco do Brasil', color: '#F7D900', logo: '🟡' },
  { id: 'caixa', name: 'Caixa Econômica', color: '#0066A1', logo: '🔵' },
  { id: 'santander', name: 'Santander', color: '#EC0000', logo: '🔴' },
  { id: 'nubank', name: 'Nubank', color: '#8A05BE', logo: '🟣' },
  { id: 'inter', name: 'Inter', color: '#FF7A00', logo: '🟠' },
  { id: 'c6', name: 'C6 Bank', color: '#000000', logo: '⚫' },
  { id: 'picpay', name: 'PicPay', color: '#21C25E', logo: '🟢' },
  { id: 'pagbank', name: 'PagBank', color: '#00B28B', logo: '🟢' },
];

type Tab = 'connect' | 'boletos' | 'import';

export default function OpenFinance() {
  const [activeTab, setActiveTab] = useState<Tab>('connect');
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [cpf, setCpf] = useState('');
  const [cpfSearch, setCpfSearch] = useState(false);
  const [connectStep, setConnectStep] = useState<'select' | 'auth' | 'success' | null>(null);

  const formatCpf = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 11);
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  return (
    <motion.div className="space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div>
        <h2 className="section-title">Open Finance</h2>
        <p className="section-subtitle">Conecte seus bancos e consulte boletos pelo CPF</p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 px-4 py-3 bg-info-light border border-info/20 rounded-xl">
        <Shield size={16} className="text-info mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-info-dark">Open Finance Brasil</p>
          <p className="text-xs text-info-dark/80 mt-0.5">
            O Open Finance é regulamentado pelo Banco Central. Suas credenciais nunca são armazenadas
            — a autenticação é feita diretamente pelo seu banco com OAuth 2.0.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-surface-200 overflow-x-auto scrollbar-none">
        {([
          { id: 'connect', label: 'Conectar Banco', icon: Building2 },
          { id: 'boletos', label: 'Boletos por CPF', icon: FileText },
          { id: 'import', label: 'Importar Extrato', icon: TrendingUp },
        ] as { id: Tab; label: string; icon: React.ElementType }[]).map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-brand text-accent'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}>
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab: Connect Bank */}
      {activeTab === 'connect' && (
        <AnimatePresence mode="wait">
          {connectStep === null && (
            <motion.div key="select-bank" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="card-p space-y-4">
                <div className="flex items-center gap-2">
                  <Zap size={16} className="text-brand" />
                  <h3 className="font-semibold text-ink text-sm">Selecione seu banco</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {BANKS.map(bank => (
                    <button
                      key={bank.id}
                      onClick={() => { setSelectedBank(bank.id); setConnectStep('select'); }}
                      className={`card px-3 py-4 flex flex-col items-center gap-2 hover:shadow-card-hover transition-all hover:-translate-y-0.5 ${
                        selectedBank === bank.id ? 'ring-2 ring-brand' : ''
                      }`}
                    >
                      <span className="text-2xl">{bank.logo}</span>
                      <span className="text-xs font-medium text-ink text-center leading-tight">{bank.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                {[
                  { icon: RefreshCw, title: 'Sincronização automática', desc: 'Saldo e transações atualizados em tempo real' },
                  { icon: Lock, title: '100% Seguro', desc: 'Criptografia bancária e autenticação OAuth' },
                  { icon: CreditCard, title: 'Múltiplas contas', desc: 'Conecte corrente, poupança e cartões' },
                ].map(f => {
                  const Icon = f.icon;
                  return (
                    <div key={f.title} className="card-p flex gap-3">
                      <div className="w-9 h-9 rounded-lg bg-brand/15 flex items-center justify-center flex-shrink-0">
                        <Icon size={16} className="text-accent" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ink">{f.title}</p>
                        <p className="text-xs text-ink-muted mt-0.5">{f.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {connectStep === 'select' && selectedBank && (
            <motion.div key="auth" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card-p max-w-md mx-auto">
              <div className="text-center mb-6">
                <span className="text-5xl">{BANKS.find(b => b.id === selectedBank)?.logo}</span>
                <h3 className="font-bold text-ink text-lg mt-3">
                  Conectar {BANKS.find(b => b.id === selectedBank)?.name}
                </h3>
                <p className="text-sm text-ink-muted mt-1">
                  Você será redirecionado para o app do banco para autorizar o acesso
                </p>
              </div>
              <div className="space-y-3 mb-6">
                {[
                  'Acesso somente leitura — não fazemos transações',
                  'Seus dados ficam no seu dispositivo',
                  'Revogue o acesso quando quiser no app do banco',
                ].map(item => (
                  <div key={item} className="flex items-center gap-2 text-sm text-ink-muted">
                    <CheckCircle2 size={14} className="text-brand flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setConnectStep(null)} className="btn-secondary flex-1">Voltar</button>
                <button onClick={() => setConnectStep('success')} className="btn-primary flex-1">
                  Autorizar <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          )}

          {connectStep === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="card-p max-w-md mx-auto text-center py-10">
              <div className="w-16 h-16 bg-brand/15 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-brand" />
              </div>
              <h3 className="font-bold text-ink text-lg">Banco conectado!</h3>
              <p className="text-sm text-ink-muted mt-2 mb-6">
                {BANKS.find(b => b.id === selectedBank)?.name} foi vinculado com sucesso.
                Suas transações serão sincronizadas automaticamente.
              </p>
              <button onClick={() => { setConnectStep(null); setSelectedBank(null); }} className="btn-primary">
                Conectar outro banco
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Tab: Boletos por CPF */}
      {activeTab === 'boletos' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="card-p max-w-lg">
            <h3 className="font-semibold text-ink text-sm mb-4 flex items-center gap-2">
              <FileText size={15} className="text-brand" />
              Consultar Boletos por CPF
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1.5">CPF</label>
                <input className="input" placeholder="000.000.000-00"
                  value={cpf} onChange={e => setCpf(formatCpf(e.target.value))}
                  maxLength={14} />
              </div>
              <button
                onClick={() => setCpfSearch(true)}
                disabled={cpf.replace(/\D/g, '').length !== 11}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Search size={14} /> Consultar Boletos
              </button>
            </div>
          </div>

          {cpfSearch && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="card-p">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle size={15} className="text-warning" />
                <p className="text-sm font-medium text-ink">Resultado da consulta para {cpf}</p>
              </div>
              <div className="text-center py-8">
                <p className="text-sm text-ink-muted">
                  A consulta de boletos via CPF requer integração com a API da CIP (Câmara Interbancária de Pagamentos) ou Banco Central.
                </p>
                <p className="text-xs text-ink-faint mt-2">
                  Para usar em produção, cadastre-se em <span className="text-brand">developer.bacen.gov.br</span>
                </p>
                <button onClick={() => setCpfSearch(false)} className="btn-secondary mt-4 text-xs">
                  Nova consulta
                </button>
              </div>
            </motion.div>
          )}

          <div className="card-p bg-surface-50">
            <p className="text-xs font-semibold text-ink-muted mb-3 uppercase tracking-wide">Como funciona</p>
            <div className="space-y-2">
              {[
                { step: '1', text: 'Informe seu CPF para buscar todos os boletos registrados' },
                { step: '2', text: 'A consulta usa a base da CIP (Câmara Interbancária de Pagamentos)' },
                { step: '3', text: 'Boletos encontrados são importados automaticamente para suas contas' },
              ].map(s => (
                <div key={s.step} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-brand/15 text-accent text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {s.step}
                  </div>
                  <p className="text-sm text-ink-muted">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Tab: Import Statement */}
      {activeTab === 'import' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="card-p max-w-lg">
            <h3 className="font-semibold text-ink text-sm mb-4 flex items-center gap-2">
              <TrendingUp size={15} className="text-brand" />
              Importar Extrato Bancário
            </h3>
            <div
              className="border-2 border-dashed border-surface-200 rounded-xl p-8 text-center hover:border-brand hover:bg-brand/10 transition-all cursor-pointer"
              onDragOver={e => e.preventDefault()}
            >
              <div className="w-12 h-12 bg-surface-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <FileText size={20} className="text-ink-muted" />
              </div>
              <p className="font-medium text-ink text-sm">Arraste seu arquivo aqui</p>
              <p className="text-xs text-ink-muted mt-1">Suporta OFX, CSV, PDF</p>
              <button className="btn-secondary mt-4 text-xs">Escolher arquivo</button>
            </div>
            <p className="text-xs text-ink-faint mt-3 text-center">
              O extrato é processado localmente — nenhum dado é enviado para servidores externos
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { format: 'OFX', desc: 'Padrão exportado pela maioria dos bancos brasileiros', icon: '📄' },
              { format: 'CSV', desc: 'Planilha com colunas: data, descrição, valor, tipo', icon: '📊' },
              { format: 'PDF', desc: 'Extrato em PDF — extração automática de dados', icon: '📋' },
            ].map(f => (
              <div key={f.format} className="card px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <span>{f.icon}</span>
                  <span className="font-semibold text-sm text-ink">{f.format}</span>
                </div>
                <p className="text-xs text-ink-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
