import { describe } from "@std/testing/bdd";
import createAgentTests from "./createAgent.test.ts";
import getAllAgentsTests from "./getAllAgents.test.ts";

export default function agentsRouteTests(app: TestingAppConfigs) {
    describe("Testing agents API route", () => {
        createAgentTests({
            db: app.configurations.databaseClient,
            objectStorage: app.configurations.minioClient,
        });

        getAllAgentsTests({
            db: app.configurations.databaseClient
        });
    })
};
