import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { MechaTester } from "../../helpers/mechaTester.ts";
import { Client as PostgresClient } from "deno.land/x/postgres";
import { testingUserCredentials } from "../../mock/data/mockUsers.ts";
import insertUserIntoDB from "../../helpers/insertUserIntoDB.ts";
import insertAgentsIntoDB from "../../helpers/insertAgentsIntoDB.ts";
import { getRandomMockNewAgentInput } from "../../mock/data/mockAgents.ts";
import AgentsResponseMessages from "../../../src/constant/response-messages/agentsResponsesMessages.ts";

export default function publishingAgent({ db }: { db: PostgresClient }) {
    const publishEndpoint = "/api/agents/:agentId/publish";
    const unpublishEndpoint = "/api/agents/:agentId/unpublish";

    describe(`Testing 'POST ${publishEndpoint}' and 'POST ${unpublishEndpoint}' endpoints`, () => {
        let agentId = ""

        beforeAll(async () => {
            await insertUserIntoDB({ db, user: testingUserCredentials });

            const agent = getRandomMockNewAgentInput();
            const [{ id: newAgentId }] = await insertAgentsIntoDB({
                db,
                agents: [{
                    agentName: agent.agentName,
                    description: agent.description,
                    userEmail: testingUserCredentials.email
                }]
            })

            agentId = newAgentId
        })

        afterAll(async () => {
            await db.queryObject`DELETE FROM users`;
        })

        it("Should succeed to publish the agent", async () => {
            const tester = new MechaTester(testingUserCredentials.email);
            const response = await tester.post(publishEndpoint.replace(":agentId", agentId)).send();

            const { result } = await response.json<{ result: string }>();
            expect(result).toBe(AgentsResponseMessages.successfulPublishAgent);

            const { rows: [agent] } = await db.queryObject<{ isPublished: string }>({
                text: 'SELECT is_published FROM agents WHERE id = $1',
                args: [agentId],
                camelCase: true
            })

            expect(agent.isPublished).toBe(true)
        })

        it("Should fail to publish another agent because of the limit of free plan", async () => {
            const agent = getRandomMockNewAgentInput();
            const [{ id: newAgentId }] = await insertAgentsIntoDB({
                db,
                agents: [{
                    agentName: agent.agentName,
                    description: agent.description,
                    userEmail: testingUserCredentials.email
                }]
            })

            const tester = new MechaTester(testingUserCredentials.email);
            const response = await tester.post(publishEndpoint.replace(":agentId", newAgentId)).send();

            const { error } = await response.json<{ error: string }>();
            expect(error).toBe(AgentsResponseMessages.agentsLimitReached);
        })

        it("Should succeed to unpublish the agent", async () => {
            const tester = new MechaTester(testingUserCredentials.email);
            const response = await tester.post(unpublishEndpoint.replace(":agentId", agentId)).send();

            const { result } = await response.json<{ result: string }>();
            expect(result).toBe(AgentsResponseMessages.successfulUnpublishAgent);

            const { rows: [agent] } = await db.queryObject<{ isPublished: string }>({
                text: 'SELECT is_published FROM agents WHERE id = $1',
                args: [agentId],
                camelCase: true
            })

            expect(agent.isPublished).toBe(false)
        })
    });
};
