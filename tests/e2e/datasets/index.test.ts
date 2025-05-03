import { describe } from "@std/testing/bdd";
import createDatasetTests from "./createDataset.test.ts";
import updateDatasetTests from "./updateDataset.test.ts";

export default function datasetsRouteTests(app: TestingAppConfigs) {
    describe("Testing datasets API route", () => {
        createDatasetTests({
            db: app.configurations.databaseClient,
            objectStorage: app.configurations.minioClient,
            vectorDB: app.configurations.vectorDatabaseClient,
        });

        updateDatasetTests({
            db: app.configurations.databaseClient,
            objectStorage: app.configurations.minioClient,
            vectorDB: app.configurations.vectorDatabaseClient,
        });
    })
};

