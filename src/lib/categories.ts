export interface CustomCategory {
  value: string;
  label: string;
  emoji: string;
  color: string;
}

const KEY_BILL = 'customCategories';
const KEY_INCOME = 'customIncomeCategories';

// Paleta pastel sem verde, seguindo a mesma linha das categorias padrão
const PALETTE = ['#5EA6E8', '#A78BFA', '#38BDF8', '#FF8A80', '#F5A623', '#F06292', '#EC4899', '#7C83FD', '#F472B6', '#FB923C'];

const DIACRITICS_REGEX = /[̀-ͯ]/g;

function lsGet(key: string): CustomCategory[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function lsSet(key: string, value: CustomCategory[]) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* quota exceeded */ }
}

export function getCustomCategories(): CustomCategory[] {
  return lsGet(KEY_BILL);
}

export function getCustomIncomeCategories(): CustomCategory[] {
  return lsGet(KEY_INCOME);
}

export function addCustomCategory(label: string, emoji: string, kind: 'bill' | 'income'): CustomCategory {
  const key = kind === 'bill' ? KEY_BILL : KEY_INCOME;
  const list = lsGet(key);
  const slug = label.trim().toLowerCase()
    .normalize('NFD').replace(DIACRITICS_REGEX, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  const value = slug || `categoria-${Date.now()}`;
  const color = PALETTE[list.length % PALETTE.length];
  const category: CustomCategory = { value, label: label.trim(), emoji: emoji.trim() || '📦', color };
  lsSet(key, [...list, category]);
  return category;
}
