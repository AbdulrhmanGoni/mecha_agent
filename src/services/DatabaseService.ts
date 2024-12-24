import { type Client as PostgresClient } from "deno.land/x/postgres";

export class DatabaseService {
    constructor(private readonly dbClient: PostgresClient) { }

    async init() {
        await this.dbClient.queryObject`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`;
        await this.createAgentsTable();
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