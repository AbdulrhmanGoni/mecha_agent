import { afterAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { MechaTester } from "../../helpers/mechaTester.ts";
import { Client as PostgresClient } from "deno.land/x/postgres";
import { testingUserCredentials } from "../../mock/data/mockUsers.ts";
import authResponsesMessages from "../../../src/constant/response-messages/authResponsesMessages.ts";
import insertUserIntoDB from "../../helpers/insertUserIntoDB.ts";

export default function getUserDataTests({ db }: { db: PostgresClient }) {
    const endpoint = "/api/users";

    describe(`Testing 'GET ${endpoint}' route`, () => {
        afterAll(async () => {
            await db.queryObject`DELETE FROM users`;
        })

        it("Should return 404 error because of the doesn't exist", async () => {
            const request = new MechaTester(testingUserCredentials.email);
            const response = await request.get(endpoint).send()

            const res = await response.json<{ error: string }>()

            expect(res.error).toBe(authResponsesMessages.noUser);
        });

        it("Should return user's data successfully", async () => {
            await insertUserIntoDB({ db, user: testingUserCredentials });

            const request = new MechaTester(testingUserCredentials.email);
            const response = await request.get(endpoint).send()

            const res = await response.json<{ result: User }>()

            expect(res.result).toMatchObject({
                name: testingUserCredentials.username,
                email: testingUserCredentials.email,
                avatar: null,
                signingMethod: testingUserCredentials.signingMethod,
                createdAt: expect.any(String),
                lastSignIn: expect.any(String),
            });
        });
    });
};
