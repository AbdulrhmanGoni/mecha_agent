import { Context, Next } from "hono";
import { Client as PostgresClient } from "deno.land/x/postgres";
import chatsResponsesMessages from "../constant/response-messages/chatsResponsesMessages.ts";
import { plans } from "../constant/plans.ts";

export class InferencesMiddleware {
    constructor(
        private kvStoreClient: Deno.Kv,
        private databaseClient: PostgresClient,
    ) { }

    async trackInferences(c: Context<{ Variables: { userEmail: string, apiKeyId: string, noInference: boolean } }, never, never>, next: Next) {
        const userEmail = c.get("userEmail");

        let inferences: Deno.KvEntry<bigint> | null = null;
        const iterator = this.kvStoreClient.list<bigint>({ prefix: ["inferences", userEmail] }, { limit: 1 });
        for await (const userIncerencesRecord of iterator) {
            inferences = userIncerencesRecord
        }

        if (inferences) {
            const userPlan = plans.find((p) => p.planName === inferences.key[2]) || plans[0];

            if (inferences.value >= userPlan.maxInferencesPerDay) {
                return c.json({ error: chatsResponsesMessages.inferencesLimitReached }, 429)
            }
        }

        await next();

        if (c.get("noInference")) {
            return
        }

        if (c.res.status > 299 && c.res.status < 200) {
            return
        }

        if (inferences) {
            await this.kvStoreClient
                .atomic()
                .sum(inferences.key, 1n)
                .commit();
        } else {
            const { rows: [user] } = await this.databaseClient.queryObject<Pick<User, "currentPlan">>({
                text: `SELECT current_plan FROM users WHERE email = $1`,
                args: [userEmail],
                camelCase: true
            })

            await this.kvStoreClient
                .atomic()
                .sum(["inferences", userEmail, user.currentPlan], 1n)
                .commit();
        }
    };
}
