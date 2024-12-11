import { Ollama as OllamaClient } from "npm:ollama";
import { QdrantClient } from "npm:@qdrant/js-client-rest";
import { Client as PostgresClient } from "deno.land/x/postgres";
import parsedEnvVariables from "./parseEnvironmentVariables.ts";

export async function bootstrapConfigurations() {
    const ollamaClient = new OllamaClient({ host: parsedEnvVariables.OLLAMA_HOST });

    const vectorDatabaseClient = new QdrantClient({
        host: parsedEnvVariables.VECTOR_DB_HOST,
        port: parsedEnvVariables.VECTOR_DB_PORT
    });

    const databaseClient = new PostgresClient({
        user: parsedEnvVariables.DB_USERNAME,
        password: parsedEnvVariables.DB_PASSWORD,
        hostname: parsedEnvVariables.DB_HOST,
        port: parsedEnvVariables.DB_PORT,
        database: parsedEnvVariables.DB_NAME,
    });

    await databaseClient.connect();

    return {
        vectorDatabaseClient,
        databaseClient,
        ollamaClient
    }
};
