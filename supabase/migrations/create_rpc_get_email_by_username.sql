create or replace function public.get_email_by_username(p_username text) returns text language sql stable security definer
set search_path = public as $$
select u.email
from auth.users as u
where lower(
    coalesce((u.raw_user_meta_data->>'username')::text, '')
  ) = lower(p_username)
  or lower(
    coalesce((u.raw_user_meta_data->>'full_name')::text, '')
  ) = lower(p_username)
limit 1;
$$;
grant execute on function public.get_email_by_username(text) to anon,
  authenticated;