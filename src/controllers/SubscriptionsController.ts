import { Context } from "hono";
import { SubscriptionsService } from "../services/SubscriptionsService.ts";
import { HTTPException } from "hono/http-exception";
import { plans } from "../constant/plans.ts";
import subscriptionsResponsesMessages from "../constant/response-messages/subscriptionsResponsesMessages.ts";

export class SubscriptionsController {
    constructor(
        private subscriptionsService: SubscriptionsService,
    ) { }

    getPlans(c: Context) {
        return c.json({ result: plans });
    }

    async createSubscriptionSession(c: Context<{ Variables: { userEmail: string } }>) {
        const userEmail = c.get("userEmail");
        const planName = c.req.query("plan");
        if (!planName) {
            throw new HTTPException(400, { message: subscriptionsResponsesMessages.missingPlan });
        }

        const chosenPlan = plans.find((p) => p.planName === planName)

        if (!chosenPlan) {
            throw new HTTPException(400, { message: subscriptionsResponsesMessages.unknownPlan(planName) });
        }

        if (chosenPlan.planName === "Free") {
            throw new HTTPException(400, { message: subscriptionsResponsesMessages.cannotSubscribeToFreePlan });
        }

        const { success, samePlan, session } = await this.subscriptionsService.createSubscriptionSession(
            userEmail,
            chosenPlan,
        );

        if (success && session?.url) {
            return c.json({ result: session });
        }

        if (samePlan) {
            return c.json({ error: subscriptionsResponsesMessages.alreadySubscribed(planName) }, 400);
        }

        throw new HTTPException(400, { message: subscriptionsResponsesMessages.failedSessionCreation })
    }

    async verifyCheckoutSessionExistence(c: Context<{ Variables: { userEmail: string } }>) {
        const sessionId = c.req.query("id");
        if (!sessionId) {
            throw new HTTPException(400, { message: subscriptionsResponsesMessages.noSessionId })
        }

        const isSessionExisting = await this.subscriptionsService.verifyCheckoutSessionExistence(sessionId);
        return c.json({ result: isSessionExisting });
    }
}