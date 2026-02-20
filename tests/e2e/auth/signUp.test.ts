import { afterAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { MechaTester } from "../../helpers/mechaTester.ts";
import type { JwtService } from "../../../src/services/JwtService.ts";
import { Client as PostgresClient } from "deno.land/x/postgres";
import { testingUserCredentials } from "../../mock/data/mockUsers.ts";
import authResponsesMessages from "../../../src/constant/response-messages/authResponsesMessages.ts";

export default function signUpTests({ db }: { db: PostgresClient }) {
    const endpoint = "/api/auth/sign-up";

    describe(`Testing 'POST ${endpoint}' route`, () => {
        afterAll(async () => {
            await db.queryObject`DELETE FROM users`;
        })

        it("Should return validation error because of the a short password", async () => {
            const request = new MechaTester(testingUserCredentials.email);

            const signUpInput = {
                ...testingUserCredentials,
                password: "tsp",
            };

            const response = await request.post(endpoint)
                .json(signUpInput)
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
                .send()

            const res = await response.json<{ error: string }>()

            expect(res.error).toMatch(/signingMethod/g);
            expect(res.error).toMatch(/Required/g);
        });

        it("Should succeed to sign up because of the correct credentials", async () => {
            const request = new MechaTester(testingUserCredentials.email);

            const response = await request.post(endpoint)
                .json(testingUserCredentials)
                .send()

            const res = await response.json<{ result: ReturnType<JwtService["generateJwt"]> }>()

            expect(res.result).toMatchObject({
                name: testingUserCredentials.username,
                email: testingUserCredentials.email,
                avatar: null,
            });
        });

        it("Should fail to sign up because the user is already existing", async () => {
            const request = new MechaTester(testingUserCredentials.email);

            const response = await request.post(endpoint)
                .json(testingUserCredentials)
                .send()

            const res = await response.json<{ error: string }>()

            expect(res.error).toBe(authResponsesMessages.userAlreadyExisting);
        });

        it("Should succeed sign in because the user is already existing and using 'signing-existing-user' query parameter", async () => {
            const request = new MechaTester(testingUserCredentials.email);

            const response = await request.post(endpoint + "?signing-existing-user=yes")
                .json(testingUserCredentials)
                .send()

            const res = await response.json<{ result: object }>()

            expect(res.result).toMatchObject({
                name: testingUserCredentials.username,
                email: testingUserCredentials.email,
                avatar: null,
            });
        });
    });
};
