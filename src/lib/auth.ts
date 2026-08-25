import { supabase, supabaseUrl } from './supabase';
import type { User } from '../types';

function mapUser(id: string, email: string, nome?: string, celular?: string): User {
  return {
    id,
    email,
    nome: nome && nome.trim() ? nome : email.split('@')[0],
    celular: celular || '',
  };
}

/**
 * Lê a sessão diretamente do localStorage, sem passar pelo `getSession()` do
 * supabase-js. Usado só para o boot inicial: chamar `getSession()` (que usa
 * um lock via `navigator.locks`) ao mesmo tempo em que o app já assina
 * `onAuthStateChange` pode travar esse lock para sempre em alguns navegadores,
 * deixando a tela de carregamento presa indefinidamente a cada recarregamento.
 * Isso é só uma prévia rápida — o perfil (nome/celular) é resolvido depois
 * pelo `onAuthChange`.
 */
export function getStoredSessionUser(): User | null {
  if (!supabaseUrl) return null;
  try {
    const ref = new URL(supabaseUrl).hostname.split('.')[0];
    const raw = localStorage.getItem(`sb-${ref}-auth-token`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.expires_at && parsed.expires_at * 1000 < Date.now()) return null;
    const u = parsed?.user;
    if (!u?.id || !u?.email) return null;
    return mapUser(u.id, u.email, u.user_metadata?.nome, u.user_metadata?.celular);
  } catch {
    return null;
  }
}

async function fetchProfile(id: string, email: string): Promise<User> {
  const { data } = await supabase!
    .from('profiles')
    .select('nome, celular')
    .eq('id', id)
    .maybeSingle();
  return mapUser(id, email, data?.nome, data?.celular);
}

function translateAuthError(message: string): string {
  if (message.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (message.includes('User already registered')) return 'Este e-mail já está cadastrado. Faça login.';
  if (message.includes('Password should be at least')) return 'Senha muito curta (mínimo 6 caracteres).';
  if (message.includes('Unable to validate email address')) return 'E-mail inválido.';
  if (message.includes('Email not confirmed')) return 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.';
  return message;
}

export interface SignUpResult {
  user: User;
  /** true quando o Supabase exige confirmação de e-mail antes de liberar o login */
  needsConfirmation: boolean;
}

export async function signUp(nome: string, email: string, celular: string, senha: string): Promise<SignUpResult> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: { data: { nome, celular } },
  });
  if (error) throw new Error(translateAuthError(error.message));
  if (!data.user) throw new Error('Não foi possível criar a conta.');
  return {
    user: mapUser(data.user.id, data.user.email ?? email, nome, celular),
    needsConfirmation: !data.session,
  };
}

export async function signIn(email: string, senha: string): Promise<User> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) throw new Error(translateAuthError(error.message));
  if (!data.user) throw new Error('Não foi possível entrar.');
  return fetchProfile(data.user.id, data.user.email ?? email);
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function updateProfile(id: string, nome: string, celular: string): Promise<void> {
  if (!supabase) return;
  await Promise.all([
    supabase.from('profiles').update({ nome, celular }).eq('id', id),
    supabase.auth.updateUser({ data: { nome, celular } }),
  ]);
}

/** Assina mudanças de sessão (login, logout, refresh de token). */
export function onAuthChange(callback: (user: User | null) => void): () => void {
  if (!supabase) return () => {};
  const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
    const u = session?.user;
    if (!u || !u.email) {
      callback(null);
      return;
    }
    callback(await fetchProfile(u.id, u.email));
  });
  return () => sub.subscription.unsubscribe();
}
