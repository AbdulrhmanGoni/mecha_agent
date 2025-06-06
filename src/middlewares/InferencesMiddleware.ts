import { Context, Next } from "hono";
import { Client as PostgresClient } from "deno.land/x/postgres";
import chatsResponsesMessages from "../constant/response-messages/chatsResponsesMessages.ts";
import { plans } from "../constant/plans.ts";
import { kvStoreClient } from "../configurations/denoKvStoreClient.ts";

export class InferencesMiddleware {
    constructor(
        private kvStoreClient: Deno.Kv,
        private databaseClient: PostgresClient,
    ) {
        this.kvStoreClient.listenQueue((msg) => {
            if (msg.task === "reset-users-inferences-rate-limits") {
                this.resetUsersInferencesRateLimits()
            }
        });
    }

    async trackInferences(c: Context<{ Variables: { userEmail: string, apiKeyId: string } }, never, never>, next: Next) {
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

    async resetUsersInferencesRateLimits() {
        for await (const record of this.kvStoreClient.list<bigint>({ prefix: ["inferences"] })) {
            this.setLastWeekInferencesRecording(record.key[1] as string, record.value)
            await this.kvStoreClient.set(record.key, new Deno.KvU64(0n))
        }
    }

    private async setLastWeekInferencesRecording(userEmail: string, todayValue: bigint) {
        const record = await this.kvStoreClient.get<number[]>(["last-week-inferences", userEmail])
        if (record.value) {
            record.value.pop()
            record.value.unshift(Number(todayValue))
            await this.kvStoreClient.set(["last-week-inferences", userEmail], record.value)
        } else {
            await this.kvStoreClient.set(["last-week-inferences", userEmail], [Number(todayValue), 0, 0, 0, 0, 0, 0])
        }
    }
}

Deno.cron("Reset users inferences rate limits", "0 0 * * *", () => {
    kvStoreClient.enqueue({ task: "reset-users-inferences-rate-limits" });
});
