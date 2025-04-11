import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { MechaTester } from "../../helpers/mechaTester.ts";
import { Client as PostgresClient } from "deno.land/x/postgres";
import { testingUserCredentials } from "../../mock/data/mockUsers.ts";
import insertUserIntoDB from "../../helpers/insertUserIntoDB.ts";
import usersResponsesMessages from "../../../src/constant/response-messages/usersResponsesMessages.ts";
// @deno-types="minio/dist/esm/minio.d.mts"
import { Client as MinioClient } from "minio";

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
    });
};
