import { Hono } from "hono";
import { InstructionsController } from "../controllers/InstructionsController.ts";
import insertInstructionsInputValidator from "../validation/instructions/insertInstructionsInputValidator.ts";
import removeInstructionsInputValidator from "../validation/instructions/removeInstructionsInputValidator.ts";
import updateInstructionsInputValidator from "../validation/instructions/updateInstructionsInputValidator.ts";
import queryInstructionsParamsValidator from "../validation/instructions/queryInstructionsParamsValidator.ts";
import { GuardService } from "../services/GuardService.ts";
import { readPermission, writePermission } from "../constant/permissions.ts";

export default function instructionsRoutesBuilder(
    instructionsController: InstructionsController,
    guardService: GuardService
) {
    const instructionsRoutes = new Hono();

    instructionsRoutes.get(
        '/',
        guardService.guardRoute({ permissions: [readPermission] }),
        queryInstructionsParamsValidator,
        instructionsController.query.bind(instructionsController),
    );

    instructionsRoutes.use(guardService.guardRoute({ permissions: [writePermission] }));
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

    return instructionsRoutes;
};
