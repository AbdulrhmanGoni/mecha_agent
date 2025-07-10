import { type Client as PostgresClient } from "deno.land/x/postgres";

export class DatabaseService {
    constructor(private readonly dbClient: PostgresClient) { }

    get query() {
        return this.dbClient.queryObject.bind(this.dbClient)
    }

    createTransaction(name: string) {
        return this.dbClient.createTransaction(name)
    }
}