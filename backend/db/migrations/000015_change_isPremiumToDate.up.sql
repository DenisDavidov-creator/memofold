
ALTER TABLE users DROP COLUMN is_premium;

ALTER TABLE users ADD COLUMN premium_expires_at TIMESTAMPTZ;