import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface CalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
}

export default function Calculator({ isOpen, onClose, darkMode }: CalculatorProps) {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);

  // Keyboard support
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      if (key >= '0' && key <= '9') {
        e.preventDefault();
        inputNumber(key);
      } else if (key === ',' || key === '.') {
        e.preventDefault();
        inputDecimal();
      } else if (key === '+') {
        e.preventDefault();
        performOperation('+');
      } else if (key === '-') {
        e.preventDefault();
        performOperation('-');
      } else if (key === '*') {
        e.preventDefault();
        performOperation('×');
      } else if (key === '/') {
        e.preventDefault();
        performOperation('÷');
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        calculate();
      } else if (key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (key === 'Backspace') {
        e.preventDefault();
        setDisplay(prev => {
          if (prev.length <= 1) return '0';
          return prev.slice(0, -1);
        });
      } else if (key.toLowerCase() === 'c') {
        e.preventDefault();
        clear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, display, previousValue, operation, waitingForNewValue]);

  // Função para formatar o número para exibição
  const formatDisplay = (value: string): string => {
    if (value === '' || value === '0') return '0';
    
    // Se não tem vírgula, formata como número inteiro
    if (!value.includes(',')) {
      const number = parseInt(value, 10);
      return isNaN(number) ? value : number.toLocaleString('pt-BR');
    }
    
    // Se tem vírgula, formata parte inteira e mantém decimal
    const [integerPart, decimalPart] = value.split(',');
    const number = parseInt(integerPart || '0', 10);
    const formattedInteger = isNaN(number) ? (integerPart || '0') : number.toLocaleString('pt-BR');
    return `${formattedInteger},${decimalPart}`;
  };

  // Função para converter display para número
  const parseDisplay = (displayValue: string): number => {
    const cleanValue = displayValue.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleanValue) || 0;
  };

  const inputNumber = (num: string) => {
    if (waitingForNewValue) {
      setDisplay(num);
      setWaitingForNewValue(false);
    } else {
      if (display === '0') {
        setDisplay(num);
      } else {
        setDisplay(display + num);
      }
    }
  };

  const inputDecimal = () => {
    if (waitingForNewValue) {
      setDisplay('0,');
      setWaitingForNewValue(false);
    } else if (!display.includes(',')) {
      setDisplay(display + ',');
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForNewValue(false);
  };

  const clearEntry = () => {
    setDisplay('0');
  };

  const performOperation = (nextOperation: string) => {
    const inputValue = parseDisplay(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const result = calculateResult(previousValue, inputValue, operation);
      setDisplay(result.toString().replace('.', ','));
      setPreviousValue(result);
    }

    setWaitingForNewValue(true);
    setOperation(nextOperation);
  };

  const calculateResult = (a: number, b: number, op: string): number => {
    let result = 0;
    switch (op) {
      case '+':
        result = a + b;
        break;
      case '-':
        result = a - b;
        break;
      case '×':
        result = a * b;
        break;
      case '÷':
        result = b !== 0 ? a / b : 0;
        break;
      default:
        result = b;
    }
    // Fix floating point errors using round precision
    return Math.round(result * 1e8) / 1e8;
  };

  const calculate = () => {
    if (previousValue !== null && operation) {
      const inputValue = parseDisplay(display);
      const result = calculateResult(previousValue, inputValue, operation);
      
      setDisplay(result.toString().replace('.', ','));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForNewValue(true);
    }
  };

  const toggleSign = () => {
    if (display !== '0') {
      if (display.startsWith('-')) {
        setDisplay(display.slice(1));
      } else {
        setDisplay('-' + display);
      }
    }
  };

  const buttons = [
    { label: 'C', action: clear, className: 'bg-red-400 hover:bg-red-500 text-white', span: 1 },
    { label: 'CE', action: clearEntry, className: 'bg-red-400 hover:bg-red-500 text-white', span: 1 },
    { label: '±', action: toggleSign, className: 'bg-gray-400 hover:bg-gray-500 text-white', span: 1 },
    { label: '÷', action: () => performOperation('÷'), className: 'bg-pink-500 hover:bg-pink-600 text-white', span: 1 },

    { label: '7', action: () => inputNumber('7'), className: 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500', span: 1 },
    { label: '8', action: () => inputNumber('8'), className: 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500', span: 1 },
    { label: '9', action: () => inputNumber('9'), className: 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500', span: 1 },
    { label: '×', action: () => performOperation('×'), className: 'bg-pink-500 hover:bg-pink-600 text-white', span: 1 },

    { label: '4', action: () => inputNumber('4'), className: 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500', span: 1 },
    { label: '5', action: () => inputNumber('5'), className: 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500', span: 1 },
    { label: '6', action: () => inputNumber('6'), className: 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500', span: 1 },
    { label: '-', action: () => performOperation('-'), className: 'bg-pink-500 hover:bg-pink-600 text-white', span: 1 },

    { label: '1', action: () => inputNumber('1'), className: 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500', span: 1 },
    { label: '2', action: () => inputNumber('2'), className: 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500', span: 1 },
    { label: '3', action: () => inputNumber('3'), className: 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500', span: 1 },
    { label: '+', action: () => performOperation('+'), className: 'bg-pink-500 hover:bg-pink-600 text-white', span: 1 },

    { label: '0', action: () => inputNumber('0'), className: 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500', span: 2 },
    { label: ',', action: inputDecimal, className: 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500', span: 1 },
    { label: '=', action: calculate, className: 'bg-pink-500 hover:bg-pink-600 text-white', span: 1 },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
          />

          {/* Calculadora */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className={`fixed bottom-4 right-4 w-80 z-50 rounded-2xl shadow-2xl ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-4 border-b ${
              darkMode ? 'border-gray-700' : 'border-baby-200'
            }`}>
              <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Calculadora
              </h3>
              <button
                onClick={onClose}
                className={`p-1 rounded-lg ${
                  darkMode
                    ? 'hover:bg-gray-700 text-gray-300'
                    : 'hover:bg-baby-100 text-gray-600'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Display */}
            <div className={`p-4 text-right ${
              darkMode ? 'bg-gray-900' : 'bg-baby-50'
            }`}>
              <div className={`text-3xl font-mono font-bold ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {formatDisplay(display)}
              </div>
              {previousValue !== null && operation && (
                <div className={`text-sm mt-1 ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {formatDisplay(previousValue.toString().replace('.', ','))} {operation}
                </div>
              )}
            </div>

            {/* Teclado */}
            <div className="p-4">
              <div className="grid grid-cols-4 gap-3">
                {buttons.map((button) => (
                  <button
                    key={button.label}
                    onClick={button.action}
                    className={`h-14 rounded-xl font-semibold text-lg transition-all duration-200 active:scale-95 ${
                      button.className
                    } ${
                      button.span === 2 ? 'col-span-2' : ''
                    } ${
                      darkMode && !button.className.includes('bg-')
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : ''
                    }`}
                  >
                    {button.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}