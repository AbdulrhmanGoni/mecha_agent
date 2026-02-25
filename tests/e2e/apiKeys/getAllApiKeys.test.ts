import { afterAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { MechaTester } from "../../helpers/mechaTester.ts";
import { Client as PostgresClient } from "deno.land/x/postgres";
import { fakeUserEmail, testingUserCredentials } from "../../mock/data/mockUsers.ts";
import insertUserIntoDB from "../../helpers/insertUserIntoDB.ts";
import { newApiKeyInput } from "../../mock/data/mockApiKeys.ts";
import { uuidMatcher } from "../../helpers/uuidMatcher.ts";
import insertApiKeysIntoDB from "../../helpers/insertApiKeysIntoDB.ts";

export default function getAllApiKeysTests({ db }: { db: PostgresClient }) {
    const endpoint = "/api/api-keys";

    describe(`Testing 'GET ${endpoint}' route`, () => {
        afterAll(async () => {
            await db.queryObject`DELETE FROM users;`;
        });

        it("Should fail to get any keys because the user doesn't exist", async () => {
            const request = new MechaTester(fakeUserEmail);
            const response = await request.get(endpoint).send()
            const res = await response.json<{ result: [] }>();

            expect(res.result).toBeInstanceOf(Array);
            expect(res.result).toHaveLength(0);
        });

        it("Should get an empty array because the user doesn't have any api keys", async () => {
            await insertUserIntoDB({ db, user: testingUserCredentials })

            const request = new MechaTester(testingUserCredentials.email);
            const response = await request.get(endpoint).send()
            const res = await response.json<{ result: [] }>();

            expect(res.result).toBeInstanceOf(Array);
            expect(res.result).toHaveLength(0);
        });

        it("Should get an array of user's api keys", async () => {
            await insertApiKeysIntoDB({ db, keys: [{ ...newApiKeyInput, userEmail: testingUserCredentials.email }] });

            const request = new MechaTester(testingUserCredentials.email);
            const response = await request.get(endpoint).send()
            const res = await response.json<{ result: ApiKeyRecord[] }>();

            expect(res.result).toBeInstanceOf(Array);
            expect(res.result).toHaveLength(1);
            expect(res.result[0]).toMatchObject({
                id: expect.stringMatching(uuidMatcher),
                keyName: newApiKeyInput.keyName,
                expirationDate: null,
                permissions: expect.arrayContaining(newApiKeyInput.permissions),
                status: "Active",
                createdAt: expect.any(String),
                userEmail: testingUserCredentials.email
            });
        });
    });
};
