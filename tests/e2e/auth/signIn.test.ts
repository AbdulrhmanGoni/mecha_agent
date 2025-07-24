import { afterAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { MechaTester } from "../../helpers/mechaTester.ts";
import authResponsesMessages from "../../../src/constant/response-messages/authResponsesMessages.ts";
import { Client as PostgresClient } from "deno.land/x/postgres";
import { testingUserCredentials, returnedUserCredentials } from "../../mock/data/mockUsers.ts";
import insertUserIntoDB from "../../helpers/insertUserIntoDB.ts";

export default function signInTests({ db }: { db: PostgresClient }) {
    const endpoint = "/api/auth/sign-in";

    describe(`Testing 'POST ${endpoint}' route`, () => {
        afterAll(async () => {
            await db.queryObject`DELETE FROM users;`;
        })

        it("Should fail to sign in because the user does not exist", async () => {
            const request = new MechaTester(returnedUserCredentials.email);

            const response = await request.post(endpoint)
                .json(returnedUserCredentials)
                .headers({ "Content-Type": "application/json" })
                .send()

            const res = await response.json<{ error: string }>()

            expect(res.error).toBe(authResponsesMessages.noUser);
        });

        it("Should fail to sign in because of a missing field", async () => {
            const request = new MechaTester(returnedUserCredentials.email);

            const signInInput = {
                email: returnedUserCredentials.email,
                password: returnedUserCredentials.password
            };

            const response = await request.post(endpoint)
                .json(signInInput)
                .headers({ "Content-Type": "application/json" })
                .send()

            const res = await response.json<{ error: string }>()

            expect(res.error).toMatch(/signingMethod/g);
            expect(res.error).toMatch(/Required/g);
        });

        it("Should succeed to sign in because of the correct credentials", async () => {
            await insertUserIntoDB({ db, user: testingUserCredentials });

            const request = new MechaTester(testingUserCredentials.email);
            const response = await request.post(endpoint)
                .json(testingUserCredentials)
                .headers({ "Content-Type": "application/json" })
                .send()

            const res = await response.json<{ result: object }>();

            expect(res.result).toMatchObject({
                name: testingUserCredentials.username,
                email: testingUserCredentials.email,
                avatar: null
            });
        });
    });
};
