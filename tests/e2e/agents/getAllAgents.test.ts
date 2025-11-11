import { afterAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { Client as PostgresClient } from "deno.land/x/postgres";
import { MechaTester } from "../../helpers/mechaTester.ts";
import { testingUserCredentials } from "../../mock/data/mockUsers.ts";
import insertUserIntoDB from "../../helpers/insertUserIntoDB.ts";
import insertAgentsIntoDB from "../../helpers/insertAgentsIntoDB.ts";
import mockAgents from "../../mock/data/mockAgents.ts";
import { uuidMatcher } from "../../helpers/uuidMatcher.ts";

export default function getAllAgents({ db }: { db: PostgresClient }) {
    const endpoint = "/api/agents";

    describe("Testing `GET /api/agents` endpoint", () => {
        afterAll(async () => {
            await db.queryObject`DELETE FROM users;`;
        })

        it("Should get an empty array because the existing user has no agents", async () => {
            await insertUserIntoDB({ db, user: testingUserCredentials })

            const request = new MechaTester(testingUserCredentials.email);

            const response = await request.get(endpoint).send();
            const { result } = await response.json<{ result: Agent[] }>();

            expect(result).toBeInstanceOf(Array);
            expect(result).toHaveLength(0);
        });

        it("Should get an array of user's agents", async () => {
            expect.assertions(2 + mockAgents.length);
            await insertAgentsIntoDB({
                db,
                agents: mockAgents.map((a) => ({
                    agentName: a.agentName,
                    description: a.description,
                    userEmail: testingUserCredentials.email
                }))
            });

            const request = new MechaTester(testingUserCredentials.email);

            const response = await request.get(endpoint).send();
            const { result } = await response.json<{ result: Agent[] }>();

            expect(result).toBeInstanceOf(Array);
            expect(result).toHaveLength(mockAgents.length);
            result.forEach((agent) => {
                expect(agent).toMatchObject({
                    id: expect.stringMatching(uuidMatcher),
                    userEmail: testingUserCredentials.email,
                    agentName: expect.any(String),
                    description: expect.any(String),
                    createdAt: expect.any(String),
                })
            })
        });
    })
};
