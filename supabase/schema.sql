-- =========================================================
-- PERSONAL FINANCE APP - SUPABASE DATABASE SCHEMA & RLS
-- Clean Schema without Seed Data (Ready to execute in Supabase SQL Editor)
-- =========================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    name text,
    avatar_url text,
    currency text default 'IDR',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. POCKETS (Kantong Dana) TABLE
create table if not exists public.pockets (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    name text not null,
    description text,
    icon text default 'Wallet' not null,
    color text default '#3B82F6' not null,
    target_amount numeric default 0 not null,
    initial_balance numeric default 0 not null,
    is_default boolean default false not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. CATEGORIES TABLE
create table if not exists public.categories (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    name text not null,
    type text not null check (type in ('income', 'expense')),
    icon text default 'Tag' not null,
    color text default '#64748B' not null,
    is_default boolean default false not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. TRANSACTIONS TABLE (Income & Expense)
create table if not exists public.transactions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    pocket_id uuid references public.pockets(id) on delete restrict not null,
    category_id uuid references public.categories(id) on delete restrict not null,
    type text not null check (type in ('income', 'expense')),
    amount numeric not null check (amount > 0),
    title text not null,
    description text,
    transaction_date date default current_date not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. TRANSFERS TABLE (Saving / Transfer between pockets)
create table if not exists public.transfers (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    from_pocket_id uuid references public.pockets(id) on delete restrict not null,
    to_pocket_id uuid references public.pockets(id) on delete restrict not null,
    amount numeric not null check (amount > 0),
    title text not null default 'Transfer Dana',
    description text,
    transfer_date date default current_date not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint check_diff_pockets check (from_pocket_id != to_pocket_id)
);

-- =========================================================
-- INDEXES FOR PERFORMANCE
-- =========================================================
create index if not exists idx_pockets_user on public.pockets(user_id);
create index if not exists idx_categories_user on public.categories(user_id);
create index if not exists idx_transactions_user on public.transactions(user_id);
create index if not exists idx_transactions_pocket on public.transactions(pocket_id);
create index if not exists idx_transactions_category on public.transactions(category_id);
create index if not exists idx_transactions_date on public.transactions(transaction_date desc);
create index if not exists idx_transfers_user on public.transfers(user_id);
create index if not exists idx_transfers_from_pocket on public.transfers(from_pocket_id);
create index if not exists idx_transfers_to_pocket on public.transfers(to_pocket_id);
create index if not exists idx_transfers_date on public.transfers(transfer_date desc);

-- =========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.pockets enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.transfers enable row level security;

-- Profiles Policies
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
    on public.profiles for select
    using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
    on public.profiles for update
    using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
    on public.profiles for insert
    with check (auth.uid() = id);

-- Pockets Policies
drop policy if exists "Users can view own pockets" on public.pockets;
create policy "Users can view own pockets"
    on public.pockets for select
    using (auth.uid() = user_id);

drop policy if exists "Users can insert own pockets" on public.pockets;
create policy "Users can insert own pockets"
    on public.pockets for insert
    with check (auth.uid() = user_id);

drop policy if exists "Users can update own pockets" on public.pockets;
create policy "Users can update own pockets"
    on public.pockets for update
    using (auth.uid() = user_id);

drop policy if exists "Users can delete own pockets" on public.pockets;
create policy "Users can delete own pockets"
    on public.pockets for delete
    using (auth.uid() = user_id);

-- Categories Policies
drop policy if exists "Users can view own categories" on public.categories;
create policy "Users can view own categories"
    on public.categories for select
    using (auth.uid() = user_id);

drop policy if exists "Users can insert own categories" on public.categories;
create policy "Users can insert own categories"
    on public.categories for insert
    with check (auth.uid() = user_id);

drop policy if exists "Users can update own categories" on public.categories;
create policy "Users can update own categories"
    on public.categories for update
    using (auth.uid() = user_id);

drop policy if exists "Users can delete own categories" on public.categories;
create policy "Users can delete own categories"
    on public.categories for delete
    using (auth.uid() = user_id);

-- Transactions Policies
drop policy if exists "Users can view own transactions" on public.transactions;
create policy "Users can view own transactions"
    on public.transactions for select
    using (auth.uid() = user_id);

drop policy if exists "Users can insert own transactions" on public.transactions;
create policy "Users can insert own transactions"
    on public.transactions for insert
    with check (auth.uid() = user_id);

drop policy if exists "Users can update own transactions" on public.transactions;
create policy "Users can update own transactions"
    on public.transactions for update
    using (auth.uid() = user_id);

drop policy if exists "Users can delete own transactions" on public.transactions;
create policy "Users can delete own transactions"
    on public.transactions for delete
    using (auth.uid() = user_id);

-- Transfers Policies
drop policy if exists "Users can view own transfers" on public.transfers;
create policy "Users can view own transfers"
    on public.transfers for select
    using (auth.uid() = user_id);

drop policy if exists "Users can insert own transfers" on public.transfers;
create policy "Users can insert own transfers"
    on public.transfers for insert
    with check (auth.uid() = user_id);

drop policy if exists "Users can update own transfers" on public.transfers;
create policy "Users can update own transfers"
    on public.transfers for update
    using (auth.uid() = user_id);

drop policy if exists "Users can delete own transfers" on public.transfers;
create policy "Users can delete own transfers"
    on public.transfers for delete
    using (auth.uid() = user_id);

-- =========================================================
-- AUTOMATIC PROFILE CREATION ON USER SIGNUP (No Seed Data)
-- =========================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', null)
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger execution
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
