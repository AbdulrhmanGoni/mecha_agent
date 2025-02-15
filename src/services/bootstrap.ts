import { Ollama } from "ollama";
import { QdrantClient } from "npm:@qdrant/js-client-rest";
import { Client as MinioClient } from "minio";
import { EmbeddingService } from "./EmbeddingService.ts";
import { VectorDatabaseService } from "./VectorDatabaseService.ts";
import { InstructionsService } from "./InstructionsService.ts";
import { LLMService } from "./LLMService.ts";
import { Client as PostgresClient } from "deno.land/x/postgres";
import { DatabaseService } from "./DatabaseService.ts";
import { ApiKeysService } from "./ApiKeysService.ts";
import { JwtService } from "./JwtService.ts";
import { AuthService } from "./AuthService.ts";
import { GuardService } from "./GuardService.ts";
import { AgentsService } from "./AgentsService.ts";
import { ObjectStorageService } from "./ObjectStorageService.ts";
import { ChatsService } from "./ChatsService.ts";
import { DatasetsService } from "./DatasetsService.ts";
import { SSEService } from "./SSEService.ts";
import { UsersService } from "./UsersService.ts";

type ServicesDependencies = {
    vectorDatabaseClient: QdrantClient;
    databaseClient: PostgresClient;
    ollamaClient: Ollama;
    minioClient: MinioClient;
}

export async function bootstrapServices(dependencies: ServicesDependencies) {
    const embeddingService = new EmbeddingService(dependencies.ollamaClient);

    const vectorDatabaseService = new VectorDatabaseService(dependencies.vectorDatabaseClient, embeddingService);
    await vectorDatabaseService.init();

    const databaseService = new DatabaseService(dependencies.databaseClient);
    await databaseService.init();

    const objectStorageService = new ObjectStorageService(dependencies.minioClient);
    await objectStorageService.init();

    const instructionsService = new InstructionsService(vectorDatabaseService);

    const llmService = new LLMService(dependencies.ollamaClient);

    const jwtService = new JwtService();
    await jwtService.init();

    const usersService = new UsersService(databaseService);
    const agentsService = new AgentsService(databaseService, objectStorageService);

    const chatsService = new ChatsService(databaseService, vectorDatabaseService, llmService);

    const apiKeysService = new ApiKeysService(databaseService, jwtService);

    const authService = new AuthService(usersService);

    const guardService = new GuardService(jwtService);

    const sseService = new SSEService();

    const datasetProcessingWorker = new Worker(
        import.meta.resolve("./DatasetProcessingWorker.ts"),
        { type: "module" }
    );

    const datasetsService = new DatasetsService(
        databaseService,
        objectStorageService,
        datasetProcessingWorker,
        sseService
    );

    return {
        usersService,
        instructionsService,
        agentsService,
        apiKeysService,
        chatsService,
        objectStorageService,
        authService,
        guardService,
        datasetsService,
        sseService,
    }
};
