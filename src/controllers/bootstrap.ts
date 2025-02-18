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
    usersService: UsersService;
    instructionsService: InstructionsService;
    agentsService: AgentsService;
    datasetsService: DatasetsService;
    authService: AuthService;
    apiKeysService: ApiKeysService;
    chatsService: ChatsService;
    objectStorageService: ObjectStorageService;
    sseService: SSEService;
}

export default function bootstrapControllers(dependencies: controllersDependencies) {
    const usersController = new UsersController(
        dependencies.usersService
    );

    const instructionsController = new InstructionsController(
        dependencies.instructionsService
    );

    const agentsController = new AgentsController(
        dependencies.agentsService
    );

    const datasetsController = new DatasetsController(
        dependencies.datasetsService
    );

    const chatsController = new ChatsController(
        dependencies.chatsService
    );

    const mediaController = new MediaController(
        dependencies.objectStorageService
    );

    const apiKeysController = new ApiKeysController(
        dependencies.apiKeysService
    );

    const authController = new AuthController(
        dependencies.authService
    );

    const sseController = new SSEController(
        dependencies.sseService
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

