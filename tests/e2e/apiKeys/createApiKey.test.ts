import { afterAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { MechaTester } from "../../helpers/mechaTester.ts";
import { Client as PostgresClient } from "deno.land/x/postgres";
import { fakeUserEmail, testingUserCredentials } from "../../mock/data/mockUsers.ts";
import insertUserIntoDB from "../../helpers/insertUserIntoDB.ts";
import { newApiKeyInput } from "../../mock/data/mockApiKeys.ts";
import { uuidMatcher } from "../../helpers/uuidMatcher.ts";

type ResultApiKeyRecord = Omit<ApiKeyRecord, "secretHash">;
type SuccessfulApiKeyCreationResult = {
    key: string;
    record: ResultApiKeyRecord;
}

export default function createApiKeyTests({ db }: { db: PostgresClient }) {
    const endpoint = "/api/api-keys";

    describe(`Testing 'POST ${endpoint}' route`, () => {
        afterAll(async () => {
            await db.queryObject`DELETE FROM users;`;
        })

        it("Should fail to create the key because the user doesn't exist", async () => {
            const request = new MechaTester(fakeUserEmail);
            const response = await request.post(endpoint)
                .json(newApiKeyInput)
                .send()

            const res = await response.json<{ error: string }>();

            expect(res.error).toEqual(expect.any(String));
        });

        it("Should succeed to create the key with expiration date", async () => {
            await insertUserIntoDB({ db, user: testingUserCredentials })

            const request = new MechaTester(testingUserCredentials.email);
            const response = await request.post(endpoint)
                .json(newApiKeyInput)
                .send()

            const res = await response.json<{ result: SuccessfulApiKeyCreationResult }>();

            expect(res.result.record).toMatchObject({
                id: expect.stringMatching(uuidMatcher),
                keyName: newApiKeyInput.keyName,
                expirationDate: expect.any(String),
                permissions: expect.arrayContaining(newApiKeyInput.permissions),
                status: "Active",
                createdAt: expect.any(String),
                userEmail: testingUserCredentials.email
            });
        });

        it("Should succeed to create the key with no expiration date", async () => {
            const newApiKeyWithNoExpiration = {
                keyName: "another new api key",
                maxAgeInDays: undefined,
                permissions: ["read", "inference"],
            }

            const request = new MechaTester(testingUserCredentials.email);
            const response = await request.post(endpoint)
                .json(newApiKeyWithNoExpiration)
                .send()

            const res = await response.json<{ result: SuccessfulApiKeyCreationResult }>();

            expect(res.result.record).toMatchObject({
                id: expect.stringMatching(uuidMatcher),
                keyName: newApiKeyWithNoExpiration.keyName,
                expirationDate: null,
                permissions: expect.arrayContaining(newApiKeyWithNoExpiration.permissions),
                status: "Active",
                createdAt: expect.any(String),
                userEmail: testingUserCredentials.email
            });
        });

        it("Should fail to create the key with maxAgeInDays = 0", async () => {
            const request = new MechaTester(testingUserCredentials.email);
            const response = await request.post(endpoint)
                .json({
                    keyName: "test key",
                    permissions: ["read"],
                    maxAgeInDays: 0,
                })
                .send()

            const res = await response.json<{ error: string }>();

            expect(response.object.status).toBe(400);
            expect(res.error).toContain("Expiration must be at least 1 day");
        });

        it("Should fail to create the key with negative maxAgeInDays", async () => {
            const request = new MechaTester(testingUserCredentials.email);
            const response = await request.post(endpoint)
                .json({
                    keyName: "test key",
                    permissions: ["read"],
                    maxAgeInDays: -5,
                })
                .send()

            const res = await response.json<{ error: string }>();

            expect(response.object.status).toBe(400);
            expect(res.error).toContain("Expiration must be at least 1 day");
        });

        it("Should fail to create the key with maxAgeInDays > 730", async () => {
            const request = new MechaTester(testingUserCredentials.email);
            const response = await request.post(endpoint)
                .json({
                    keyName: "test key",
                    permissions: ["read"],
                    maxAgeInDays: 731,
                })
                .send()

            const res = await response.json<{ error: string }>();

            expect(response.object.status).toBe(400);
            expect(res.error).toContain("Expiration cannot exceed 2 years");
        });

        it("Should fail to create the key with non-integer maxAgeInDays", async () => {
            const request = new MechaTester(testingUserCredentials.email);
            const response = await request.post(endpoint)
                .json({
                    keyName: "test key",
                    permissions: ["read"],
                    maxAgeInDays: 30.5,
                })
                .send()

            const res = await response.json<{ error: string }>();

            expect(response.object.status).toBe(400);
        });

        it("Should fail to create the key with empty keyName", async () => {
            const request = new MechaTester(testingUserCredentials.email);
            const response = await request.post(endpoint)
                .json({
                    keyName: "",
                    permissions: ["read"],
                    maxAgeInDays: 10,
                })
                .send()

            const res = await response.json<{ error: string }>();

            expect(response.object.status).toBe(400);
        });

        it("Should fail to create the key with keyName exceeding 100 characters", async () => {
            const longKeyName = "a".repeat(101);
            const request = new MechaTester(testingUserCredentials.email);
            const response = await request.post(endpoint)
                .json({
                    keyName: longKeyName,
                    permissions: ["read"],
                    maxAgeInDays: 10,
                })
                .send()

            const res = await response.json<{ error: string }>();

            expect(response.object.status).toBe(400);
        });

        it("Should succeed to create the key with maxAgeInDays = 730 (2 years)", async () => {
            const request = new MechaTester(testingUserCredentials.email);
            const response = await request.post(endpoint)
                .json({
                    keyName: "max expiration key",
                    permissions: ["read"],
                    maxAgeInDays: 730,
                })
                .send()

            const res = await response.json<{ result: SuccessfulApiKeyCreationResult }>();

            expect(response.object.status).toBe(201);
            expect(res.result.record.expirationDate).not.toBeNull();
        });

        it("Should succeed to create the key with keyName = 80 characters", async () => {
            const maxLengthKeyName = "a".repeat(80);
            const request = new MechaTester(testingUserCredentials.email);
            const response = await request.post(endpoint)
                .json({
                    keyName: maxLengthKeyName,
                    permissions: ["read"],
                    maxAgeInDays: 10,
                })
                .send()

            const res = await response.json<{ result: SuccessfulApiKeyCreationResult }>();

            expect(response.object.status).toBe(201);
            expect(res.result.record.keyName).toBe(maxLengthKeyName);
        });
    });
};
