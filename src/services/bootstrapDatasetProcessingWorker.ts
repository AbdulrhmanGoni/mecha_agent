import { Ollama } from "ollama";
import { QdrantClient } from "npm:@qdrant/js-client-rest";
import { Client as MinioClient } from "minio";
import { EmbeddingService } from "./EmbeddingService.ts";
import { VectorDatabaseService } from "./VectorDatabaseService.ts";
import { ObjectStorageService } from "./ObjectStorageService.ts";
import { DatasetProcessorService } from "./DatasetProcessorService.ts";

type ServicesDependencies = {
    vectorDatabaseClient: QdrantClient;
    ollamaClient: Ollama;
    minioClient: MinioClient;
}

export function bootstrapDatasetProcessingWorker(dependencies: ServicesDependencies) {
    const embeddingService = new EmbeddingService(dependencies.ollamaClient);

    const vectorDatabaseService = new VectorDatabaseService(dependencies.vectorDatabaseClient, embeddingService);

    const objectStorageService = new ObjectStorageService(dependencies.minioClient);

    return new DatasetProcessorService(objectStorageService, vectorDatabaseService);
};
