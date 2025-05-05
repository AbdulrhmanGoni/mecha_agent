import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { MechaTester } from "../../helpers/mechaTester.ts";
import { Client as PostgresClient } from "deno.land/x/postgres";
import { testingUserCredentials } from "../../mock/data/mockUsers.ts";
import insertUserIntoDB from "../../helpers/insertUserIntoDB.ts";
import { Client as MinioClient } from "minio/dist/esm/minio.d.mts";
import insertAgentsIntoDB from "../../helpers/insertAgentsIntoDB.ts";
import { getRandomMockNewAgentInput } from "../../mock/data/mockAgents.ts";
import { uuidMatcher } from "../../helpers/uuidMatcher.ts";
import { QdrantClient } from "npm:@qdrant/js-client-rest";
import { getMockDatasetFile, mockDatasetForAgents } from "../../mock/data/mockDataset.ts";

export default function createDatasetTests(
    { db, objectStorage, vectorDB }:
        { db: PostgresClient, objectStorage: MinioClient, vectorDB: QdrantClient }
) {
    const endpoint = "/api/datasets";
    const datasetsToDelete: string[] = [];

    describe(`Testing 'POST ${endpoint}' endpoint`, () => {
        const newDatasetForm = new FormData()

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

            const newDataset = mockDatasetForAgents({
                id: newAgentId,
                agentName: agent.agentName,
            })

            Object.entries(newDataset).forEach(([key, value]) => {
                newDatasetForm.set(key, value)
            });
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

        it("Should fail to create a dataset for the agent because dataset file is missing", async () => {
            const tester = new MechaTester(testingUserCredentials.email)

            const response = await tester.post(endpoint).body(newDatasetForm).send();

            const { error } = await response.json<{ error: string }>();

            expect(error).toMatch(/datasetFile/g);
            expect(error).toMatch(/not instance of File/g);
        })

        it("Should fail to create a dataset for the agent because dataset file is not supported", async () => {
            const tester = new MechaTester(testingUserCredentials.email)

            const fakeDatasetFile = new Blob(["any dummy data here..."], { type: "text/plain" })
            newDatasetForm.set("datasetFile", fakeDatasetFile)

            const response = await tester.post(endpoint).body(newDatasetForm).send();

            const { error } = await response.json<{ error: string }>();

            expect(error).toMatch(/datasetFile/g);
            expect(error).toMatch(/Not supported file type/g);
        })

        it("Should succeed to create a dataset for the agent", async () => {
            const tester = new MechaTester(testingUserCredentials.email);

            const fakeDatasetFile = getMockDatasetFile()
            newDatasetForm.set("datasetFile", fakeDatasetFile)

            const response = await tester.post(endpoint).body(newDatasetForm).send();

            const { result } = await response.json<{ result: Dataset }>();

            if (result.id) {
                datasetsToDelete.push(result.id)
            }

            expect(result).toMatchObject({
                id: expect.stringMatching(uuidMatcher),
                title: newDatasetForm.get("title"),
                description: newDatasetForm.get("description"),
                agentId: newDatasetForm.get("agentId"),
                status: expect.stringMatching(/(processing|processed)/),
                createdAt: expect.any(String),
            });

            const { rows: [addedDataset] } = await db.queryObject({
                text: `SELECT id FROM datasets WHERE id = $1 AND agent_id = $2`,
                args: [result.id, result.agentId],
                camelCase: true
            })

            expect(addedDataset).toBeDefined()
        })
    });
};
