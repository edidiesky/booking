-- Core entities
INSERT INTO tenants (id, slug, name, owner_user_id, platform_fee_pct, status)
SELECT gen_random_uuid(), 'tenant-'||i, 'Tenant '||i, gen_random_uuid(), 10.0, 'active'
FROM generate_series(1,20) i;

INSERT INTO users (id, email, password_hash, user_type, first_name, last_name, status, tenant_id, is_email_verified)
SELECT gen_random_uuid(), 'guest'||i||'@loadtest.local', 'x', 'guest', 'Guest', i::text, 'active',
  (SELECT id FROM tenants ORDER BY random() LIMIT 1), true
FROM generate_series(1,50000) i;

INSERT INTO properties (id, tenant_id, name, description, property_type, address, status)
SELECT gen_random_uuid(), t.id, 'Property '||i, 'desc',
  (ARRAY['shortlet','hotel','guesthouse'])[1+floor(random()*3)]::property_type_enum,
  jsonb_build_object('city', (ARRAY['Lagos','Abuja','Port Harcourt'])[1+floor(random()*3)]), 'active'
FROM generate_series(1,2000) i, LATERAL (SELECT id FROM tenants ORDER BY random() LIMIT 1) t;

INSERT INTO room_types (id, property_id, tenant_id, name, base_price_ngn, max_occupancy, quantity)
SELECT gen_random_uuid(), p.id, p.tenant_id, 'Room '||i, 15000 + floor(random()*50000), 2, 5
FROM generate_series(1,4000) i, LATERAL (SELECT id, tenant_id FROM properties ORDER BY random() LIMIT 1) p;

-- Availability: 4,000 room types x 365 days = 1,460,000 rows
INSERT INTO availability_calendar (id, room_type_id, tenant_id, date, available_count, is_blocked)
SELECT gen_random_uuid(), rt.id, rt.tenant_id, d::date, 5, false
FROM room_types rt, generate_series(current_date, current_date + interval '364 days', interval '1 day') d;

-- Bookings: 300,000 rows
INSERT INTO bookings (id, booking_ref, tenant_id, property_id, room_type_id, guest_user_id, rooms_count,
  check_in, check_out, guest_count, total_amount_ngn, platform_fee_ngn, host_payout_ngn, status, created_at)
SELECT gen_random_uuid(), 'BK'||lpad(i::text,10,'0'), rt.tenant_id, rt.property_id, rt.id, u.id, 1,
  ci.d::timestamptz, (ci.d + 3)::timestamptz, 2, 45000, 4500, 40500,
  (ARRAY['pending_payment','confirmed','cancelled','checked_out'])[1+floor(random()*4)]::booking_status,
  now() - (random() * interval '180 days')
FROM generate_series(1,300000) i,
  LATERAL (SELECT id, property_id, tenant_id FROM room_types ORDER BY random() LIMIT 1) rt,
  LATERAL (SELECT id FROM users ORDER BY random() LIMIT 1) u,
  LATERAL (SELECT current_date + (floor(random()*300))::int AS d) ci;

-- Payments: ~40% conversion from bookings
INSERT INTO payments (id, booking_id, tenant_id, guest_user_id, gateway, transaction_id, amount_ngn, status, idempotency_key, created_at)
SELECT gen_random_uuid(), b.id, b.tenant_id, b.guest_user_id,
  (ARRAY['paystack','flutterwave'])[1+floor(random()*2)]::payment_gateway,
  'TXN'||lpad((row_number() over())::text,12,'0'), b.total_amount_ngn,
  (ARRAY['pending','success','failed'])[1+floor(random()*3)]::payment_status,
  'idem-'||b.id, b.created_at
FROM bookings b WHERE random() < 0.4;

-- Booking locks: 3,000 active
INSERT INTO booking_locks (id, room_type_id, session_id, check_in, check_out, rooms_held, expires_at)
SELECT gen_random_uuid(), rt.id, gen_random_uuid()::text,
  (current_date + (floor(random()*60))::int)::date, (current_date + (floor(random()*60))::int + 3)::date,
  1, now() + interval '25 minutes'
FROM generate_series(1,3000) i, LATERAL (SELECT id FROM room_types ORDER BY random() LIMIT 1) rt;

-- Idempotency keys: 100,000 rows
INSERT INTO idempotency_keys (request_hash, endpoint, user_id, status, expires_at)
SELECT 'hash-'||i, '/api/v1/payments/initialize', (SELECT id FROM users ORDER BY random() LIMIT 1),
  (ARRAY['processing','completed','failed'])[1+floor(random()*3)]::idempotency_status, now() + interval '1 hour'
FROM generate_series(1, 100000) i;

ANALYZE;