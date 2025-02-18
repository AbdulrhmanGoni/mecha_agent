import { Hono } from "hono";
import createAgentInputValidator from "../validation/agents/createAgentInputValidator.ts";
import { AgentsController } from "../controllers/AgentsController.ts";
import updateAgentInputValidator from "../validation/agents/updateAgentInputValidator.ts";
import { GuardService } from "../services/GuardService.ts";
import { writePermission, readPermission } from "../constant/permissions.ts";

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

    agentsRoutes.use(guardService.guardRoute({ permissions: [writePermission] }))

    agentsRoutes.post(
        '/',
        createAgentInputValidator,
        agentsController.create.bind(agentsController)
    );

    agentsRoutes.get(
        '/:agentId',
        agentsController.getOne.bind(agentsController)
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
