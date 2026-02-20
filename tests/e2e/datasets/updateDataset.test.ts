import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { MechaTester } from "../../helpers/mechaTester.ts";
import { Client as PostgresClient } from "deno.land/x/postgres";
import { testingUserCredentials } from "../../mock/data/mockUsers.ts";
import datasetsResponsesMessages from "../../../src/constant/response-messages/datasetsResponsesMessages.ts";
import createTestingDataset from "../../helpers/createTestingDataset.ts";
import insertUserIntoDB from "../../helpers/insertUserIntoDB.ts";

export default function updateDatasetTests({ db }: { db: PostgresClient }) {
    const endpoint = "/api/datasets/:datasetId";

    describe(`Testing 'PATCH ${endpoint}' endpoint`, () => {
        let datasetId = "";

        beforeAll(async () => {
            await insertUserIntoDB({ db, user: testingUserCredentials });
            const newDataset = await createTestingDataset(db);
            datasetId = newDataset.id;
        })

        afterAll(async () => {
            await db.queryObject`DELETE FROM users`
        })

        it("Should fail to update the dataset because it does not exist", async () => {
            const tester = new MechaTester(testingUserCredentials.email)

            const updateData = {
                title: "Updated Title"
            }

            const response = await tester
                .patch(endpoint.replace(":datasetId", crypto.randomUUID()))
                .json(updateData)
                .send();

            const { error } = await response.json<{ error: string }>();

            expect(error).toBe(datasetsResponsesMessages.failedUpdate);
        })

        it("Should fail to update the dataset because update payload is empty", async () => {
            const tester = new MechaTester(testingUserCredentials.email)

            const response = await tester
                .patch(endpoint.replace(":datasetId", crypto.randomUUID()))
                .json({})
                .send();

            const { error } = await response.json<{ error: string }>();

            expect(error).toBe(datasetsResponsesMessages.noUpdateData);
        })

        it("Should succeed to update the title of the dataset", async () => {
            const updateData = { title: "Updated Title" };

            const tester = new MechaTester(testingUserCredentials.email)
            const response = await tester
                .patch(endpoint.replace(":datasetId", datasetId))
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
