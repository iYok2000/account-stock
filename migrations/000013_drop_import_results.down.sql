-- Recreate import_results table (rollback)
CREATE TABLE IF NOT EXISTS import_results (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    summary JSONB,
    daily JSONB,
    items JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_import_results_company_id_created_at ON import_results (company_id, created_at DESC);
