-- Apply using the Supabase SQL editor or CLI as the database owner.
-- Guest records are accessible only to the trusted server service role.
create extension if not exists pgcrypto;

create table public.wedding_rsvps (
  id uuid primary key default gen_random_uuid(),
  idempotency_key uuid not null unique,
  payload_hash text not null check (payload_hash ~ '^[0-9a-f]{64}$'),
  full_name text not null check (char_length(btrim(full_name)) between 2 and 100),
  contact text not null check (char_length(btrim(contact)) between 5 and 160),
  attendance_status text not null check (attendance_status in ('accepted', 'declined')),
  accommodation_status text not null check (accommodation_status in ('yes', 'no', 'unsure', 'not_applicable')),
  budget_currency text check (budget_currency in ('USD', 'RWF')),
  budget_amount numeric check (budget_amount > 0 and budget_amount <> 'NaN'::numeric and budget_amount <> 'Infinity'::numeric),
  nights bigint check (nights > 0 and nights <= 9007199254740991),
  breakfast_preference text check (breakfast_preference in ('breakfast', 'room_only', 'no_preference')),
  accommodation_type text check (accommodation_type in ('hotel', 'apartment', 'either')),
  sharing_preference text check (sharing_preference in ('private', 'share', 'own_group')),
  room_occupants bigint check (room_occupants > 0 and room_occupants <= 9007199254740991),
  guest_message text not null default '' check (char_length(guest_message) <= 1200),
  created_at timestamptz not null default now(),
  constraint attendance_accommodation_consistency check (
    (attendance_status = 'declined' and accommodation_status = 'not_applicable') or
    (attendance_status = 'accepted' and accommodation_status <> 'not_applicable')
  ),
  constraint accommodation_details_consistency check (
    (accommodation_status = 'yes' and budget_currency is not null and budget_amount is not null
      and nights is not null and breakfast_preference is not null and accommodation_type is not null
      and sharing_preference is not null and room_occupants is not null) or
    (accommodation_status <> 'yes' and budget_currency is null and budget_amount is null
      and nights is null and breakfast_preference is null and accommodation_type is null
      and sharing_preference is null and room_occupants is null)
  )
);

create table public.rsvp_rate_limits (
  rate_key text primary key check (rate_key ~ '^[0-9a-f]{64}$'),
  window_start timestamptz not null default now(),
  attempts integer not null default 1 check (attempts > 0)
);

create table public.rsvp_notification_outbox (
  id uuid primary key default gen_random_uuid(),
  rsvp_id uuid not null unique references public.wedding_rsvps(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'sending', 'provider_accepted', 'failed')),
  attempts integer not null default 0 check (attempts between 0 and 5),
  created_at timestamptz not null default now(),
  first_attempt_at timestamptz,
  last_attempt_at timestamptz,
  provider_accepted_at timestamptz
);

alter table public.wedding_rsvps enable row level security;
alter table public.rsvp_rate_limits enable row level security;
alter table public.rsvp_notification_outbox enable row level security;
-- No anonymous/authenticated policies: the browser cannot read or write records.
revoke all on public.wedding_rsvps, public.rsvp_rate_limits, public.rsvp_notification_outbox from public, anon, authenticated;

create or replace function public.submit_wedding_rsvp(
  p_idempotency_key uuid, p_payload_hash text, p_rate_key text, p_payload jsonb
) returns jsonb
language plpgsql security definer set search_path = pg_catalog as $$
declare
  existing public.wedding_rsvps%rowtype;
  saved_id uuid;
  current_attempts integer;
