-- Revert user_id changes on affiliate_sku_row

DROP INDEX IF EXISTS ix_affiliate_sku_row_company_user_orderdate;
DROP INDEX IF EXISTS ux_affiliate_sku_row_company_user_order_sku;
CREATE UNIQUE INDEX IF NOT EXISTS ux_affiliate_sku_row_company_order_sku
    ON affiliate_sku_row (company_id, order_id, sku_id);

ALTER TABLE affiliate_sku_row DROP COLUMN IF EXISTS user_id;
