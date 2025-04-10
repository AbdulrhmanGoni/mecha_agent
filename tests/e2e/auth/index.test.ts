import { describe } from "@std/testing/bdd";
import signUpTests from "./signUp.test.ts";
import signInTests from "./signIn.test.ts";

export default function authRouteTests(app: TestingAppConfigs) {
    describe("Testing auth API route", () => {
        signUpTests({
            db: app.configurations.databaseClient
        });

        signInTests({
            db: app.configurations.databaseClient
        });
    })
};
