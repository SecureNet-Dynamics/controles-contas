import { useEffect, useRef } from 'react';
import type { User, Notification } from '../types';
import type { SaveResult } from '../lib/db';

/**
 * Detecta quando um item some da lista local (foi excluído) e manda a
 * exclusão de verdade para o Supabase. Sem isso, `saveX` só faz upsert dos
 * itens que restaram — nunca apaga a linha antiga na nuvem — e o item
 * excluído reaparecia no próximo login ou em outro dispositivo.
 */
export function useCloudDeleteSync<T extends { id: string }>(
  items: T[],
  authChecked: boolean,
  user: User | null,
  deleteFn: (id: string, userId?: string) => Promise<SaveResult>,
  addNotification: (n: Omit<Notification, 'id' | 'read'>) => void,
  label: string,
) {
  const prevIds = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!authChecked || !user) {
      // Reseta a referência ao deslogar/trocar de conta para não confundir
      // "usuário anterior saiu" com "itens excluídos".
      prevIds.current = null;
      return;
    }

    const currentIds = new Set(items.map(i => i.id));
    if (prevIds.current) {
      const removed = [...prevIds.current].filter(id => !currentIds.has(id));
      removed.forEach(id => {
        deleteFn(id, user.id).then(result => {
          if (!result.ok) {
            addNotification({
              title: `Não foi possível excluir ${label} na nuvem`,
              message: result.message,
              date: new Date().toISOString(),
              type: 'system',
            });
          }
        });
      });
    }
    prevIds.current = currentIds;
  }, [items, authChecked, user, deleteFn, addNotification, label]);
}
