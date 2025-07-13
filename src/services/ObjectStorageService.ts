import { Client as MinioClient } from "minio/dist/esm/minio.d.mts";
import { Readable } from "node:stream";
import crypto from "node:crypto";
import { mimeTypeToFileExtentionMap } from "../constant/supportedFileTypes.ts";
import { s3Buckets } from "../constant/s3Buckets.ts";

export class ObjectStorageService {
    constructor(private readonly minioClient: MinioClient) { }

    readonly buckets = s3Buckets

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

    async deleteFiles(bucketName: string, filesIds: string[]) {
        return await this.minioClient.removeObjects(
            bucketName,
            filesIds,
        )
    }
}