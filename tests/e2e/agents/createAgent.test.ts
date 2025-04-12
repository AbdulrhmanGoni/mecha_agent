import { it, afterAll, describe } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { getRandomMockNewAgentInput } from "../../mock/data/mockAgents.ts";
import AgentsResponseMessages from "../../../src/constant/response-messages/agentsResponsesMessages.ts";
import { MechaTester } from "../../helpers/mechaTester.ts";
import { Client as PostgresClient } from "deno.land/x/postgres";
import insertUserIntoDB from "../../helpers/insertUserIntoDB.ts";
import { fakeUserEmail, testingUserCredentials } from "../../mock/data/mockUsers.ts";
import { uuidLength, uuidMatcher } from "../../helpers/uuidMatcher.ts";
// @deno-types="minio/dist/esm/minio.d.mts"
import { Client as MinioClient } from "minio";

export default function createAgentTests(
    { db, objectStorage }: { db: PostgresClient, objectStorage: MinioClient }
) {
    const endpoint = "/api/agents";
    const avatarsToDelete: string[] = [];

    describe(`Testing 'POST ${endpoint}' endpoint`, () => {
        afterAll(async () => {
            await db.queryObject`
                DELETE FROM agents; 
                DELETE FROM users
            `;

            if (avatarsToDelete.length) {
                await objectStorage.removeObjects(
                    "agents-avatars",
                    avatarsToDelete.map((avatarId) => ({ name: avatarId }))
                )
            }
        });

        it("Should fail to create the agent because the user who creates it doesn't exist", async () => {
            const newAgent = getRandomMockNewAgentInput();

            const newAgentForm = new FormData();
            Object.entries(newAgent).forEach(([key, value]) => {
                newAgentForm.set(key, value)
            });

            const request = new MechaTester(fakeUserEmail);
            const response = await request.post(endpoint)
                .body(newAgentForm)
                .send()

            const { error } = await response.json<{ error: string }>();

            expect(error).toBe(AgentsResponseMessages.failedAgentCreation);
        });

        it("Should fail to create the agent because the missing required fields", async () => {
            const newAgent = getRandomMockNewAgentInput();

            const newAgentForm = new FormData();
            Object.entries(newAgent).forEach(([key, value]) => {
                if (key !== "agentName" && key !== "description") {
                    newAgentForm.set(key, value)
                }
            });

            const request = new MechaTester(fakeUserEmail);
            const response = await request.post(endpoint)
                .body(newAgentForm)
                .send()

            const { error } = await response.json<{ error: string }>();

            expect(error).toMatch(/Required/);
            expect(error).toMatch(/agentName/);
            expect(error).toMatch(/description/);
            expect(error).toMatch(/field/);
        });

        it("Should succeed to create a new agent", async () => {
            const newAgent = getRandomMockNewAgentInput();

            await insertUserIntoDB({ db, user: testingUserCredentials });

            const newAgentForm = new FormData();
            Object.entries(newAgent).forEach(([key, value]) => {
                newAgentForm.set(key, value)
            });

            const request = new MechaTester(testingUserCredentials.email);

            const response = await request.post(endpoint)
                .body(newAgentForm)
                .send()

            const { result } = await response.json<{ result: string }>();

            expect(result).toBe(AgentsResponseMessages.successfulAgentCreation);
        });

        it("Should fail to create the new agent because of the invalid avatar file type", async () => {
            const newAgent = getRandomMockNewAgentInput();

            const newAgentForm = new FormData();

            Object.entries(newAgent).forEach(([key, value]) => {
                newAgentForm.set(key, value)
            });

            const invalidAvatarFile = new Blob(
                [`{"anyfield": "any value"}`],
                { type: "application/json" }
            );

            newAgentForm.set("avatar", invalidAvatarFile);

            const request = new MechaTester(testingUserCredentials.email);

            const response = await request.post(endpoint)
                .body(newAgentForm)
                .send()

            const { error } = await response.json<{ error: string }>();

            expect(error).toMatch(/Not supported/g);
            expect(error).toMatch(/avatar/g);
            expect(error).toMatch(/type/g);
        });

        it("Should succeed to create a new agent with avatar", async () => {
            const user = { ...testingUserCredentials, email: "anotheruser@yahoo.com" }
            await insertUserIntoDB({ db, user });

            const newAgent = getRandomMockNewAgentInput();

            const newAgentForm = new FormData();

            Object.entries(newAgent).forEach(([key, value]) => {
                newAgentForm.set(key, value)
            });

            const avatarFileURL = import.meta.resolve("../../mock/media/fake-avatar.png")
            const avatarFile = new Blob(
                [Deno.readFileSync(avatarFileURL.replace("file://", ""))],
                { type: "image/png" }
            );

            newAgentForm.set("avatar", avatarFile);

            const request = new MechaTester(user.email);

            const response = await request.post(endpoint)
                .body(newAgentForm)
                .send()

            const { result } = await response.json<{ result: string }>();

            expect(result).toBe(AgentsResponseMessages.successfulAgentCreation);

            const { rows: [agent] } = await db.queryObject<Pick<Agent, "avatar">>({
                text: "SELECT avatar FROM agents WHERE user_email = $1",
                args: [user.email],
                camelCase: true
            })

            if (agent.avatar) {
                avatarsToDelete.push(agent.avatar)
            }

            expect(agent.avatar?.endsWith(".png")).toBe(true)
            expect(agent.avatar?.slice(0, uuidLength)).toMatch(uuidMatcher)
        });
    })
}
