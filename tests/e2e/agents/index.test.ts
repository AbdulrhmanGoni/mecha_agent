import { describe } from "@std/testing/bdd";
import createAgentTests from "./createAgent.test.ts";
import getAllAgentsTests from "./getAllAgents.test.ts";
import updateAgentTests from "./updateAgent.test.ts";
import deleteAgentTests from "./deleteAgent.test.ts";
import associatingAgentWithDataset from "./associatingAgentWithDataset.test.ts";

export default function agentsRouteTests(app: TestingAppConfigs) {
    describe("Testing agents API route", () => {
        createAgentTests({
            db: app.configurations.databaseClient,
        });

        getAllAgentsTests({
            db: app.configurations.databaseClient
        });

        updateAgentTests({
            db: app.configurations.databaseClient,
        });

        deleteAgentTests({
            db: app.configurations.databaseClient
        });

        associatingAgentWithDataset({
            db: app.configurations.databaseClient,
        });
    })
};
