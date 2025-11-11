import { describe } from "@std/testing/bdd";
import getUserDataTests from "./getUserData.test.ts";
import updateUserDataTests from "./updateUserData.test.ts";

export default function usersRouteTests(app: TestingAppConfigs) {
    describe("Testing users API route", () => {
        getUserDataTests({
            db: app.configurations.databaseClient
        });

        updateUserDataTests({
            db: app.configurations.databaseClient,
        });
    })
};

