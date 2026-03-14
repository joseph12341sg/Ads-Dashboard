-- Run this in your Supabase project:
-- Dashboard → SQL Editor → New query → paste this → Run

create table if not exists entries (
  id bigint primary key generated always as identity,
  user_id uuid references auth.users not null default auth.uid(),
  date text not null,
  amount_spent real,
  link_clicks integer,
  leads integer,
  calls integer,
  created_at timestamptz default now(),
  unique(user_id, date)
);

create table if not exists settings (
  user_id uuid references auth.users not null default auth.uid(),
  key text not null,
  value text,
  primary key (user_id, key)
);

-- Row Level Security: each user only sees their own data
alter table entries enable row level security;
alter table settings enable row level security;

create policy "entries: own data only"
  on entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "settings: own data only"
  on settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
