import { it, afterAll, describe } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { getRandomMockNewAgentInput } from "../../mock/data/mockAgents.ts";
import AgentsResponseMessages from "../../../src/constant/response-messages/agentsResponsesMessages.ts";
import { MechaTester } from "../../helpers/mechaTester.ts";
import { Client as PostgresClient } from "deno.land/x/postgres";
import insertUserIntoDB from "../../helpers/insertUserIntoDB.ts";
import { testingUserCredentials } from "../../mock/data/mockUsers.ts";
import insertAgentsIntoDB from "../../helpers/insertAgentsIntoDB.ts";
import { randomUUID } from "node:crypto";
// @deno-types="minio/dist/esm/minio.d.mts"
import { Client as MinioClient } from "minio";

export default function updateAgentTests(
    { db, objectStorage }: { db: PostgresClient, objectStorage: MinioClient }
) {
    const endpoint = "/api/agents/:id";

    describe(`Testing 'PATCH ${endpoint}' endpoint`, () => {
        const avatarsToDelete: string[] = []

        afterAll(async () => {
            await db.queryObject`
                DELETE FROM agents;
                DELETE FROM users
            `;

            if (avatarsToDelete.length) {
                await objectStorage.removeObjects(
                    "agents-avatars",
                    avatarsToDelete.map((avatarId) => ({ name: avatarId }))
                )
            }
        })

        it("Should fail to update the agent because it doesn't exist", async () => {
            await insertUserIntoDB({ db, user: testingUserCredentials })
            const request = new MechaTester(testingUserCredentials.email);

            const updateData = new FormData()
            updateData.set("agentName", "any random agent name")
            const response = await request.patch(endpoint.replace(":id", randomUUID()))
                .body(updateData)
                .send()

            const status = response.object.status
            const { error } = await response.json<{ error: string }>();

            expect(status).toBe(404);
            expect(error).toBe(`${AgentsResponseMessages.failedAgentUpdate}, ${AgentsResponseMessages.noAgentOrUser}`)
        });

        it("Should fail to update the agent because of the empty update payload", async () => {
            const newAgent = getRandomMockNewAgentInput();
            const newAgentId = randomUUID();

            await insertAgentsIntoDB({
                db,
                agents: [{
                    id: newAgentId,
                    agentName: newAgent.agentName,
                    description: newAgent.description,
                    userEmail: testingUserCredentials.email,
                }]
            });

            const request = new MechaTester(testingUserCredentials.email);
            const response = await request.patch(endpoint.replace(":id", newAgentId))
                .body(new FormData())
                .send()

            const status = response.object.status
            const res = await response.json<{ error: string }>();

            expect(status).toBe(400);
            expect(res.error).toBe(AgentsResponseMessages.noUpdateData)
        });

        it("Should succeed to update the description and the system instructions of the agent", async () => {
            const newAgent = getRandomMockNewAgentInput();
            const newAgentId = randomUUID();

            await insertAgentsIntoDB({
                db,
                agents: [{
                    id: newAgentId,
                    agentName: newAgent.agentName,
                    description: newAgent.description,
                    userEmail: testingUserCredentials.email,
                }]
            });

            const updateData = {
                description: "New description",
                systemInstructions: "New system instructions"
            }

            const updateAgentFormData = new FormData();
            Object.entries(updateData).forEach(([key, value]) => {
                updateAgentFormData.set(key, value)
            });

            const request = new MechaTester(testingUserCredentials.email);
            const response = await request.patch(endpoint.replace(":id", newAgentId))
                .body(updateAgentFormData)
                .send()

            const { result } = await response.json<{ result: string }>();

            expect(result).toBe(AgentsResponseMessages.successfulAgentUpdate);

            const { rows: [agent] } = await db.queryObject<Agent>({
                text: "SELECT description, system_instructions FROM agents WHERE id = $1 AND user_email = $2",
                args: [newAgentId, testingUserCredentials.email],
                camelCase: true
            })

            expect(agent.description).toBe(updateData.description)
            expect(agent.systemInstructions).toBe(updateData.systemInstructions)
        });
    })
}
