import { Client as MinioClient } from "minio";

export class ObjectStorageService {
    constructor(private readonly minioClient: MinioClient) { }

    readonly buckets = {
        agentsAvatars: "agents-avatars"
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

}