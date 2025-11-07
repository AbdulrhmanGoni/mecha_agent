import { UsersController } from "./UsersController.ts";
import { UsersService } from "../services/UsersService.ts";
import { AgentsController } from "./AgentsController.ts";
import { ApiKeysController } from "./ApiKeysController.ts";
import { AuthController } from "./AuthController.ts";
import { ChatsController } from "./ChatsController.ts"
import { InstructionsController } from "./InstructionsController.ts";
import { DatasetsController } from "./DatasetsController.ts";
import { SSEController } from "./SSEController.ts";
import { AgentsService } from "../services/AgentsService.ts";
import { ApiKeysService } from "../services/ApiKeysService.ts";
import { AuthService } from "../services/AuthService.ts";
import { ChatsService } from "../services/ChatsService.ts";
import { InstructionsService } from "../services/InstructionsService.ts";
import { ObjectStorageService } from "../services/ObjectStorageService.ts";
import { SSEService } from "../services/SSEService.ts";
import { DatasetsService } from "../services/DatasetsService.ts";
import { MetricsController } from "./MetricsController.ts";
import { SubscriptionsController } from "./SubscriptionsController.ts";
import { SubscriptionsService } from "../services/SubscriptionsService.ts";

type controllersDependencies = {
    services: {
        usersService: UsersService;
        instructionsService: InstructionsService;
        agentsService: AgentsService;
        datasetsService: DatasetsService;
        authService: AuthService;
        apiKeysService: ApiKeysService;
        chatsService: ChatsService;
        objectStorageService: ObjectStorageService;
        sseService: SSEService;
        subscriptionsService: SubscriptionsService;
    };
    configs: { kvStoreClient: Deno.Kv; };
}

export default function bootstrapControllers(dependencies: controllersDependencies) {
    const usersController = new UsersController(
        dependencies.services.usersService
    );

    const instructionsController = new InstructionsController(
        dependencies.services.instructionsService
    );

    const agentsController = new AgentsController(
        dependencies.services.agentsService
    );

    const datasetsController = new DatasetsController(
        dependencies.services.datasetsService
    );

    const chatsController = new ChatsController(
        dependencies.services.chatsService
    );

    const apiKeysController = new ApiKeysController(
        dependencies.services.apiKeysService
    );

    const authController = new AuthController(
        dependencies.services.authService
    );

    const sseController = new SSEController(
        dependencies.services.sseService
    );

    const metricsController = new MetricsController(dependencies.configs.kvStoreClient)

    const subscriptionsController = new SubscriptionsController(
        dependencies.services.subscriptionsService,
    );

    return {
        usersController,
        chatsController,
        instructionsController,
        agentsController,
        datasetsController,
        apiKeysController,
        authController,
        sseController,
        metricsController,
        subscriptionsController,
    }
};

