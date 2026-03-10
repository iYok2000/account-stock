-- Revert company_id on shops

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_shops_company'
          AND table_name = 'shops'
    ) THEN
        ALTER TABLE shops DROP CONSTRAINT fk_shops_company;
    END IF;
END $$;

DROP INDEX IF EXISTS idx_shops_company_id;
ALTER TABLE shops DROP COLUMN IF EXISTS company_id;
