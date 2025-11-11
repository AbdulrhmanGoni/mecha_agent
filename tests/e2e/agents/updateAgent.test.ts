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

export default function updateAgentTests(
    { db }: { db: PostgresClient }
) {
    const endpoint = "/api/agents/:id";

    describe(`Testing 'PATCH ${endpoint}' endpoint`, () => {
        afterAll(async () => {
            await db.queryObject`
                DELETE FROM users;
                DELETE FROM deleted_agents_avatars;
            `;
        })

        it("Should fail to update the agent because it doesn't exist", async () => {
            await insertUserIntoDB({ db, user: testingUserCredentials })
            const request = new MechaTester(testingUserCredentials.email);
            const response = await request.patch(endpoint.replace(":id", randomUUID()))
                .json({ agentName: "any random agent name" })
                .headers({ "Content-Type": "application/json" })
                .send()

            const status = response.object.status
            const { error } = await response.json<{ error: string }>();

            expect(status).toBe(400);
            expect(error).toBe(AgentsResponseMessages.failedAgentUpdate)
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
                .json({})
                .headers({ "Content-Type": "application/json" })
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

            const request = new MechaTester(testingUserCredentials.email);
            const response = await request.patch(endpoint.replace(":id", newAgentId))
                .json(updateData)
                .headers({ "Content-Type": "application/json" })
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

        it("Should succeed to update the avatar of the agent", async () => {
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

            const avatarFileURL = "http://some-fake-avatar.png"

            const request = new MechaTester(testingUserCredentials.email);
            const response = await request.patch(endpoint.replace(":id", newAgentId))
                .json({ avatar: avatarFileURL })
                .headers({ "Content-Type": "application/json" })
                .send()

            const res = await response.json<{ result: string }>();

            expect(res.result).toBe(AgentsResponseMessages.successfulAgentUpdate);

            const { rows: [agent] } = await db.queryObject<Pick<Agent, "avatar">>({
                text: "SELECT avatar FROM agents WHERE id = $1 AND user_email = $2",
                args: [newAgentId, testingUserCredentials.email],
            })

            expect(agent.avatar).toBe(avatarFileURL)
        });

        it("Should succeed to remove the avatar of the agent", async () => {
            const newAgent = getRandomMockNewAgentInput();
            const newAgentId = randomUUID();

            await insertAgentsIntoDB({
                db,
                agents: [{
                    id: newAgentId,
                    agentName: newAgent.agentName,
                    description: newAgent.description,
                    userEmail: testingUserCredentials.email,
                    avatar: "http://some-fake-avatar.png"
                }]
            });

            const request = new MechaTester(testingUserCredentials.email);
            const response = await request.patch(endpoint.replace(":id", newAgentId))
                .json({ removeAvatar: true })
                .headers({ "Content-Type": "application/json" })
                .send()

            const res = await response.json<{ result: string }>();
            expect(res.result).toBe(AgentsResponseMessages.successfulAgentUpdate);

            const { rows: [agent] } = await db.queryObject<Pick<Agent, "avatar">>({
                text: "SELECT avatar FROM agents WHERE id = $1 AND user_email = $2",
                args: [newAgentId, testingUserCredentials.email],
            })

            expect(agent.avatar).toBeFalsy()
        });
    })
}
