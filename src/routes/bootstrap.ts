import { Hono } from "hono";
import chatsRoutesBuilder from "./chatsRoutes.ts";
import instructionsRoutesBuilder from "./instructionsRoutes.ts";
import { InstructionsController } from "../controllers/InstructionsController.ts";
import { ChatsController } from "../controllers/ChatsController.ts";
import { ApiKeysController } from "../controllers/ApiKeysController.ts";
import apiKeysRoutesBuilder from "./apiKeysRoutes.ts";
import { AuthController } from "../controllers/AuthController.ts";
import authRoutesBuilder from "./authRoutes.ts";
import agentsRoutesBuilder from "./agentsRoutes.ts";
import datasetsRoutesBuilder from "./datasetsRoutes.ts";
import { AgentsController } from "../controllers/AgentsController.ts";
import mediaRoutesBuilder from "./mediaRoutes.ts";
import { MediaController } from "../controllers/MediaController.ts";
import { DatasetsController } from "../controllers/DatasetsController.ts";
import { GuardService } from "../services/GuardService.ts";
import sseRoutesBuilder from "./sseRoutes.ts";
import { SSEController } from "../controllers/SSEController.ts";
import { UsersController } from "../controllers/UsersController.ts";
import usersRoutesBuilder from "./usersRoutes.ts";

type RoutesDependencies = {
    usersController: UsersController;
    agentsController: AgentsController;
    datasetsController: DatasetsController;
    instructionsController: InstructionsController;
    apiKeysController: ApiKeysController;
    chatsController: ChatsController;
    authController: AuthController;
    mediaController: MediaController;
    sseController: SSEController;
    guardService: GuardService;
}

export default function bootstrapRoutes(dependencies: RoutesDependencies) {
    const usersRoutes = usersRoutesBuilder(
        dependencies.usersController,
    );

    const authRoutes = authRoutesBuilder(
        dependencies.authController,
    );

    const agentsRoutes = agentsRoutesBuilder(
        dependencies.agentsController,
        dependencies.guardService
    );

    const instructionsRoutes = instructionsRoutesBuilder(
        dependencies.instructionsController,
        dependencies.guardService
    );

    const apiKeysRoutes = apiKeysRoutesBuilder(
        dependencies.apiKeysController,
        dependencies.guardService
    );

    const mediaRoutes = mediaRoutesBuilder(
        dependencies.mediaController,
        dependencies.guardService
    );

    const chatsRoutes = chatsRoutesBuilder(
        dependencies.chatsController,
        dependencies.guardService
    );

    const datasetsRoutes = datasetsRoutesBuilder(
        dependencies.datasetsController,
        dependencies.guardService
    );

    const sseRoutes = sseRoutesBuilder(
        dependencies.sseController,
    );

    const api = new Hono();

    api.route('/auth', authRoutes);
    api.route('/users', usersRoutes);
    api.route('/agents', agentsRoutes);
    api.route('/instructions', instructionsRoutes);
    api.route('/api-keys', apiKeysRoutes);
    api.route('/media', mediaRoutes);
    api.route('/chats', chatsRoutes);
    api.route('/datasets', datasetsRoutes);
    api.route('/sse', sseRoutes);
    api.get('/health-check', (c) => c.body("The server is up and running", 200));

    const app = new Hono().route("/api", api);

    return app
};
