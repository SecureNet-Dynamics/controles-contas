import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { addCustomCategory, getCustomCategories, getCustomIncomeCategories } from '../lib/categories';

interface CategoryOption {
  value: string;
  label: string;
  emoji: string;
  color: string;
}

interface CategorySelectProps {
  kind: 'bill' | 'income';
  value: string;
  onChange: (value: string) => void;
  baseCategories: readonly CategoryOption[];
}

export default function CategorySelect({ kind, value, onChange, baseCategories }: CategorySelectProps) {
  const [customCats, setCustomCats] = useState<CategoryOption[]>(
    () => kind === 'bill' ? getCustomCategories() : getCustomIncomeCategories()
  );
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState('');
  const [emoji, setEmoji] = useState('');

  const all = [...baseCategories, ...customCats];

  const handleAdd = () => {
    if (!label.trim()) return;
    const cat = addCustomCategory(label, emoji, kind);
    setCustomCats(kind === 'bill' ? getCustomCategories() : getCustomIncomeCategories());
    onChange(cat.value);
    setAdding(false);
    setLabel('');
    setEmoji('');
  };

  return (
    <div>
      <select
        className="input"
        value={value}
        onChange={e => {
          if (e.target.value === '__new__') { setAdding(true); return; }
          onChange(e.target.value);
        }}
      >
        {all.map(c => (
          <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
        ))}
        <option value="__new__">+ Nova categoria...</option>
      </select>

      {adding && (
        <div className="flex gap-2 mt-2">
          <input
            className="input w-16 text-center px-1"
            placeholder="🏷️"
            value={emoji}
            onChange={e => setEmoji(e.target.value)}
            maxLength={2}
          />
          <input
            className="input flex-1"
            placeholder="Nome da nova categoria"
            value={label}
            autoFocus
            onChange={e => setLabel(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
          />
          <button type="button" onClick={handleAdd} className="btn-primary !px-3 py-0 min-h-0 h-11 flex-shrink-0">
            <Check size={14} />
          </button>
          <button type="button" onClick={() => setAdding(false)} className="btn-ghost !px-2 flex-shrink-0">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
