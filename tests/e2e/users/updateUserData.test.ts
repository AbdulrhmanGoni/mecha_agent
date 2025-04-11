import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { MechaTester } from "../../helpers/mechaTester.ts";
import { Client as PostgresClient } from "deno.land/x/postgres";
import { testingUserCredentials } from "../../mock/data/mockUsers.ts";
import insertUserIntoDB from "../../helpers/insertUserIntoDB.ts";
import usersResponsesMessages from "../../../src/constant/response-messages/usersResponsesMessages.ts";
// @deno-types="minio/dist/esm/minio.d.mts"
import { Client as MinioClient } from "minio";
import { uuidMatcher } from "../../helpers/uuidMatcher.ts";

export default function updateUserDataTests({ db, objectStorage }: { db: PostgresClient, objectStorage: MinioClient }) {
    const endpoint = "/api/users";

    describe(`Testing 'PATCH ${endpoint}' route`, () => {
        const avatarsToDelete: string[] = []

        beforeAll(async () => {
            await insertUserIntoDB({ db, user: testingUserCredentials })
        })

        afterAll(async () => {
            await db.queryObject`DELETE FROM users`;

            if (avatarsToDelete.length) {
                await objectStorage.removeObjects(
                    "users-avatars",
                    avatarsToDelete.map((avatarId) => ({ name: avatarId }))
                )
            }
        })

        it("Should fail to update user data because the update data payload is empty", async () => {
            const request = new MechaTester(testingUserCredentials.email);
            const response = await request.patch(endpoint)
                .body(new FormData())
                .send()

            const res = await response.json<{ error: string }>()

            expect(res.error).toBe(usersResponsesMessages.noUpdateData);
        });

        it("Should succeed to update the name of the user", async () => {
            const request = new MechaTester(testingUserCredentials.email);

            const updateFormData = new FormData();
            updateFormData.set("username", "New usaername");

            const response = await request.patch(endpoint)
                .body(updateFormData)
                .send()

            const { result } = await response.json<{ result: string }>()

            expect(result).toBe(usersResponsesMessages.successfulUpdate);

            const { rows: [updatedUser] } = await db.queryObject<{ username: string }>(
                `SELECT username FROM users WHERE email = $1`,
                [testingUserCredentials.email]
            )

            expect(updatedUser.username).toBe(updateFormData.get("username"));
        });

        it("Should succeed to update user's avatar", async () => {
            const request = new MechaTester(testingUserCredentials.email);

            const avatarFileURL = import.meta.resolve("../../mock/media/fake-avatar.png")
            const avatarFile = new Blob(
                [Deno.readFileSync(avatarFileURL.replace("file://", ""))],
                { type: "image/png" }
            );

            const updateFormData = new FormData();
            updateFormData.set("newAvatar", avatarFile);

            const response = await request.patch(endpoint)
                .body(updateFormData)
                .send()

            const { result } = await response.json<{ result: string }>()

            expect(result).toBe(usersResponsesMessages.successfulUpdate);

            const { rows: [updatedUser] } = await db.queryObject<{ avatar: string }>(
                `SELECT avatar FROM users WHERE email = $1`,
                [testingUserCredentials.email]
            )

            if (updatedUser.avatar) avatarsToDelete.push(updatedUser.avatar);

            expect(updatedUser.avatar.split(".")[0]).toMatch(uuidMatcher);
        });
    });
};
