import { type Client as PostgresClient } from "deno.land/x/postgres";

export class DatabaseService {
    constructor(private readonly dbClient: PostgresClient) { }

    async init() {
        await this.dbClient.queryObject`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`;
        await this.createAgentsTable();
        await this.createApiKeysTable();
        await this.chatsHistoryTable();
        await this.datasetsTable();
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

    private async datasetsTable() {
        const tableExists = await this.checkTableExistance("datasets");
        if (!tableExists) {
            await this.dbClient.queryObject`
                CREATE TABLE datasets (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
                    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE NOT NULL,
                    title VARCHAR(80) NOT NULL,
                    description VARCHAR(200) NOT NULL,
                    status VARCHAR(11) NOT NULL,
                    created_at TIMESTAMP NOT NULL DEFAULT now()
                )
            `;
        }
    }

    private async chatsHistoryTable() {
        const tableExists = await this.checkTableExistance("chats_history");
        if (!tableExists) {
            await this.dbClient.queryObject`
                CREATE TABLE chats_history (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
                    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
                    username VARCHAR(50) NOT NULL,
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
                    agent_name VARCHAR(80) NOT NULL,
                    description TEXT NOT NULL,
                    avatar VARCHAR(42),
                    system_instructions TEXT,
                    dataset_id VARCHAR(50),
                    dont_know_response TEXT,
                    response_syntax VARCHAR(10),
                    greeting_message VARCHAR(100),
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
                created_at TIMESTAMP NOT NULL DEFAULT now()
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