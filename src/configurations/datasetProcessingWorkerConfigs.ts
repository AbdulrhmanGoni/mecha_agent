import { Ollama as OllamaClient } from "ollama";
import { QdrantClient } from "npm:@qdrant/js-client-rest";
// @deno-types="minio/dist/esm/minio.d.mts"
import { Client as MinioClient } from "minio";
import parsedEnvVariables from "./parseEnvironmentVariables.ts";

export function datasetProcessingWorkerConfigs() {
    const ollamaClient = new OllamaClient({ host: parsedEnvVariables.OLLAMA_HOST });

    const minioClient = new MinioClient({
        endPoint: parsedEnvVariables.OBJECT_STORAGE_DB_HOST,
        port: parsedEnvVariables.OBJECT_STORAGE_DB_PORT,
        useSSL: false,
        accessKey: parsedEnvVariables.OBJECT_STORAGE_USERNAME,
        secretKey: parsedEnvVariables.OBJECT_STORAGE_PASSWORD,
    })

    const vectorDatabaseClient = new QdrantClient({
        host: parsedEnvVariables.VECTOR_DB_HOST,
        port: parsedEnvVariables.VECTOR_DB_PORT
    });

    return {
        vectorDatabaseClient,
        ollamaClient,
        minioClient
    }
};
