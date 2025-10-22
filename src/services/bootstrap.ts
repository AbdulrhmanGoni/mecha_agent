import { QdrantClient } from "qdrant";
import { Client as MinioClient } from "minio/dist/esm/minio.d.mts";
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
import { kvStoreClient } from "../configurations/denoKvStoreClient.ts";
import { SubscriptionsService } from "./SubscriptionsService.ts";
import { BackgroundTasksService } from "./BackgroundTasksService.ts";
import { MailsSenderService } from "./MailsSenderService.ts";
import { StripePaymentGatewayClient } from "../configurations/stripePaymentGatewayClient.ts";

type ServicesDependencies = {
    vectorDatabaseClient: QdrantClient;
    databaseClient: PostgresClient;
    embeddingClient: EmbeddingClientInterface;
    llmClient: LLMClientInterface;
    minioClient: MinioClient;
    kvStoreClient: Deno.Kv;
    stripePaymentGatewayClient: StripePaymentGatewayClient;
}

export async function bootstrapServices(dependencies: ServicesDependencies) {
    const embeddingService = new EmbeddingService(dependencies.embeddingClient);

    const vectorDatabaseService = new VectorDatabaseService(dependencies.vectorDatabaseClient, embeddingService);

    const databaseService = new DatabaseService(dependencies.databaseClient);

    const objectStorageService = new ObjectStorageService(dependencies.minioClient);

    const instructionsService = new InstructionsService(vectorDatabaseService);

    const llmService = new LLMService(dependencies.llmClient);

    const subscriptionsService = new SubscriptionsService(
        dependencies.stripePaymentGatewayClient,
        dependencies.kvStoreClient,
    );

    const jwtService = new JwtService();
    await jwtService.init();

    const usersService = new UsersService(databaseService, objectStorageService, kvStoreClient);

    const chatsService = new ChatsService(databaseService, vectorDatabaseService, llmService);

    const apiKeysService = new ApiKeysService(databaseService, jwtService);

    const mailsSenderService = new MailsSenderService();

    const authService = new AuthService(usersService, mailsSenderService, dependencies.kvStoreClient);

    const guardService = new GuardService(jwtService, databaseService);

    const sseService = new SSEService();

    const agentsService = new AgentsService(databaseService, objectStorageService, dependencies.kvStoreClient);

    const datasetsService = new DatasetsService(
        databaseService,
        instructionsService,
        dependencies.kvStoreClient,
    );

    new BackgroundTasksService(
        dependencies.kvStoreClient,
        databaseService,
        instructionsService,
        objectStorageService,
    )

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
        subscriptionsService,
        mailsSenderService,
    }
};
