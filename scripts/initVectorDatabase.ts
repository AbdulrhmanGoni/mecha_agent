import { QdrantClient } from "npm:@qdrant/js-client-rest";
import { datasetsCollection, embeddingDimensions } from "../src/constant/vectorDB.ts";
import { envSchema } from "../src/configurations/parseEnvironmentVariables.ts";
import { z } from "zod";

const EnvVariables = z.object({
    VECTOR_DB_HOST: envSchema.shape.VECTOR_DB_HOST,
    VECTOR_DB_API_KEY: envSchema.shape.VECTOR_DB_API_KEY,
    VECTOR_DB_PORT: envSchema.shape.VECTOR_DB_PORT,
})

const parsedEnvVariables = EnvVariables.parse({
    VECTOR_DB_HOST: Deno.env.get("VECTOR_DB_HOST"),
    VECTOR_DB_API_KEY: Deno.env.get("VECTOR_DB_API_KEY"),
    VECTOR_DB_PORT: Deno.env.get("VECTOR_DB_PORT"),
})

const vectorDatabaseClient = new QdrantClient({
    host: parsedEnvVariables.VECTOR_DB_HOST,
    apiKey: parsedEnvVariables.VECTOR_DB_API_KEY,
    port: parsedEnvVariables.VECTOR_DB_PORT,
});

const collectionExists = await vectorDatabaseClient.collectionExists(datasetsCollection);

if (!collectionExists.exists) {
    await vectorDatabaseClient.createCollection(datasetsCollection, {
        vectors: {
            size: embeddingDimensions.google,
            distance: "Cosine",
            on_disk: true,
        },
        on_disk_payload: true,
        hnsw_config: {
            m: 0,
            payload_m: 16,
            on_disk: true,
        }
    });

    await vectorDatabaseClient.createPayloadIndex(datasetsCollection, {
        field_name: "datasetId",
        field_schema: {
            type: "keyword",
            is_tenant: true,
        },
    })

    await vectorDatabaseClient.createPayloadIndex(datasetsCollection, {
        field_name: "userEmail",
        field_schema: {
            type: "keyword",
            is_tenant: true,
        },
    })
}
