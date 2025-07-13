-- migrate:up
CREATE TABLE deleted_agents_avatars (
    id VARCHAR(42) NOT NULL,
    deleted_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION keep_agents_avatars_for_future_deletion()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO deleted_agents_avatars(id)
    VALUES (OLD.avatar);
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER check_agents_avatars
AFTER DELETE ON agents
FOR EACH ROW
WHEN (OLD.avatar IS NOT NULL AND OLD.avatar != '')
EXECUTE FUNCTION keep_agents_avatars_for_future_deletion();

-- migrate:down
DROP TRIGGER IF EXISTS check_agents_avatars ON agents;
DROP FUNCTION IF EXISTS keep_agents_avatars_for_future_deletion();
DROP TABLE IF EXISTS deleted_agents_avatars;
