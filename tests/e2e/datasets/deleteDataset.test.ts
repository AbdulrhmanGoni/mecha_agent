import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { MechaTester } from "../../helpers/mechaTester.ts";
import { Client as PostgresClient } from "deno.land/x/postgres";
import { testingUserCredentials } from "../../mock/data/mockUsers.ts";
import { QdrantClient } from "qdrant";
import datasetsResponsesMessages from "../../../src/constant/response-messages/datasetsResponsesMessages.ts";
import insertUserIntoDB from "../../helpers/insertUserIntoDB.ts";
import { randomUUID } from "node:crypto";

export default function deleteDatasetTests({ db }: { db: PostgresClient, vectorDB: QdrantClient }) {
    const endpoint = "/api/datasets/:datasetId";

    describe(`Testing 'DELETE ${endpoint}' endpoint`, () => {
        let datasetId = ''
        beforeAll(async () => {
            await insertUserIntoDB({ db, user: testingUserCredentials });

            const newDataset = {
                title: "New Dataset",
                description: "New Dataset description",
            }

            const { rows: [{ id }] } = await db.queryObject<Dataset>({
                text: 'INSERT INTO datasets (title, description, user_email) VALUES ($1, $2, $3) RETURNING *',
                args: [
                    newDataset.title,
                    newDataset.description,
                    testingUserCredentials.email
                ],
            });

            datasetId = id
        })

        afterAll(async () => {
            await db.queryObject`DELETE FROM users`;
        })

        it("Should fail to delete the dataset because of wrong id", async () => {
            const wrongId = randomUUID()
            const tester = new MechaTester(testingUserCredentials.email)
            const response = await tester
                .delete(`${endpoint.replace(":datasetId", wrongId)}`)
                .send();

            const { error } = await response.json<{ error: string }>();
            expect(error).toBe(datasetsResponsesMessages.failedDeletion);
        })

        it("Should succeed to delete the dataset", async () => {
            const tester = new MechaTester(testingUserCredentials.email)
            const response = await tester
                .delete(`${endpoint.replace(":datasetId", datasetId)}`)
                .send();

            const { result } = await response.json<{ result: string }>();
            expect(result).toBe(datasetsResponsesMessages.successfulDeletion);

            const { rowCount } = await db.queryObject(`SELECT id FROM datasets WHERE id = $1`, [datasetId]);
            expect(rowCount).toBe(0);
        })
    });
};
