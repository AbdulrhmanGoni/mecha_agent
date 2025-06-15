import { type Client as PostgresClient } from "deno.land/x/postgres";

export class DatabaseService {
    constructor(private readonly dbClient: PostgresClient) { }

    async init() {
        await this.dbClient.queryObject`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`;
        await this.createUsersTable();
        await this.datasetsTable();
        await this.createAgentsTable();
        await this.createApiKeysTable();
        await this.createChatsHistoryTable();
        await this.createAnonymousChatsHistoryTable();
        await this.createSubscriptionsTable();
    }

    private async checkTableExistance(tableName: string) {
        const result = await this.dbClient.queryObject<{ exists: boolean }>(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = $1 
            );
        `, [tableName]
        );
        return result.rows[0].exists
    }

    private async createUsersTable() {
        const tableExists = await this.checkTableExistance("users");
        if (!tableExists) {
            await this.dbClient.queryObject`
                CREATE TABLE users (
                    email VARCHAR(320) PRIMARY KEY NOT NULL,
                    username VARCHAR(80) NOT NULL,
                    password TEXT NOT NULL,
                    avatar TEXT,
                    signing_method VARCHAR(11) NOT NULL,
                    last_sign_in TIMESTAMP NOT NULL DEFAULT now(),
                    current_plan VARCHAR(10) NOT NULL DEFAULT 'Free',
                    subscription_id VARCHAR(255),
                    agents_count SMALLINT NOT NULL DEFAULT 0,
                    api_keys_count SMALLINT NOT NULL DEFAULT 0,
                    published_agents SMALLINT NOT NULL DEFAULT 0,
                    datasets_count SMALLINT NOT NULL DEFAULT 0,
                    created_at TIMESTAMP NOT NULL DEFAULT now()
                )
            `;
        }
    }

    private async datasetsTable() {
        const tableExists = await this.checkTableExistance("datasets");
        if (!tableExists) {
            await this.dbClient.queryObject`
                CREATE TABLE datasets (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
                    title VARCHAR(80) NOT NULL,
                    description VARCHAR(200) NOT NULL,
                    created_at TIMESTAMP NOT NULL DEFAULT now(),
                    updated_at TIMESTAMP NOT NULL DEFAULT now(),
                    user_email VARCHAR(320) REFERENCES users(email) ON DELETE CASCADE NOT NULL
                )
            `;
        }
    }

    private async createChatsHistoryTable() {
        const tableExists = await this.checkTableExistance("chats");
        if (!tableExists) {
            await this.dbClient.queryObject`
                CREATE TABLE chats (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
                    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
                    user_email VARCHAR(320) REFERENCES users(email) ON DELETE CASCADE NOT NULL,
                    title VARCHAR(40) NOT NULL,
                    messages JSONB NOT NULL,
                    started_at TIMESTAMP DEFAULT NOW() NOT NULL
                )
            `;
        }
    }

    private async createAgentsTable() {
        const tableExists = await this.checkTableExistance("agents");

        if (!tableExists) {
            await this.dbClient.queryObject`
                CREATE TABLE agents (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
                    user_email VARCHAR(320) REFERENCES users(email) ON DELETE CASCADE NOT NULL,
                    agent_name VARCHAR(80) NOT NULL,
                    description TEXT NOT NULL,
                    avatar VARCHAR(42),
                    dataset_id UUID REFERENCES datasets(id) ON DELETE SET NULL,
                    system_instructions TEXT,
                    dont_know_response TEXT,
                    response_syntax VARCHAR(10),
                    greeting_message VARCHAR(100),
                    is_published BOOLEAN DEFAULT false NOT NULL,
                    created_at TIMESTAMP NOT NULL DEFAULT now()
                )
            `;
        }
    }

    private async createApiKeysTable() {
        const tableExists = await this.checkTableExistance("api_keys")

        if (!tableExists) {
            await this.dbClient.queryObject`
            CREATE TABLE api_keys (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
                key TEXT NOT NULL,
                key_name VARCHAR(80) NOT NULL,
                expiration_date TIMESTAMP NOT NULL,
                permissions VARCHAR(10)[] NOT NULL,
                status VARCHAR(10) NOT NULL DEFAULT 'Active',
                created_at TIMESTAMP NOT NULL DEFAULT now(),
                user_email VARCHAR(320) REFERENCES users(email) ON DELETE CASCADE NOT NULL
            )
        `;
        }
    }

    private async createAnonymousChatsHistoryTable() {
        const tableExists = await this.checkTableExistance("anonymous_chats");
        if (!tableExists) {
            await this.dbClient.queryObject`
                CREATE TABLE anonymous_chats (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
                    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
                    user_email VARCHAR(320) REFERENCES users(email) ON DELETE CASCADE NOT NULL,
                    title VARCHAR(40) NOT NULL,
                    messages JSONB NOT NULL,
                    started_at TIMESTAMP DEFAULT NOW() NOT NULL
                )
            `
        }
    }

    private async createSubscriptionsTable() {
        const tableExists = await this.checkTableExistance("subscriptions")

        if (!tableExists) {
            await this.dbClient.queryObject`
            CREATE TABLE subscriptions (
                customer_id VARCHAR(255) PRIMARY KEY NOT NULL,
                subscription_id VARCHAR(255) NOT NULL,
                user_email VARCHAR(320) REFERENCES users(email) ON DELETE CASCADE NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT now(),
                status VARCHAR(8) NOT NULL DEFAULT 'active',
                plan VARCHAR(10) NOT NULL
            )
        `;
        }
    }

    get query() {
        return this.dbClient.queryObject.bind(this.dbClient)
    }

    createTransaction(name: string) {
        return this.dbClient.createTransaction(name)
    }
}