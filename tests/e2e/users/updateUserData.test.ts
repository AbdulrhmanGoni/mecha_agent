import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { MechaTester } from "../../helpers/mechaTester.ts";
import { Client as PostgresClient } from "deno.land/x/postgres";
import { testingUserCredentials } from "../../mock/data/mockUsers.ts";
import insertUserIntoDB from "../../helpers/insertUserIntoDB.ts";
import usersResponsesMessages from "../../../src/constant/response-messages/usersResponsesMessages.ts";

export default function updateUserDataTests({ db }: { db: PostgresClient }) {
    const endpoint = "/api/users";

    describe(`Testing 'PATCH ${endpoint}' route`, () => {
        beforeAll(async () => {
            await insertUserIntoDB({ db, user: testingUserCredentials })
        })

        afterAll(async () => {
            await db.queryObject`
                DELETE FROM users;
                DELETE FROM deleted_agents_avatars;
            `;
        })

        it("Should fail to update user data because the update data payload is empty", async () => {
            const request = new MechaTester(testingUserCredentials.email);
            const response = await request.patch(endpoint)
                .json({})
                .headers({ "Content-Type": "application/json" })
                .send()

            const res = await response.json<{ error: string }>()

            expect(res.error).toBe(usersResponsesMessages.noUpdateData);
        });

        it("Should succeed to update the name of the user", async () => {
            const request = new MechaTester(testingUserCredentials.email);

            const updateFormData = {
                username: "New usaername"
            }
            const response = await request.patch(endpoint)
                .json(updateFormData)
                .headers({ "Content-Type": "application/json" })
                .send()

            const { result } = await response.json<{ result: string }>()

            expect(result).toBe(usersResponsesMessages.successfulUpdate);

            const { rows: [updatedUser] } = await db.queryObject<{ username: string }>(
                `SELECT username FROM users WHERE email = $1`,
                [testingUserCredentials.email]
            )

            expect(updatedUser.username).toBe(updateFormData.username);
        });

        it("Should succeed to update user's avatar", async () => {
            const avatarFileURL = "http://fake-avatar.png"

            const request = new MechaTester(testingUserCredentials.email);
            const response = await request.patch(endpoint)
                .json({ avatar: avatarFileURL })
                .headers({ "Content-Type": "application/json" })
                .send()

            const { result } = await response.json<{ result: string }>()

            expect(result).toBe(usersResponsesMessages.successfulUpdate);

            const { rows: [updatedUser] } = await db.queryObject<{ avatar: string }>(
                `SELECT avatar FROM users WHERE email = $1`,
                [testingUserCredentials.email]
            )

            expect(updatedUser.avatar).toBe(avatarFileURL);
        });

        it("Should succeed to remove user's avatar", async () => {
            const request = new MechaTester(testingUserCredentials.email);
            const response = await request.patch(endpoint)
                .json({ removeAvatar: true })
                .headers({ "Content-Type": "application/json" })
                .send()

            const { result } = await response.json<{ result: string }>()

            expect(result).toBe(usersResponsesMessages.successfulUpdate);

            const { rows: [updatedUser] } = await db.queryObject<{ avatar: string }>(
                `SELECT avatar FROM users WHERE email = $1`,
                [testingUserCredentials.email]
            )

            expect(updatedUser.avatar).toBeFalsy();
        });
    });
};
