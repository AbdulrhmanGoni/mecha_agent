import { afterAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { MechaTester } from "../../helpers/mechaTester.ts";
import { Client as PostgresClient } from "deno.land/x/postgres";
import { fakeUserEmail, testingUserCredentials } from "../../mock/data/mockUsers.ts";
import insertUserIntoDB from "../../helpers/insertUserIntoDB.ts";
import { mockApiKeys } from "../../mock/data/mockApiKeys.ts";
import insertApiKeysIntoDB from "../../helpers/insertApiKeysIntoDB.ts";
import apiKeysResponseMessages from "../../../src/constant/response-messages/apiKeysResponsesMessages.ts";
import { randomUUID } from "node:crypto";

export default function deactivateApiKeyTests({ db }: { db: PostgresClient }) {
    const endpoint = "/api/api-keys/deactivate";

    describe(`Testing 'PATCH ${endpoint}' route`, () => {
        afterAll(async () => {
            await db.queryObject`
                DELETE FROM api_keys; 
                DELETE FROM users;
            `;
        })

        it("Should fail to deactivate anything because the user isn't existant", async () => {
            const request = new MechaTester(fakeUserEmail);
            const response = await request.patch(endpoint)
                .headers({ "Content-Type": "application/json" })
                .json([randomUUID()])
                .send()

            const res = await response.json<{ error: string }>();

            expect(res.error).toBe(apiKeysResponseMessages.failedKeyDeactivation);
        });

        it("Should return 'No API Keys ids provided' error", async () => {
            const request = new MechaTester(fakeUserEmail);
            const response = await request.patch(endpoint)
                .headers({ "Content-Type": "application/json" })
                .json([])
                .send()

            const res = await response.json<{ error: string }>();

            expect(res.error).toMatch(/No API Keys ids provided/g);
        });

        it("Should succeed to deactivate all api keys of the user", async () => {
            await insertUserIntoDB({ db, user: testingUserCredentials });
            const addedKeys = await insertApiKeysIntoDB({
                db,
                keys: mockApiKeys.map((key) => ({
                    keyName: key.keyName,
                    maxAgeInDays: Math.floor(Math.random() * 30),
                    permissions: key.permissions,
                    userEmail: testingUserCredentials.email,
                }))
            });

            const request = new MechaTester(testingUserCredentials.email);
            const response = await request.patch(endpoint)
                .headers({ "Content-Type": "application/json" })
                .json(addedKeys.map((key) => key.id))
                .send()

            const res = await response.json<{ result: string }>();

            expect(res.result).toBe(apiKeysResponseMessages.successfulKeyDeactivation);

            const { rows, rowCount } = await db.queryObject<Pick<ApiKeyRecord, "status">>(
                `SELECT status FROM api_keys WHERE user_email = '${testingUserCredentials.email}'`
            )

            expect(rowCount).toBe(mockApiKeys.length);
            rows.forEach((key) => {
                expect(key.status).toBe("Inactive");
            })
        });
    });
};
