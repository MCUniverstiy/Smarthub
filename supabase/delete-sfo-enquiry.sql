-- Run this once in the Supabase SQL editor if partnership deletes fail.
-- Safe to re-run. Requires public.is_staff() from schema.sql.

create or replace function public.delete_sfo_enquiry(p_reference text)
returns table(deleted boolean, reference text)
language plpgsql volatile security definer set search_path = public as $$
begin
  if not public.is_staff() then
    raise exception 'Only staff can delete partnership applications'
      using errcode = 'insufficient_privilege';
  end if;
  delete from public.sfo_enquiries e where e.reference = p_reference;
  if found then
    return query select true, p_reference;
  else
    return query select false, p_reference;
  end if;
end $$;

revoke all on function public.delete_sfo_enquiry(text) from public;
grant execute on function public.delete_sfo_enquiry(text) to authenticated;
grant delete on public.sfo_enquiries to authenticated;
