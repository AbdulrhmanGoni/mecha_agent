-- migrate:up
ALTER TABLE agents DROP COLUMN response_syntax;

-- migrate:down
ALTER TABLE agents ADD COLUMN response_syntax VARCHAR(10);
