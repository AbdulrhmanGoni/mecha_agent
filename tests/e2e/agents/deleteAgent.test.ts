import { it, afterAll, describe } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { getRandomMockAgent } from "../../mock/data/mockAgents.ts";
import AgentsResponseMessages from "../../../src/constant/response-messages/agentsResponsesMessages.ts";
import { MechaTester } from "../../helpers/mechaTester.ts";
import { Client as PostgresClient } from "deno.land/x/postgres";
import insertUserIntoDB from "../../helpers/insertUserIntoDB.ts";
import { fakeUserEmail, testingUserCredentials } from "../../mock/data/mockUsers.ts";
import insertAgentsIntoDB from "../../helpers/insertAgentsIntoDB.ts";

export default function deleteAgent({ db }: { db: PostgresClient }) {
    const endpoint = "/api/agents/:id";

    describe(`Testing 'DELETE ${endpoint}' endpoint`, () => {
        afterAll(async () => {
            await db.queryObject`
                DELETE FROM agents; 
                DELETE FROM users
            `;
        })

        it("Should fail to delete the agent and return 404 error because there is not a user owns such an agent", async () => {
            const agent = getRandomMockAgent();

            const request = new MechaTester(fakeUserEmail);
            const response = await request.delete(endpoint.replace(":id", agent.id)).send()

            const status = response.object.status;
            const { error } = await response.json<{ error: string }>();

            expect(status).toBe(404);
            expect(error).toBe(
                `${AgentsResponseMessages.failedAgentDeletion}: ${AgentsResponseMessages.noAgentOrUser}`
            );
        });

        it("Should also fail to delete the agent and return 404 error because there the agent does not exist", async () => {
            const agent = getRandomMockAgent();

            await insertUserIntoDB({ db, user: testingUserCredentials })

            const request = new MechaTester(fakeUserEmail);
            const response = await request.delete(endpoint.replace(":id", agent.id)).send()

            const status = response.object.status;
            const { error } = await response.json<{ error: string }>();

            expect(status).toBe(404);
            expect(error).toBe(
                `${AgentsResponseMessages.failedAgentDeletion}: ${AgentsResponseMessages.noAgentOrUser}`
            );
        });

        it("Should succeed to delete the agent and because both user and agent are existing", async () => {
            const agent = getRandomMockAgent();

            await insertAgentsIntoDB({
                db,
                agents: [{
                    id: agent.id,
                    agentName: agent.agentName,
                    description: agent.description,
                    userEmail: testingUserCredentials.email
                }]
            });

            const { rows } = await db.queryObject<Agent>`SELECT id FROM agents`;

            expect(rows[0].id).toBe(agent.id);

            const request = new MechaTester(testingUserCredentials.email);
            const response = await request.delete(endpoint.replace(":id", agent.id)).send()

            const status = response.object.status;
            const { result } = await response.json<{ result: string }>();

            const { rowCount } = await db.queryObject`SELECT id FROM agents`;

            expect(rowCount).toBe(0);
            expect(status).toBe(200);
            expect(result).toBe(AgentsResponseMessages.successfulAgentDeletion);
        });
    })
}
