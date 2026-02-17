import { QdrantClient } from "qdrant";
import { EmbeddingService } from "./EmbeddingService.ts";
import { VectorDatabaseService } from "./VectorDatabaseService.ts";
import { InstructionsService } from "./InstructionsService.ts";
import { LLMService } from "./LLMService.ts";
import { Client as PostgresClient } from "deno.land/x/postgres";
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
import { SubscriptionsService } from "./SubscriptionsService.ts";
import { BackgroundTasksService } from "./BackgroundTasksService.ts";
import { MailsSenderService } from "./MailsSenderService.ts";
import { StripePaymentGatewayClient } from "../configurations/stripePaymentGatewayClient.ts";
import { UTApi } from "uploadthing/server";

type ServicesDependencies = {
    vectorDatabaseClient: QdrantClient;
    databaseClient: PostgresClient;
    embeddingClient: EmbeddingClientInterface;
    llmClient: LLMClientInterface;
    utApi: UTApi;
    kvStoreClient: Deno.Kv;
    stripePaymentGatewayClient: StripePaymentGatewayClient;
}

export async function bootstrapServices(dependencies: ServicesDependencies) {
    const embeddingService = new EmbeddingService(dependencies.embeddingClient);

    const vectorDatabaseService = new VectorDatabaseService(dependencies.vectorDatabaseClient, embeddingService);

    const objectStorageService = new ObjectStorageService(dependencies.utApi);

    const instructionsService = new InstructionsService(vectorDatabaseService);

    const llmService = new LLMService(dependencies.llmClient);

    const subscriptionsService = new SubscriptionsService(
        dependencies.stripePaymentGatewayClient,
        dependencies.kvStoreClient,
    );

    const jwtService = new JwtService();
    await jwtService.init();

    const usersService = new UsersService(dependencies.databaseClient, objectStorageService, dependencies.kvStoreClient, subscriptionsService);

    const chatsService = new ChatsService(dependencies.databaseClient, vectorDatabaseService, llmService);

    const apiKeysService = new ApiKeysService(dependencies.databaseClient, jwtService);

    const mailsSenderService = new MailsSenderService();

    const authService = new AuthService(usersService, mailsSenderService, dependencies.kvStoreClient);

    const guardService = new GuardService(jwtService, dependencies.databaseClient, dependencies.kvStoreClient);

    const sseService = new SSEService();

    const agentsService = new AgentsService(dependencies.databaseClient, objectStorageService, dependencies.kvStoreClient, subscriptionsService);

    const datasetsService = new DatasetsService(
        dependencies.databaseClient,
        instructionsService,
        dependencies.kvStoreClient,
    );

    new BackgroundTasksService(
        dependencies.kvStoreClient,
        dependencies.databaseClient,
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
