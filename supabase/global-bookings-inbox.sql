-- Let staff read and update partner-office bookings (China / Singapore / Cyprus).
-- Safe to re-run.

drop policy if exists global_bookings_staff_read on public.global_booking_requests;
create policy global_bookings_staff_read on public.global_booking_requests
  for select to authenticated
  using (
    public.is_staff()
    or public.can_manage_organization((select organization_id from public.global_listings where id = listing_id))
  );

drop policy if exists global_bookings_staff_write on public.global_booking_requests;
create policy global_bookings_staff_write on public.global_booking_requests
  for update to authenticated
  using (public.is_staff())
  with check (public.is_staff());

grant select, update on public.global_booking_requests to authenticated;
