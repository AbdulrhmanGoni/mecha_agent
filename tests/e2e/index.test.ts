import { describe } from "@std/testing/bdd";
import bootstrapTestingConfigs from "../bootstrapTestingConfigs.ts";
import authRouteTests from "./auth/index.test.ts";
import usersRouteTests from "./users/index.test.ts";
import agentsRouteTests from "./agents/index.test.ts";

const app = await bootstrapTestingConfigs()

describe("Ene to end (e2e) tests", () => {
    authRouteTests(app);

    usersRouteTests(app);

    agentsRouteTests(app);
})