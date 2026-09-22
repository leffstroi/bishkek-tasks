-- Run this in Supabase SQL Editor after creating project

-- Enable UUID extension if needed
create extension if not exists "uuid-ossp";

-- Profiles table (linked to auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  full_name text,
  phone text,
  role text default 'user' check (role in ('user', 'admin')),
  telegram_username text,
  created_at timestamptz default now()
);

-- Tasks table
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  pickup_address text not null,
  pickup_lat double precision,
  pickup_lng double precision,
  delivery_address text not null,
  delivery_lat double precision,
  delivery_lng double precision,
  reward numeric(10,2) not null default 0, -- in KGS
  status text default 'open' check (status in ('open', 'claimed', 'completed', 'paid', 'cancelled')),
  claimed_by uuid references public.profiles(id),
  claimed_at timestamptz,
  completed_at timestamptz,
  photo_url text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  notes text -- admin notes
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can insert their own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Tasks policies
create policy "Anyone can view open or own tasks"
  on tasks for select using (
    status = 'open' or claimed_by = auth.uid() or 
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can insert tasks"
  on tasks for insert with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update any task"
  on tasks for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Users can claim open tasks and update their claimed tasks"
  on tasks for update using (
    (status = 'open' and claimed_by is null) or claimed_by = auth.uid()
  );

-- Function to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name)
  values (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Storage: Create bucket 'task-photos' as PUBLIC in Dashboard > Storage
-- Then add these policies in SQL:
/*
create policy "Authenticated users can upload to task-photos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'task-photos');

create policy "Anyone can view task photos"
on storage.objects for select
using (bucket_id = 'task-photos');
*/
