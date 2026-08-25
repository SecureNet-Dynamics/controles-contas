import { getCustomCategories, getCustomIncomeCategories } from './lib/categories';

export interface User {
  id: string;
  nome: string;
  email: string;
  celular: string;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  paid: boolean;
  paidAt?: string;
  category: string;
  description?: string;
  installments?: number;
  currentInstallment?: number;
  recurring?: boolean;
}

export interface Income {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  received: boolean;
  recurring: boolean;
  recurringPeriod?: 'weekly' | 'monthly' | 'yearly';
}

export interface Goal {
  id: string;
  category: string;
  limitAmount: number;
  period: 'monthly' | 'yearly';
  color?: string;
}

export interface Reminder {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  completed: boolean;
  billId?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'bill' | 'reminder' | 'system' | 'income';
  billId?: string;
}

export interface FutureTransaction {
  id: string;
  description: string;
  amount: number;
  expectedDate: string;
  received: boolean;
}

export const CATEGORIES = [
  { value: 'moradia', label: 'Moradia', color: '#4C97D6', emoji: '🏠' },
  { value: 'alimentacao', label: 'Alimentação', color: '#A78BFA', emoji: '🍔' },
  { value: 'transporte', label: 'Transporte', color: '#38BDF8', emoji: '🚗' },
  { value: 'saude', label: 'Saúde', color: '#FF8A80', emoji: '💊' },
  { value: 'educacao', label: 'Educação', color: '#F5A623', emoji: '📚' },
  { value: 'lazer', label: 'Lazer', color: '#F06292', emoji: '🎮' },
  { value: 'assinaturas', label: 'Assinaturas', color: '#EC4899', emoji: '📱' },
  { value: 'investimentos', label: 'Investimentos', color: '#7C83FD', emoji: '📈' },
  { value: 'outros', label: 'Outros', color: '#9CA3AF', emoji: '📦' },
] as const;

export const INCOME_CATEGORIES = [
  { value: 'salario', label: 'Salário', color: '#4C97D6', emoji: '💼' },
  { value: 'freelance', label: 'Freelance', color: '#38BDF8', emoji: '💻' },
  { value: 'investimento', label: 'Investimento', color: '#7C83FD', emoji: '📈' },
  { value: 'aluguel', label: 'Aluguel', color: '#F5A623', emoji: '🏘️' },
  { value: 'bonus', label: 'Bônus', color: '#F06292', emoji: '🎁' },
  { value: 'outros', label: 'Outros', color: '#9CA3AF', emoji: '💰' },
] as const;

export type CategoryValue = typeof CATEGORIES[number]['value'];

export function getCategoryInfo(value: string) {
  const builtin = CATEGORIES.find(c => c.value === value);
  if (builtin) return builtin;
  const custom = getCustomCategories().find(c => c.value === value);
  if (custom) return custom;
  return CATEGORIES[CATEGORIES.length - 1];
}

export function getIncomeCategoryInfo(value: string) {
  const builtin = INCOME_CATEGORIES.find(c => c.value === value);
  if (builtin) return builtin;
  const custom = getCustomIncomeCategories().find(c => c.value === value);
  if (custom) return custom;
  return INCOME_CATEGORIES[INCOME_CATEGORIES.length - 1];
}
