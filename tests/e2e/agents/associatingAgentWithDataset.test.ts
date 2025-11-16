import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { MechaTester } from "../../helpers/mechaTester.ts";
import { Client as PostgresClient } from "deno.land/x/postgres";
import { testingUserCredentials } from "../../mock/data/mockUsers.ts";
import insertUserIntoDB from "../../helpers/insertUserIntoDB.ts";
import insertAgentsIntoDB from "../../helpers/insertAgentsIntoDB.ts";
import { getRandomMockNewAgentInput } from "../../mock/data/mockAgents.ts";
import createTestingDataset from "../../helpers/createTestingDataset.ts";
import AgentsResponseMessages from "../../../src/constant/response-messages/agentsResponsesMessages.ts";
import { randomUUID } from "node:crypto";

export default function associatingAgentWithDataset({ db }: { db: PostgresClient }) {
    const endpoint = "/api/agents/:agentId/dataset";

    describe(`Testing 'PATCH ${endpoint}' endpoint`, () => {
        let agentId = ""
        let datasetId = ""

        beforeAll(async () => {
            await insertUserIntoDB({ db, user: testingUserCredentials });
            const newDataset = await createTestingDataset(db);
            datasetId = newDataset.id;

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

        it("Should succeed to associate the dataset with the agent", async () => {
            const tester = new MechaTester(testingUserCredentials.email);
            const response = await tester.patch(
                endpoint.replace(":agentId", agentId) + `?datasetId=${datasetId}&action=associate`
            ).send();

            const { result } = await response.json<{ result: string }>();
            expect(result).toBe(AgentsResponseMessages.successfulAssociation);

            const { rows: [agent] } = await db.queryObject<{ datasetId: string }>({
                text: 'SELECT dataset_id FROM agents WHERE id = $1',
                args: [agentId],
                camelCase: true
            })

            expect(agent.datasetId).toBe(datasetId)
        })

        it("Should succeed to unassociate the dataset with the agent", async () => {
            const tester = new MechaTester(testingUserCredentials.email);
            const response = await tester.patch(
                endpoint.replace(":agentId", agentId) + `?datasetId=${datasetId}&action=unassociate`
            ).send();

            const { result } = await response.json<{ result: string }>();
            expect(result).toBe(AgentsResponseMessages.successfulUnassociation);

            const { rows: [agent] } = await db.queryObject<{ datasetId: string }>({
                text: 'SELECT dataset_id FROM agents WHERE id = $1',
                args: [agentId],
                camelCase: true
            })

            expect(agent.datasetId).toBeNull()
        })

        it("Should fail because the missing dataset id", async () => {
            const tester = new MechaTester(testingUserCredentials.email);
            const response = await tester.patch(
                endpoint.replace(":agentId", agentId) + '?&action=associate'
            ).send();

            const { error } = await response.json<{ error: string }>();
            expect(error).toBe(AgentsResponseMessages.noDatasetIdToAssociate);
        })

        it("Should fail because a non-existing dataset with the agent", async () => {
            const nonExistingDatasetId = randomUUID()
            const tester = new MechaTester(testingUserCredentials.email);
            const response = await tester.patch(
                endpoint.replace(":agentId", agentId) + `?datasetId=${nonExistingDatasetId}&action=associate`
            ).send();

            const { error } = await response.json<{ error: string }>();
            expect(error).toBeTruthy();
        })
    });
};
