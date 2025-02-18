import { Hono } from "hono";
import createDatasetInputValidator from "../validation/datasets/createDatasetInputValidator.ts";
import { DatasetsController } from "../controllers/DatasetsController.ts";
import { writePermission } from "../constant/permissions.ts";
import { GuardService } from "../services/GuardService.ts";
import updateDatasetInputValidator from "../validation/datasets/updateDatasetInputValidator.ts";

export default function datasetsRoutesBuilder(
    datasetsController: DatasetsController,
    guardService: GuardService
) {
    const datasetsRoutes = new Hono();

    datasetsRoutes.use(guardService.guardRoute({ permissions: [writePermission] }));

    datasetsRoutes.post(
        '/',
        createDatasetInputValidator,
        datasetsController.create.bind(datasetsController)
    );

    datasetsRoutes.delete(
        '/:datasetId',
        datasetsController.delete.bind(datasetsController)
    );

    datasetsRoutes.patch(
        '/:datasetId',
        updateDatasetInputValidator,
        datasetsController.delete.bind(datasetsController)
    );

    return datasetsRoutes;
};
