import { UsersController } from "./UsersController.ts";
import { UsersService } from "../services/UsersService.ts";
import { AgentsController } from "./AgentsController.ts";
import { ApiKeysController } from "./ApiKeysController.ts";
import { AuthController } from "./AuthController.ts";
import { ChatsController } from "./ChatsController.ts"
import { InstructionsController } from "./InstructionsController.ts";
import { MediaController } from "./MediaController.ts";
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
    };
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

    const mediaController = new MediaController(
        dependencies.services.objectStorageService
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

    return {
        usersController,
        chatsController,
        instructionsController,
        agentsController,
        datasetsController,
        mediaController,
        apiKeysController,
        authController,
        sseController,
    }
};

