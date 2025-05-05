import { describe } from "@std/testing/bdd";
import bootstrapTestingConfigs from "../bootstrapTestingConfigs.ts";
import datasetProcessingWorkerTests from "./datasetProcessingWorkerTests.test.ts";

const app = await bootstrapTestingConfigs()

describe("Integration tests", () => {
    datasetProcessingWorkerTests({
        db: app.configurations.databaseClient,
        objectStorage: app.configurations.minioClient,
        vectorDB: app.configurations.vectorDatabaseClient
    })
})
