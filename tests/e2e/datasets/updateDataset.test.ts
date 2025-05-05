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

export default function updateDatasetTests(
    { db, objectStorage, vectorDB }:
        { db: PostgresClient, objectStorage: MinioClient, vectorDB: QdrantClient }
) {
    const endpoint = "/api/datasets/:datasetId";
    const datasetsToDelete: string[] = [];

    describe(`Testing 'PATCH ${endpoint}' endpoint`, () => {
        let datasetId = "";

        beforeAll(async () => {
            const { newDatasetId } = await createTestingDatasetForAgent({
                db,
                agent: getRandomMockNewAgentInput(),
                user: testingUserCredentials,
                objectStorage,
                vectorDB,
            });

            datasetsToDelete.push(newDatasetId);
            datasetId = newDatasetId;
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

        it("Should fail to update the dataset because it does not exist", async () => {
            const tester = new MechaTester(testingUserCredentials.email)

            const updateData = {
                title: "Updated Title"
            }

            const response = await tester
                .patch(endpoint.replace(":datasetId", crypto.randomUUID()))
                .headers({ "Content-Type": "application/json" })
                .json(updateData)
                .send();

            const { error } = await response.json<{ error: string }>();

            expect(error).toBe(datasetsResponsesMessages.failedUpdate);
        })

        it("Should fail to update the dataset because update payload is empty", async () => {
            const tester = new MechaTester(testingUserCredentials.email)

            const response = await tester
                .patch(endpoint.replace(":datasetId", crypto.randomUUID()))
                .headers({ "Content-Type": "application/json" })
                .json({})
                .send();

            const { error } = await response.json<{ error: string }>();

            expect(error).toBe(datasetsResponsesMessages.noUpdateData);
        })

        it("Should succeed to update the title of the dataset", async () => {
            const tester = new MechaTester(testingUserCredentials.email)

            const updateData = {
                title: "Updated Title"
            }

            const response = await tester
                .patch(endpoint.replace(":datasetId", datasetId))
                .headers({ "Content-Type": "application/json" })
                .json(updateData)
                .send();

            const { result } = await response.json<{ result: string }>();

            expect(result).toBe(datasetsResponsesMessages.successfulUpdate);

            const { rows: [updatedDataset] } = await db.queryObject<{ title: string }>(
                `SELECT title FROM datasets WHERE id = $1`,
                [datasetId]
            );

            expect(updatedDataset.title).toBe(updateData.title);
        })
    });
};
