DROP INDEX IF EXISTS idx_users_shop_id;
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;
ALTER TABLE users DROP COLUMN IF EXISTS shop_id;

DROP INDEX IF EXISTS idx_shops_deleted_at;
DROP TABLE IF EXISTS shops;
