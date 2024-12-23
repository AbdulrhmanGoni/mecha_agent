import { type Client as PostgresClient } from "deno.land/x/postgres";

export class DatabaseService {
    constructor(private readonly dbClient: PostgresClient) { }

    async init() {
        await this.dbClient.queryObject`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`;
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

    get query() {
        return this.dbClient.queryObject.bind(this.dbClient)
    }

    createTransaction(name: string) {
        return this.dbClient.createTransaction(name)
    }
}