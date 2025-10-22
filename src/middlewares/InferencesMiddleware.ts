import { Context, Next } from "hono";
import chatsResponsesMessages from "../constant/response-messages/chatsResponsesMessages.ts";
import { plans } from "../constant/plans.ts";
import { SubscriptionsService } from "../services/SubscriptionsService.ts";

export class InferencesMiddleware {
    constructor(
        private kvStoreClient: Deno.Kv,
        private subscriptionsService: SubscriptionsService
    ) { }

    async trackInferences(c: Context<{ Variables: { userEmail: string, apiKeyId: string, noInference: boolean } }, never, never>, next: Next) {
        const userEmail = c.get("userEmail");

        const inferencesRecord = await this.kvStoreClient.get<bigint>(["inferences", userEmail]);
        if (inferencesRecord.value) {
            const subscription = await this.subscriptionsService.getUserSubscriptionData(userEmail);
            const userPlan = plans.find((p) => p.planName === subscription?.planName) || plans[0];

            if (inferencesRecord.value >= userPlan.maxInferencesPerDay) {
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

        await this.kvStoreClient
            .atomic()
            .sum(inferencesRecord.key, 1n)
            .commit();
    };
}
