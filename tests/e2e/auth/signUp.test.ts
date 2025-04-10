import { afterAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { MechaTester } from "../../helpers/mechaTester.ts";
import { Client as PostgresClient } from "deno.land/x/postgres";
import { testingUserCredentials } from "../../mock/data/mockUsers.ts";

export default function signUpTests({ db }: { db: PostgresClient }) {
    const endpoint = "/api/auth/sign-up";

    describe(`Testing 'POST ${endpoint}' route`, () => {
        afterAll(async () => {
            await db.queryObject`DELETE FROM users WHERE 1 = 1`;
        })

        it("Should return validation error because of the a short password", async () => {
            const request = new MechaTester(testingUserCredentials.email);

            const signUpInput = {
                ...testingUserCredentials,
                password: "tsp",
            };

            const response = await request.post(endpoint)
                .json(signUpInput)
                .headers({ "Content-Type": "application/json" })
                .send()

            const res = await response.json<{ error: string }>()

            expect(res.error).toMatch(/password/g);
        });

        it("Should return validation error because of the invalid email", async () => {
            const request = new MechaTester(testingUserCredentials.email);

            const signUpInput = {
                ...testingUserCredentials,
                email: "gmail.com",
            };

            const response = await request.post(endpoint)
                .json(signUpInput)
                .headers({ "Content-Type": "application/json" })
                .send()

            const res = await response.json<{ error: string }>()

            expect(res.error).toMatch(/email/g);
        });

        it("Should return validation error because of a missing field", async () => {
            const request = new MechaTester(testingUserCredentials.email);

            const signUpInput = {
                ...testingUserCredentials,
                signingMethod: undefined,
            };

            const response = await request.post(endpoint)
                .json(signUpInput)
                .headers({ "Content-Type": "application/json" })
                .send()

            const res = await response.json<{ error: string }>()

            expect(res.error).toMatch(/signingMethod/g);
            expect(res.error).toMatch(/Required/g);
        });
    });
};
