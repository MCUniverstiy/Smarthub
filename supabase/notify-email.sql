-- =====================================================================
-- SMARTHUB — OPTIONAL EMAIL ALERTS FOR NEW ENQUIRIES AND BOOKINGS
-- =====================================================================
-- READ THIS FIRST — YOU PROBABLY DO NOT NEED TO RUN THIS YET.
--
--   Enquiries and bookings are already saved safely without it. This
--   script only adds a "ping the office by email" step so nobody has to
--   remember to open #/admin.
--
--   Bookings already have a second alert: the booking page still posts
--   to the Google Form, so the office keeps getting that email. It is
--   the CONTACT FORM that has no alert once Formspree is switched off.
--
-- WHAT IT COSTS
--   Resend's free tier is 3,000 emails/month (100/day) — far more than a
--   contact form will ever use, and no card required. Any provider with
--   an HTTP API works; only the URL and the JSON body change.
--
-- WHAT YOU NEED BEFORE RUNNING
--   1. A Resend account → https://resend.com
--   2. An API key (starts `re_`)
--   3. A verified sender domain, OR use `onboarding@resend.dev` to test.
--      Unverified domains will silently fail to deliver.
--
-- HOW IT WORKS
--   pg_net fires the HTTP request asynchronously — the enquiry is saved
--   whether or not the email provider is up, slow, or misconfigured. The
--   visitor never waits for it and never sees it fail.
-- =====================================================================


-- =====================================================================
-- STEP 1 — ENABLE pg_net
-- =====================================================================
create extension if not exists pg_net with schema extensions;


-- =====================================================================
-- STEP 2 — STORE THE API KEY IN THE VAULT, NOT IN THIS FILE
-- =====================================================================
-- Supabase Vault encrypts it. Putting the key straight into the function
-- body would leave it readable by anyone who can inspect the schema, and
-- committed to git the moment you save this file.
--
-- Replace both values, run these two statements, then never again.
--
--   RESEND_API_KEY  — your key, e.g. re_123abc...
--   SMARTHUB_ALERT_TO — where alerts should land, e.g. info@smarthubc.com

-- select vault.create_secret('re_PASTE_YOUR_KEY_HERE', 'resend_api_key');
-- select vault.create_secret('info@smarthubc.com',     'alert_to');

-- To change one later (create_secret errors if the name already exists):
-- select vault.update_secret(
--   (select id from vault.secrets where name = 'resend_api_key'),
--   're_YOUR_NEW_KEY'
-- );


-- =====================================================================
-- STEP 3 — THE NOTIFIER
-- =====================================================================
create or replace function public.notify_new_enquiry()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  api_key  text;
  send_to  text;
begin
  -- Pull the secrets. If they are missing the function does nothing and
  -- the enquiry still saves — an unconfigured alert must never cost you
  -- the message itself.
  select decrypted_secret into api_key
    from vault.decrypted_secrets where name = 'resend_api_key';
  select decrypted_secret into send_to
    from vault.decrypted_secrets where name = 'alert_to';

  if api_key is null or send_to is null then
    return new;
  end if;

  -- net.http_post (pg_net) is ASYNCHRONOUS: it queues the request and
  -- returns immediately. Do not swap in extensions.http_post — that is the
  -- synchronous pg_http client and it would make the visitor's form submit
  -- wait on Resend's servers.
  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || api_key
    ),
    body := jsonb_build_object(
      -- Change this to your verified domain once you have one. Until
      -- then onboarding@resend.dev works but only delivers to the
      -- address that owns the Resend account.
      'from',     'SmartHub Website <onboarding@resend.dev>',
      'to',       jsonb_build_array(send_to),
      -- Reply goes straight back to the person who wrote in, so the team
      -- can answer from their mail client without copying the address.
      'reply_to', new.email,
      'subject',  'New enquiry from ' || new.full_name
                  || coalesce(' — ' || new.service, ''),
      'html',
        '<h2>New website enquiry</h2>'
        || '<p><strong>Name:</strong> '  || new.full_name || '</p>'
        || '<p><strong>Email:</strong> ' || new.email || '</p>'
        || coalesce('<p><strong>Phone:</strong> ' || new.phone || '</p>', '')
        || coalesce('<p><strong>Company:</strong> ' || new.company || '</p>', '')
        || coalesce('<p><strong>Enquiring about:</strong> ' || new.service || '</p>', '')
        || coalesce('<p><strong>Language:</strong> ' || new.lang || '</p>', '')
        || '<hr><p style="white-space:pre-wrap">'
        || new.message
        || '</p><hr>'
        || '<p style="color:#64748b;font-size:13px">Reference '
        || new.reference
        || ' — reply to this email to answer them directly, then mark it '
        || 'replied in the staff inbox.</p>'
    )
  );

  return new;
exception
  -- Belt and braces: a malformed payload or a Vault hiccup must not roll
  -- back the insert. Losing the alert is annoying; losing the enquiry is
  -- not acceptable.
  when others then
    return new;
end;
$$;

drop trigger if exists notify_new_enquiry_trg on public.enquiries;
create trigger notify_new_enquiry_trg
  after insert on public.enquiries
  for each row execute function public.notify_new_enquiry();


-- =====================================================================
-- STEP 4 — CHECKING IT WORKED
-- =====================================================================
-- Insert a test enquiry from the SQL editor:
--
--   select * from public.submit_enquiry(
--     'Test Person', 'you@yourdomain.com', null, null,
--     'company-formation', 'Testing the email alert.');
--
-- Then look at what pg_net actually sent. Responses take a second or two
-- to appear, so re-run this if it is empty at first:
--
--   select id, status_code, content
--   from net._http_response
--   order by created desc
--   limit 5;
--
-- status_code 200 = delivered to Resend.
-- 401 = wrong API key. 403 = sender domain not verified.
-- Nothing at all = the Vault secrets are missing, so the function
-- returned early. Re-check step 2.
--
-- TURNING IT OFF
--   drop trigger if exists notify_new_enquiry_trg on public.enquiries;
-- =====================================================================
