-- migrate:up
ALTER TABLE api_keys
ALTER COLUMN expiration_date DROP NOT NULL;

-- migrate:down
ALTER TABLE api_keys
ALTER COLUMN expiration_date SET NOT NULL;
