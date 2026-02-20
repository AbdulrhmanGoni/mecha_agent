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
                .send()

            const res = await response.json<{ result: object }>();

            expect(res.result).toMatchObject({
                name: testingUserCredentials.username,
                email: testingUserCredentials.email,
                avatar: null
            });
        });

        it("Should fail to sign in because of too many tries", async () => {
            const user = {
                email: `${crypto.randomUUID()}@example.com`,
                password: "password123",
                username: "limiteduser",
                signingMethod: "credentials"
            };

            await insertUserIntoDB({ db, user });

            // Try to sign in 10 times with WRONG password
            for (let i = 0; i < 10; i++) {
                const response = await new MechaTester(user.email).post(endpoint)
                    .json({ ...user, password: "wrong-password" })
                    .send();

                const res = await response.json<{ error: string }>();
                expect(res.error).toBe(authResponsesMessages.wrongCredentials);
            }

            // The 11th attempt should fail with "Too Many Tries" error
            const response1 = await new MechaTester(user.email).post(endpoint)
                .json({ ...user, password: "another-wrong-password" })
                .send();

            const res1 = await response1.json<{ error: string }>();
            expect(res1.error).toBe(authResponsesMessages.tooManyTries);

            // Should also fail with "Too Many Tries" error even if the password is CORRECT
            const response2 = await new MechaTester(user.email).post(endpoint)
                .json(user)
                .send();

            const res2 = await response2.json<{ error: string }>();
            expect(res2.error).toBe(authResponsesMessages.tooManyTries);
        });
    });
};
