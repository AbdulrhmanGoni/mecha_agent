import { QdrantClient } from "npm:@qdrant/js-client-rest";
import { Client as PostgresClient } from "deno.land/x/postgres";
// @deno-types="minio/dist/esm/minio.d.mts"
import { Client as MinioClient } from "minio";
import parsedEnvVariables from "./parseEnvironmentVariables.ts";
import { bootstrapEmbeddingClient } from "./bootstrapEmbeddingClient.ts";
import { bootstrapLLMClient } from "./bootstrapLLMClient.ts";

export async function bootstrapConfigurations() {
    const llmClient = bootstrapLLMClient()
    const embeddingClient = bootstrapEmbeddingClient()

    const minioClient = new MinioClient({
        endPoint: parsedEnvVariables.OBJECT_STORAGE_DB_HOST,
        port: parsedEnvVariables.OBJECT_STORAGE_DB_PORT,
        useSSL: false,
        accessKey: parsedEnvVariables.OBJECT_STORAGE_USERNAME,
        secretKey: parsedEnvVariables.OBJECT_STORAGE_PASSWORD,
    })

    const vectorDatabaseClient = new QdrantClient({
        host: parsedEnvVariables.VECTOR_DB_HOST,
        apiKey: parsedEnvVariables.VECTOR_DB_API_KEY,
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
        llmClient,
        embeddingClient,
        minioClient
    }
};
