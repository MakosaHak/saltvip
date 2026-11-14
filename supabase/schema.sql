-- FacilRESA — schéma Supabase
-- À exécuter dans l'éditeur SQL du projet Supabase (SQL Editor > New query > Run).
--
-- Chaque entité de l'application est stockée dans une table au format générique :
--   id          : identifiant texte généré par l'application (R-..., A..., V...)
--   data        : l'objet complet en JSON
--   updated_at  : horodatage de la dernière écriture
-- Ce format garde le store React inchangé et simplifie la synchronisation.

create extension if not exists "pgcrypto";

do $$
declare
  t text;
begin
  foreach t in array array['accounts', 'reservations', 'vips', 'staff', 'salons', 'compagnies', 'audit']
  loop
    execute format('
      create table if not exists public.%I (
        id text primary key,
        data jsonb not null,
        updated_at timestamptz not null default now()
      )', t);

    -- Nécessaire pour que les événements DELETE du temps réel contiennent l''id.
    execute format('alter table public.%I replica identity full', t);

    -- Démo : accès ouvert avec la clé anonyme. À restreindre avant une mise en production.
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "demo_all_%s" on public.%I', t, t);
    execute format('create policy "demo_all_%s" on public.%I for all to anon, authenticated using (true) with check (true)', t, t);
  end loop;
end $$;

-- Mise à jour automatique de updated_at.
create or replace function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare
  t text;
begin
  foreach t in array array['accounts', 'reservations', 'vips', 'staff', 'salons', 'compagnies', 'audit']
  loop
    execute format('drop trigger if exists trg_updated_at on public.%I', t);
    execute format('create trigger trg_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- Activer le temps réel (Realtime) sur toutes les tables.
do $$
declare
  t text;
begin
  foreach t in array array['accounts', 'reservations', 'vips', 'staff', 'salons', 'compagnies', 'audit']
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then
      null; -- déjà présente dans la publication
    end;
  end loop;
end $$;
