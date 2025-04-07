import { QdrantClient } from "npm:@qdrant/js-client-rest";
// @deno-types="minio/dist/esm/minio.d.mts"
import { Client as MinioClient } from "minio";
import parsedEnvVariables from "./parseEnvironmentVariables.ts";
import { bootstrapEmbeddingClient } from "./bootstrapEmbeddingClient.ts";

export function datasetProcessingWorkerConfigs() {
    const embeddingClient = bootstrapEmbeddingClient();

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

    return {
        vectorDatabaseClient,
        embeddingClient,
        minioClient
    }
};
