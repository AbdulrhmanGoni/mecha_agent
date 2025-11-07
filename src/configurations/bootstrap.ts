import { QdrantClient } from "qdrant";
import { Client as PostgresClient } from "deno.land/x/postgres";
import { UTApi } from "uploadthing/server";
import parsedEnvVariables from "./parseEnvironmentVariables.ts";
import { bootstrapEmbeddingClient } from "./bootstrapEmbeddingClient.ts";
import { bootstrapLLMClient } from "./bootstrapLLMClient.ts";
import { kvStoreClient } from "./denoKvStoreClient.ts";
import { bootstrapPaymentGatewayClient } from "./bootstrapPaymentGatewayClient.ts";

export async function bootstrapConfigurations() {
    const llmClient = await bootstrapLLMClient()
    const embeddingClient = await bootstrapEmbeddingClient()

    const utApi = new UTApi({
        token: parsedEnvVariables.OBJECT_STORAGE_ACCESS_TOKEN
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

    const stripePaymentGatewayClient = bootstrapPaymentGatewayClient();

    await databaseClient.connect();

    return {
        vectorDatabaseClient,
        databaseClient,
        llmClient,
        embeddingClient,
        utApi,
        kvStoreClient,
        stripePaymentGatewayClient,
    }
};
