-- =========================================================
-- Sistema de Controle de Aulas — Migration 0002
-- Cria automaticamente o perfil em public.users no signup
-- =========================================================

-- ---------------------------------------------------------
-- Função: lê o novo registro de auth.users e cria o perfil
-- correspondente em public.users, na mesma transação.
-- ---------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, name, email, timezone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    'UTC'  -- default; o professor ajusta depois nas configurações
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- ---------------------------------------------------------
-- Trigger: dispara após cada insert em auth.users
-- ---------------------------------------------------------
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
