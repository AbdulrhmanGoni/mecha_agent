import { describe } from "@std/testing/bdd";
import createApiKeyTests from "./createApiKey.test.ts";
import getAllApiKeysTests from "./getAllApiKeys.test.ts";
import deleteApiKeysTests from "./deleteApiKeys.test.ts";

export default function apiKeysRouteTests(app: TestingAppConfigs) {
    describe("Testing api-keys API route", () => {
        createApiKeyTests({
            db: app.configurations.databaseClient
        });

        getAllApiKeysTests({
            db: app.configurations.databaseClient
        });

        deleteApiKeysTests({
            db: app.configurations.databaseClient
        });
    })
};

