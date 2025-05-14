import { Hono } from "hono";
import createAgentInputValidator from "../validation/agents/createAgentInputValidator.ts";
import { AgentsController } from "../controllers/AgentsController.ts";
import updateAgentInputValidator from "../validation/agents/updateAgentInputValidator.ts";
import { GuardService } from "../services/GuardService.ts";
import { writePermission, readPermission, inferencePermission } from "../constant/permissions.ts";

export default function agentsRoutesBuilder(
    agentsController: AgentsController,
    guardService: GuardService
) {
    const agentsRoutes = new Hono();

    agentsRoutes.get(
        '/',
        guardService.guardRoute({ permissions: [readPermission] }),
        agentsController.getAll.bind(agentsController)
    );

    agentsRoutes.get(
        '/:agentId',
        guardService.guardRoute({ permissions: [readPermission] }),
        agentsController.getOne.bind(agentsController)
    );

    agentsRoutes.post(
        '/:agentId/publish',
        guardService.guardRoute({ permissions: [readPermission, writePermission, inferencePermission] }),
        agentsController.publishAgent.bind(agentsController)
    );

    agentsRoutes.post(
        '/:agentId/unpublish',
        guardService.guardRoute({ permissions: [readPermission, writePermission, inferencePermission] }),
        agentsController.unpublishAgent.bind(agentsController)
    );

    agentsRoutes.use(guardService.guardRoute({ permissions: [writePermission] }))

    agentsRoutes.post(
        '/',
        createAgentInputValidator,
        agentsController.create.bind(agentsController)
    );

    agentsRoutes.delete(
        '/:agentId',
        agentsController.delete.bind(agentsController)
    );

    agentsRoutes.patch(
        '/:agentId',
        updateAgentInputValidator,
        agentsController.update.bind(agentsController)
    );

    return agentsRoutes;
};
