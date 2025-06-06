import { Client as MinioClient } from "minio/dist/esm/minio.d.mts";
import { Readable } from "node:stream";
import crypto from "node:crypto";
import { mimeTypeToFileExtentionMap } from "../constant/supportedFileTypes.ts";

export class ObjectStorageService {
    constructor(private readonly minioClient: MinioClient) { }

    readonly buckets = {
        usersAvatars: "users-avatars",
        agentsAvatars: "agents-avatars",
        datasets: "datasets",
    }

    async init() {
        await this.createBuckets(...Object.values(this.buckets))
    }

    private async createBuckets(...bucketsNames: string[]) {
        for (let i = 0; i < bucketsNames.length; i++) {
            const bucketName = bucketsNames[i];
            const avatarBucketExists = await this.minioClient.bucketExists(bucketName);
            if (!avatarBucketExists) {
                await this.minioClient.makeBucket(bucketName);
            }
        }
    }

    async uploadFile(bucketName: string, file: File, options?: { id?: string, metaData?: Record<string, string> }) {
        const fileExtention = mimeTypeToFileExtentionMap[file.type];
        const fileId = options?.id || `${crypto.randomUUID()}.${fileExtention}`
        const metaData = { 'Content-Type': file.type, ...options?.metaData };

        await this.minioClient.putObject(
            bucketName,
            fileId,
            Readable.from(file.stream()),
            file.size,
            metaData,
        )

        return fileId;
    }

    async getFile(bucketName: string, fileId: string): Promise<ObjectReadable> {
        return await this.minioClient.getObject(
            bucketName,
            fileId,
        )
    }

    async deleteFile(bucketName: string, fileId: string) {
        return await this.minioClient.removeObject(
            bucketName,
            fileId,
        )
    }
}