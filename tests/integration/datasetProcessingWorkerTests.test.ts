import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { testingUserCredentials } from "../mock/data/mockUsers.ts";
import createTestingDatasetForAgent from "../helpers/createTestingDatasetForAgent.ts";
import { getRandomMockNewAgentInput } from "../mock/data/mockAgents.ts";
import { Client as PostgresClient } from "deno.land/x/postgres";
import { Client as MinioClient } from "minio/dist/esm/minio.d.mts";
import { QdrantClient } from "npm:@qdrant/js-client-rest";

export default function datasetProcessingWorkerTests(
    { db, objectStorage, vectorDB }: { db: PostgresClient, objectStorage: MinioClient, vectorDB: QdrantClient }
) {
    describe(`Testing dataset processing worker`, () => {
        let worker: Worker;
        let dataset: Dataset;
        const datasetsToDelete: string[] = [];

        beforeAll(async () => {
            await db.queryObject`
                DELETE FROM users;
                DELETE FROM agents;
            `
            worker = new Worker(
                import.meta.resolve("../../src/services/DatasetProcessingWorker.ts"),
                { type: "module" }
            );

            const agent = getRandomMockNewAgentInput()
            const { newDatasetData } = await createTestingDatasetForAgent({
                db,
                objectStorage,
                user: testingUserCredentials,
                agent: agent
            })

            datasetsToDelete.push(newDatasetData.id)
            dataset = newDatasetData
        })

        afterAll(async () => {
            await db.queryObject`
                DELETE FROM users;
                DELETE FROM agents;
            `

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

        it("Should fail to process the dataset and send back 'failed_process' message", async () => {
            worker.postMessage(({
                process: "new_dataset",
                payload: {},
            }));

            await new Promise<void>((resolve) => {
                worker.onmessage = (e) => {
                    expect(e.data.process).toBe("failed_process");
                    expect(e.data.payload.datasetId).toBeUndefined();
                    expect(e.data.payload.userEmail).toBeUndefined();
                    resolve()
                }
            })
        });

        it("Should process the dataset and send back 'successful_process' message", async () => {
            worker.postMessage(({
                process: "new_dataset",
                payload: dataset,
            }));

            await new Promise<void>((resolve) => {
                worker.onmessage = (e) => {
                    expect(e.data.process).toBe("successful_process");
                    expect(e.data.payload.datasetId).toBe(dataset.id);
                    expect(e.data.payload.userEmail).toBe(dataset.userEmail);
                    resolve()
                }
            })
        });

        it("Should fail to complete dataset deletion and send back 'failed_deletion' message", async () => {
            worker.postMessage(({
                process: "delete_dataset",
                payload: {},
            }));

            await new Promise<void>((resolve) => {
                worker.onmessage = (e) => {
                    expect(e.data.process).toBe("failed_deletion");
                    expect(e.data.payload.datasetId).toBeUndefined();
                    expect(e.data.payload.userEmail).toBeUndefined();
                    resolve()
                }
            })
        });

        it("Should handle deleting the dataset and send back 'successful_deletion' message", async () => {
            worker.postMessage(({
                process: "delete_dataset",
                payload: {
                    datasetId: dataset.id,
                    userEmail: dataset.userEmail
                },
            }));

            await new Promise<void>((resolve) => {
                worker.onmessage = (e) => {
                    expect(e.data.process).toBe("successful_deletion");
                    expect(e.data.payload.datasetId).toBe(dataset.id);
                    expect(e.data.payload.userEmail).toBe(dataset.userEmail);
                    resolve()
                }
            })
        });
    });
};
