-- FinanceFlow Pro - Schema Supabase
-- Este script já foi executado no projeto "controle-contas" (sa-east-1).
-- Mantido aqui como referência/versão do banco.

-- ── Perfis de usuário (login por e-mail/senha via Supabase Auth) ───────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null default '',
  celular text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

-- Cria o perfil automaticamente quando um usuário se cadastra
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nome, celular)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', ''),
    coalesce(new.raw_user_meta_data->>'celular', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

revoke execute on function public.handle_new_user() from anon, authenticated, public;

-- ── Contas a pagar ──────────────────────────────────────────────────────────
create table if not exists public.bills (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric(15,2) not null,
  due_date text not null, -- "YYYY-MM-DD"
  paid boolean default false,
  paid_at timestamptz,
  category text not null default 'outros',
  description text,
  installments int,
  current_installment int,
  recurring boolean default false,
  created_at timestamptz default now()
);

-- ── Receitas ─────────────────────────────────────────────────────────────────
create table if not exists public.incomes (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  amount numeric(15,2) not null,
  date text not null, -- "YYYY-MM-DD"
  category text not null default 'outros',
  received boolean default false,
  recurring boolean default false,
  recurring_period text,
  created_at timestamptz default now()
);

-- ── Metas de orçamento ───────────────────────────────────────────────────────
create table if not exists public.goals (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  limit_amount numeric(15,2) not null,
  period text not null default 'monthly',
  color text,
  created_at timestamptz default now()
);

-- ── Lembretes ────────────────────────────────────────────────────────────────
create table if not exists public.reminders (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  date text not null,
  time text,
  completed boolean default false,
  bill_id text references public.bills(id) on delete set null,
  created_at timestamptz default now()
);

-- ── Entradas previstas (trabalhos extras, freelas, etc) ────────────────────
create table if not exists public.future_transactions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  amount numeric(15,2) not null,
  expected_date text not null,
  received boolean default false,
  created_at timestamptz default now()
);

-- ── Saldo disponível do usuário ──────────────────────────────────────────────
create table if not exists public.user_prefs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  available_money numeric(15,2) not null default 0,
  updated_at timestamptz default now()
);

-- ── RLS: cada usuário só acessa os próprios dados ───────────────────────────
alter table public.bills enable row level security;
alter table public.incomes enable row level security;
alter table public.goals enable row level security;
alter table public.reminders enable row level security;
alter table public.future_transactions enable row level security;
alter table public.user_prefs enable row level security;

create policy "bills_own" on public.bills for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "incomes_own" on public.incomes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "goals_own" on public.goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "reminders_own" on public.reminders for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "future_transactions_own" on public.future_transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_prefs_own" on public.user_prefs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Índices ──────────────────────────────────────────────────────────────────
create index if not exists idx_bills_user on public.bills(user_id);
create index if not exists idx_bills_due_date on public.bills(due_date);
create index if not exists idx_incomes_user on public.incomes(user_id);
create index if not exists idx_goals_user on public.goals(user_id);
create index if not exists idx_reminders_user on public.reminders(user_id);
create index if not exists idx_future_transactions_user on public.future_transactions(user_id);
