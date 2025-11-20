-- migrate:up
ALTER TABLE anonymous_chats
    ADD COLUMN last_interaction TIMESTAMP NOT NULL DEFAULT NOW();

-- migrate:down
ALTER TABLE anonymous_chats
    DROP COLUMN last_interaction;
