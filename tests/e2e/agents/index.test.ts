import { describe } from "@std/testing/bdd";
import createAgentTests from "./createAgent.test.ts";
import getAllAgentsTests from "./getAllAgents.test.ts";
import updateAgentTests from "./updateAgent.test.ts";
import deleteAgentTests from "./deleteAgent.test.ts";

export default function agentsRouteTests(app: TestingAppConfigs) {
    describe("Testing agents API route", () => {
        createAgentTests({
            db: app.configurations.databaseClient,
            objectStorage: app.configurations.minioClient,
        });

        getAllAgentsTests({
            db: app.configurations.databaseClient
        });

        updateAgentTests({
            db: app.configurations.databaseClient,
            objectStorage: app.configurations.minioClient,
        });

        deleteAgentTests({
            db: app.configurations.databaseClient
        });
    })
};
