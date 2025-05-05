import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { MechaTester } from "../../helpers/mechaTester.ts";
import { Client as PostgresClient } from "deno.land/x/postgres";
import { testingUserCredentials } from "../../mock/data/mockUsers.ts";
import { Client as MinioClient } from "minio/dist/esm/minio.d.mts";
import { getRandomMockNewAgentInput } from "../../mock/data/mockAgents.ts";
import { QdrantClient } from "npm:@qdrant/js-client-rest";
import createTestingDatasetForAgent from "../../helpers/createTestingDatasetForAgent.ts";
import datasetsResponsesMessages from "../../../src/constant/response-messages/datasetsResponsesMessages.ts";

export default function deleteDatasetTests(
    { db, objectStorage, vectorDB }:
        { db: PostgresClient, objectStorage: MinioClient, vectorDB: QdrantClient }
) {
    const endpoint = "/api/datasets/:datasetId";
    const datasetsToDelete: string[] = [];

    describe(`Testing 'DELETE ${endpoint}' endpoint`, () => {
        let datasetId = "";
        let agentId = "";

        beforeAll(async () => {
            const { newDatasetId, newAgentId } = await createTestingDatasetForAgent({
                db,
                agent: getRandomMockNewAgentInput(),
                user: testingUserCredentials,
                objectStorage,
                vectorDB,
            });

            datasetsToDelete.push(newDatasetId);
            datasetId = newDatasetId;
            agentId = newAgentId;
        })

        afterAll(async () => {
            await db.queryObject`
                DELETE FROM agents; 
                DELETE FROM users
            `;

            if (datasetsToDelete.length) {
                await objectStorage.removeObjects(
                    "datasets",
                    datasetsToDelete.map((datasetId) => ({ name: datasetId }))
                );

                await new Promise<void>((resolve) => {
                    setTimeout(async () => {
                        await vectorDB.delete("datasets", {
                            wait: true,
                            filter: {
                                must: [
                                    {
                                        key: "userEmail",
                                        match: { value: testingUserCredentials.email },
                                    },
                                ]
                            },
                        })
                        resolve()
                    }, 75)
                })
            }
        })

        it("Should fail to delete the dataset of the agent because agent id is missing", async () => {
            const tester = new MechaTester(testingUserCredentials.email)

            const response = await tester
                .delete(endpoint.replace(":datasetId", datasetId))
                .send();

            const { error } = await response.json<{ error: string }>();

            expect(error).toBe(datasetsResponsesMessages.failedDeletion);
        })

        it("Should fail to delete the dataset of the agent because the wrong dataset id", async () => {
            const tester = new MechaTester(testingUserCredentials.email)

            const response = await tester
                .delete(`${endpoint.replace(":datasetId", crypto.randomUUID())}?agentId=${agentId}`)
                .send();

            const { error } = await response.json<{ error: string }>();

            expect(error).toBe(datasetsResponsesMessages.failedDeletion);
        })

        it("Should succeed to delete the dataset of the agent", async () => {
            const tester = new MechaTester(testingUserCredentials.email)

            const response = await tester
                .delete(`${endpoint.replace(":datasetId", datasetId)}?agentId=${agentId}`)
                .send();

            const { result } = await response.json<{ result: string }>();

            expect(result).toBe(datasetsResponsesMessages.successfulDeletion);

            const { rows: [dataset] } = await db.queryObject(`SELECT id FROM datasets WHERE ID = $1`, [datasetId]);

            expect(dataset).toBeUndefined();
        })
    });
};