begin
  -- Serializes simultaneous retries across all application instances.
  perform pg_advisory_xact_lock(hashtextextended(p_idempotency_key::text, 0));
  select * into existing from public.wedding_rsvps where idempotency_key = p_idempotency_key;
  if found then
    if existing.payload_hash <> p_payload_hash then
      return jsonb_build_object('status', 'conflict');
    end if;
    return jsonb_build_object('status', 'saved', 'id', existing.id);
  end if;

  -- An atomic fixed window is shared by every server instance; raw IPs are never stored.
  insert into public.rsvp_rate_limits as limiter (rate_key) values (p_rate_key)
  on conflict (rate_key) do update set
    attempts = case when limiter.window_start <= now() - interval '1 hour' then 1 else least(limiter.attempts + 1, 100000) end,
    window_start = case when limiter.window_start <= now() - interval '1 hour' then now() else limiter.window_start end
  returning attempts into current_attempts;
  if current_attempts > 8 then return jsonb_build_object('status', 'rate_limited'); end if;

  insert into public.wedding_rsvps (
    idempotency_key, payload_hash, full_name, contact, attendance_status, accommodation_status,
    budget_currency, budget_amount, nights, breakfast_preference, accommodation_type,
    sharing_preference, room_occupants, guest_message
  ) values (
    p_idempotency_key, p_payload_hash, p_payload->>'fullName', p_payload->>'contact',
    p_payload->>'attendanceStatus', p_payload->>'accommodationStatus',
    p_payload->>'budgetCurrency', (p_payload->>'budgetAmount')::numeric,
    (p_payload->>'nights')::bigint, p_payload->>'breakfastPreference', p_payload->>'accommodationType',
    p_payload->>'sharingPreference', (p_payload->>'roomOccupants')::bigint, coalesce(p_payload->>'guestMessage', '')
  ) returning id into saved_id;
  -- The outbox and guest record commit together before any email is attempted.
  insert into public.rsvp_notification_outbox (rsvp_id) values (saved_id);
  return jsonb_build_object('status', 'saved', 'id', saved_id);
end;
$$;

create or replace function public.claim_rsvp_notification(p_rsvp_id uuid default null)
returns table (
  id uuid, rsvp_id uuid, claim_attempt integer, full_name text, contact text, attendance_status text, accommodation_status text,
  budget_currency text, budget_amount numeric, nights bigint, breakfast_preference text,
  accommodation_type text, sharing_preference text, room_occupants bigint, guest_message text
)
language plpgsql security definer set search_path = pg_catalog as $$
declare
  claimed public.rsvp_notification_outbox%rowtype;
begin
  -- Resend deduplicates keys for 24 hours. Stop automatic retries after 23 hours
  -- from the first attempt so an ambiguous provider response cannot duplicate mail.
  select queue.* into claimed from public.rsvp_notification_outbox queue
  where (p_rsvp_id is null or queue.rsvp_id = p_rsvp_id)
    and queue.status in ('pending', 'sending') and queue.attempts < 5
    and (queue.first_attempt_at is null or queue.first_attempt_at > now() - interval '23 hours')
    and (queue.last_attempt_at is null or queue.last_attempt_at < now() - interval '5 minutes')
  order by queue.created_at for update skip locked limit 1;
  if not found then return; end if;

  update public.rsvp_notification_outbox queue set status = 'sending', attempts = queue.attempts + 1,
    first_attempt_at = coalesce(queue.first_attempt_at, now()), last_attempt_at = now()
    where queue.id = claimed.id;
  return query select claimed.id, guest.id, claimed.attempts + 1, guest.full_name, guest.contact, guest.attendance_status,
    guest.accommodation_status, guest.budget_currency, guest.budget_amount, guest.nights,
    guest.breakfast_preference, guest.accommodation_type, guest.sharing_preference, guest.room_occupants,
    guest.guest_message from public.wedding_rsvps guest where guest.id = claimed.rsvp_id;
end;
$$;

create or replace function public.finish_rsvp_notification(p_id uuid, p_attempt integer, p_accepted boolean)
returns void language plpgsql security definer set search_path = pg_catalog as $$
begin
  update public.rsvp_notification_outbox set
    status = case when p_accepted then 'provider_accepted' when attempts >= 5 then 'failed' else 'pending' end,
    provider_accepted_at = case when p_accepted then now() else null end
  where id = p_id and attempts = p_attempt and status = 'sending';
end;
$$;

revoke all on function public.submit_wedding_rsvp(uuid, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.claim_rsvp_notification(uuid) from public, anon, authenticated;
revoke all on function public.finish_rsvp_notification(uuid, integer, boolean) from public, anon, authenticated;
grant execute on function public.submit_wedding_rsvp(uuid, text, text, jsonb) to service_role;
grant execute on function public.claim_rsvp_notification(uuid) to service_role;
grant execute on function public.finish_rsvp_notification(uuid, integer, boolean) to service_role;
grant all on public.wedding_rsvps, public.rsvp_rate_limits, public.rsvp_notification_outbox to service_role;
