import { QdrantClient } from "npm:@qdrant/js-client-rest";
import { Client as PostgresClient } from "deno.land/x/postgres";
import { Client as MinioClient } from "minio/dist/esm/minio.mjs";
import parsedEnvVariables from "./parseEnvironmentVariables.ts";
import { bootstrapEmbeddingClient } from "./bootstrapEmbeddingClient.ts";
import { bootstrapLLMClient } from "./bootstrapLLMClient.ts";
import { kvStoreClient } from "./denoKvStoreClient.ts";
import { bootstrapPaymentGatewayClient } from "./bootstrapPaymentGatewayClient.ts";

export async function bootstrapConfigurations() {
    const llmClient = await bootstrapLLMClient()
    const embeddingClient = await bootstrapEmbeddingClient()

    const minioClient = new MinioClient({
        endPoint: parsedEnvVariables.OBJECT_STORAGE_DB_HOST,
        port: parsedEnvVariables.OBJECT_STORAGE_DB_PORT,
        useSSL: parsedEnvVariables.OBJECT_STORAGE_SSL === "true",
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

    const paymentGatewayClientInterface = await bootstrapPaymentGatewayClient();

    await databaseClient.connect();

    return {
        vectorDatabaseClient,
        databaseClient,
        llmClient,
        embeddingClient,
        minioClient,
        kvStoreClient,
        paymentGatewayClientInterface,
    }
};
