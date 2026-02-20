import { it, afterAll, describe } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { getRandomMockNewAgentInput } from "../../mock/data/mockAgents.ts";
import AgentsResponseMessages from "../../../src/constant/response-messages/agentsResponsesMessages.ts";
import { MechaTester } from "../../helpers/mechaTester.ts";
import { Client as PostgresClient } from "deno.land/x/postgres";
import insertUserIntoDB from "../../helpers/insertUserIntoDB.ts";
import { fakeUserEmail, testingUserCredentials } from "../../mock/data/mockUsers.ts";

export default function createAgentTests({ db }: { db: PostgresClient }) {
    const endpoint = "/api/agents";

    describe(`Testing 'POST ${endpoint}' endpoint`, () => {
        afterAll(async () => {
            await db.queryObject`DELETE FROM users;`;
        });

        it("Should fail to create the agent because the missing required fields", async () => {
            const { agentName: _, ...newAgentWithNoName } = getRandomMockNewAgentInput();

            const request = new MechaTester(fakeUserEmail);
            const response = await request.post(endpoint)
                .json(newAgentWithNoName)
                .send()

            const { error } = await response.json<{ error: string }>();

            expect(error).toMatch(/Required/);
            expect(error).toMatch(/agentName/);
            expect(error).toMatch(/field/);
        });

        it("Should succeed to create a new agent", async () => {
            await insertUserIntoDB({ db, user: testingUserCredentials });

            const newAgent = getRandomMockNewAgentInput();

            const request = new MechaTester(testingUserCredentials.email);
            const response = await request.post(endpoint)
                .json(newAgent)
                .send()

            const { result } = await response.json<{ result: string }>();

            expect(result).toBe(AgentsResponseMessages.successfulAgentCreation);
        });
    })
}
