-- migrate:up
ALTER TABLE users 
    DROP COLUMN subscription_id, 
    DROP COLUMN current_plan;

DROP TABLE IF EXISTS subscriptions;

-- migrate:down
CREATE TABLE subscriptions (
    customer_id VARCHAR(255) PRIMARY KEY NOT NULL,
    subscription_id VARCHAR(255) NOT NULL,
    user_email VARCHAR(320) REFERENCES users(email) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    status VARCHAR(8) NOT NULL DEFAULT 'active',
    plan VARCHAR(10) NOT NULL
);

ALTER TABLE users 
    ADD COLUMN subscription_id VARCHAR(255), 
    ADD COLUMN current_plan VARCHAR(10) NOT NULL DEFAULT 'Free';
