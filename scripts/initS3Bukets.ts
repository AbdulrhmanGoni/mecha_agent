import { Client as MinioClient } from "minio/dist/esm/minio.mjs";
import { z } from "zod";
import { s3Buckets } from "../src/constant/s3Buckets.ts";
import { envSchema } from "../src/configurations/parseEnvironmentVariables.ts";

const EnvVariables = z.object({
    OBJECT_STORAGE_DB_HOST: envSchema.shape.OBJECT_STORAGE_DB_HOST,
    OBJECT_STORAGE_DB_PORT: envSchema.shape.OBJECT_STORAGE_DB_PORT,
    OBJECT_STORAGE_USERNAME: envSchema.shape.OBJECT_STORAGE_USERNAME,
    OBJECT_STORAGE_PASSWORD: envSchema.shape.OBJECT_STORAGE_PASSWORD,
})

const parsedEnvVariables = EnvVariables.parse({
    OBJECT_STORAGE_DB_HOST: Deno.env.get("OBJECT_STORAGE_DB_HOST"),
    OBJECT_STORAGE_DB_PORT: Deno.env.get("OBJECT_STORAGE_DB_PORT"),
    OBJECT_STORAGE_USERNAME: Deno.env.get("OBJECT_STORAGE_USERNAME"),
    OBJECT_STORAGE_PASSWORD: Deno.env.get("OBJECT_STORAGE_PASSWORD"),
})

const minioClient = new MinioClient({
    endPoint: parsedEnvVariables.OBJECT_STORAGE_DB_HOST,
    port: parsedEnvVariables.OBJECT_STORAGE_DB_PORT,
    useSSL: true,
    accessKey: parsedEnvVariables.OBJECT_STORAGE_USERNAME,
    secretKey: parsedEnvVariables.OBJECT_STORAGE_PASSWORD,
})

for (const bucketName in Object.values(s3Buckets)) {
    const avatarBucketExists = await minioClient.bucketExists(bucketName);
    if (!avatarBucketExists) {
        await minioClient.makeBucket(bucketName);
    }
}

