DROP INDEX IF EXISTS ix_affiliate_sku_row_company_orderdate;
DROP INDEX IF EXISTS ux_affiliate_sku_row_company_order_sku;
CREATE UNIQUE INDEX IF NOT EXISTS ux_affiliate_sku_row_shop_date_sku
    ON affiliate_sku_row (affiliate_shop, date, sku_id);

ALTER TABLE affiliate_sku_row
    DROP COLUMN IF EXISTS settlement_date,
    DROP COLUMN IF EXISTS order_date,
    DROP COLUMN IF EXISTS content_type,
    DROP COLUMN IF EXISTS commission_rate,
    DROP COLUMN IF EXISTS commission_base,
    DROP COLUMN IF EXISTS shop_ads_commission,
    DROP COLUMN IF EXISTS standard_commission,
    DROP COLUMN IF EXISTS commission_amount,
    DROP COLUMN IF EXISTS settlement_status,
    DROP COLUMN IF EXISTS order_id,
    DROP COLUMN IF EXISTS company_id;
