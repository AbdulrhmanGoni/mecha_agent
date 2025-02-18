import { Hono } from "hono";
import { InstructionsController } from "../controllers/InstructionsController.ts";
import insertInstructionsInputValidator from "../validation/instructions/insertInstructionsInputValidator.ts";
import removeInstructionsInputValidator from "../validation/instructions/removeInstructionsInputValidator.ts";
import updateInstructionsInputValidator from "../validation/instructions/updateInstructionsInputValidator.ts";
import { GuardService } from "../services/GuardService.ts";
import { writePermission } from "../constant/permissions.ts";

export default function instructionsRoutesBuilder(
    instructionsController: InstructionsController,
    guardService: GuardService
) {
    const instructionsRoutes = new Hono();

    instructionsRoutes.use(guardService.guardRoute({ permissions: [writePermission] }),);

    instructionsRoutes.post(
        '/',
        insertInstructionsInputValidator,
        instructionsController.insert.bind(instructionsController),
    );

    instructionsRoutes.patch(
        '/',
        updateInstructionsInputValidator,
        instructionsController.update.bind(instructionsController)
    );

    instructionsRoutes.delete(
        '/',
        removeInstructionsInputValidator,
        instructionsController.remove.bind(instructionsController)
    );

    instructionsRoutes.delete(
        '/clear',
        instructionsController.clear.bind(instructionsController)
    );

    return instructionsRoutes;
};
