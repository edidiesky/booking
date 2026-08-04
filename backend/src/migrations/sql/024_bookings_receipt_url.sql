/* 022 booking receipts */

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS receipt_url TEXT
