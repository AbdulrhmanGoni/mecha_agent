import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { MechaTester } from "../../helpers/mechaTester.ts";
import { Client as PostgresClient } from "deno.land/x/postgres";
import { testingUserCredentials } from "../../mock/data/mockUsers.ts";
import insertUserIntoDB from "../../helpers/insertUserIntoDB.ts";
import { uuidMatcher } from "../../helpers/uuidMatcher.ts";

export default function createDatasetTests({ db }: { db: PostgresClient }) {
    const endpoint = "/api/datasets";

    describe(`Testing 'POST ${endpoint}' endpoint`, () => {
        beforeAll(async () => {
            await insertUserIntoDB({ db, user: testingUserCredentials });
        })

        afterAll(async () => {
            await db.queryObject`DELETE FROM users`;
        })

        it("Should succeed to create a dataset", async () => {
            const newDataset = {
                title: "New Dataset",
                description: "New Dataset description",
            }

            const tester = new MechaTester(testingUserCredentials.email);
            const response = await tester.post(endpoint)
                .headers({ "Content-Type": "application/json" })
                .json(newDataset)
                .send();

            const { result } = await response.json<{ result: Dataset }>();

            expect(result).toMatchObject({
                id: expect.stringMatching(uuidMatcher),
                title: newDataset.title,
                description: newDataset.description,
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
                userEmail: testingUserCredentials.email,
            });

            const { rows: [addedDataset] } = await db.queryObject<{ id: string }>({
                text: `SELECT id FROM datasets WHERE id = $1`,
                args: [result.id],
            })

            expect(addedDataset.id).toBeDefined()
        })

        it("Should fail to create a dataset because of missing required field", async () => {
            const newDataset = {
                description: "New Dataset description",
            }

            const tester = new MechaTester(testingUserCredentials.email);
            const response = await tester.post(endpoint)
                .json(newDataset)
                .headers({ "Content-Type": "application/json" })
                .send();

            const { error } = await response.json<{ error: string }>();

            expect(error).toMatch(/title/g);
            expect(error).toMatch(/Required/g);
        })
    });
};
