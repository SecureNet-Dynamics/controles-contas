import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet } from 'lucide-react';

interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

export default function LoadingScreen({ onLoadingComplete }: LoadingScreenProps) {
  useEffect(() => {
    const t = setTimeout(onLoadingComplete, 2000);
    return () => clearTimeout(t);
  }, [onLoadingComplete]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#0A0B0E' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex flex-col items-center gap-6"
      >
        <motion.div
          className="w-20 h-20 rounded-2xl bg-brand flex items-center justify-center shadow-brand"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Wallet size={36} className="text-white" />
        </motion.div>

        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">FinanceFlow Pro</h1>
          <p className="text-gray-500 text-sm mt-1">Carregando suas finanças...</p>
        </div>

        {/* Loading bar */}
        <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-brand rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.8, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>
    </div>
  );
}
