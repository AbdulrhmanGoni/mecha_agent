-- migrate:up
ALTER TABLE api_keys
    ADD COLUMN secret_hash VARCHAR(255) NOT NULL,
    DROP COLUMN key;

-- migrate:down
ALTER TABLE api_keys
    DROP COLUMN secret_hash,
    ADD COLUMN key TEXT NOT NULL DEFAULT '';
