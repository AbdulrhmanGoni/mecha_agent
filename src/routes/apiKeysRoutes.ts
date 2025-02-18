import { Hono } from "hono";
import { ApiKeysController } from "../controllers/ApiKeysController.ts";
import createApiKeyInputValidator from "../validation/apiKeys/createApiKeyInputValidator.ts";
import apiKeysIdsInputValidator from "../validation/apiKeys/apiKeysIdsInputValidator.ts";
import { GuardService } from "../services/GuardService.ts";
import { readPermission, writePermission } from "../constant/permissions.ts";

export default function apiKeysRoutesBuilder(
    apiKeysController: ApiKeysController,
    guardService: GuardService
) {
    const apiKeysRoutes = new Hono();

    apiKeysRoutes.get('/',
        guardService.guardRoute({ permissions: [readPermission] }),
        apiKeysController.getAll.bind(apiKeysController)
    );

    apiKeysRoutes.use(guardService.guardRoute({ permissions: [writePermission] }));

    apiKeysRoutes.post(
        '/',
        createApiKeyInputValidator,
        apiKeysController.create.bind(apiKeysController)
    );

    apiKeysRoutes.delete(
        '/',
        apiKeysIdsInputValidator,
        apiKeysController.delete.bind(apiKeysController)
    );

    apiKeysRoutes.patch(
        '/deactivate',
        apiKeysIdsInputValidator,
        apiKeysController.deactivate.bind(apiKeysController)
    );

    apiKeysRoutes.patch(
        '/activate',
        apiKeysIdsInputValidator,
        apiKeysController.activate.bind(apiKeysController)
    );

    return apiKeysRoutes;
};
