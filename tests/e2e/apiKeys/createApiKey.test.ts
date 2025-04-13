import { afterAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { MechaTester } from "../../helpers/mechaTester.ts";
import { Client as PostgresClient } from "deno.land/x/postgres";
import { fakeUserEmail, testingUserCredentials } from "../../mock/data/mockUsers.ts";
import insertUserIntoDB from "../../helpers/insertUserIntoDB.ts";
import { newApiKeyInput } from "../../mock/data/mockApiKeys.ts";
import { uuidMatcher } from "../../helpers/uuidMatcher.ts";

export default function createApiKeyTests({ db }: { db: PostgresClient }) {
    const endpoint = "/api/api-keys";

    describe(`Testing 'POST ${endpoint}' route`, () => {
        afterAll(async () => {
            await db.queryObject`
                DELETE FROM api_keys; 
                DELETE FROM users;
            `;
        })

        it("Should fail to create the key because the user doesn't exist", async () => {
            const request = new MechaTester(fakeUserEmail);
            const response = await request.post(endpoint)
                .headers({ "Content-Type": "application/json" })
                .json(newApiKeyInput)
                .send()

            const res = await response.json<{ error: string }>();

            expect(res.error).toEqual(expect.any(String));
        });

        it("Should succeed to create the key", async () => {
            await insertUserIntoDB({ db, user: testingUserCredentials })

            const request = new MechaTester(testingUserCredentials.email);
            const response = await request.post(endpoint)
                .headers({ "Content-Type": "application/json" })
                .json(newApiKeyInput)
                .send()

            const res = await response.json<{ result: ApiKeyRecord }>();

            expect(res.result).toMatchObject({
                id: expect.stringMatching(uuidMatcher),
                key: expect.any(String),
                keyName: newApiKeyInput.keyName,
                expirationDate: expect.any(String),
                permissions: expect.arrayContaining(newApiKeyInput.permissions),
                status: "Active",
                createdAt: expect.any(String),
                userEmail: testingUserCredentials.email
            });
        });
    });
};
