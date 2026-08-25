
// Converte uma data "YYYY-MM-DD" em Date local (evita o bug de fuso horário
// de `new Date("YYYY-MM-DD")`, que é interpretado como UTC e "volta um dia"
// em fusos negativos como o do Brasil)
export const parseLocalDate = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y || 1970, (m || 1) - 1, d || 1);
};

// Formata uma data "YYYY-MM-DD" no padrão brasileiro sem o bug de fuso horário
export const formatDateBR = (dateStr: string): string => {
  return parseLocalDate(dateStr).toLocaleDateString('pt-BR');
};

// Meia-noite local de hoje, para comparações de vencimento sem hora/minuto
export const startOfToday = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

// Formata números no padrão brasileiro: 1.269,60
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// Formata números sem o símbolo R$: 1.269,60
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// Converte string formatada para número: "1.269,60" → 1269.60
export const parseFormattedNumber = (formattedValue: string): number => {
  if (!formattedValue || formattedValue === '') return 0;
  
  const cleanValue = formattedValue
    .replace(/\./g, '')
    .replace(',', '.');
  
  const numberValue = parseFloat(cleanValue);
  return isNaN(numberValue) ? 0 : numberValue;
};

// Formatação para input de valores monetários
export const formatInputCurrency = (value: string): string => {
  if (!value) return '';

  // Remove tudo exceto dígitos e vírgula
  const cleanValue = value.replace(/[^\d,]/g, '');

  if (cleanValue === '') return '';

  const hasComma = cleanValue.includes(',');
  const parts = cleanValue.split(',');
  let integerPart = parts[0].replace(/\D/g, '');
  // Limita decimais a 2 dígitos
  const decimalPart = parts[1] !== undefined ? parts[1].replace(/\D/g, '').slice(0, 2) : '';

  // Remove zeros à esquerda
  integerPart = integerPart.replace(/^0+/, '') || '0';

  // Formata parte inteira com separador de milhar
  const formattedInteger = parseInt(integerPart).toLocaleString('pt-BR');

  // Preserva a vírgula mesmo quando o usuário ainda não digitou decimais
  return hasComma ? `${formattedInteger},${decimalPart}` : formattedInteger;
};