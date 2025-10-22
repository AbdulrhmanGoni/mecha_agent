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

    async onCheckoutSuccess(c: Context<{ Variables: { userEmail: string } }>) {
        const userEmail = c.get("userEmail");
        const sessionId = c.req.query("id") as string;
        const result = await this.subscriptionsService.onCheckoutSuccess(userEmail, sessionId);
        return c.json({ result });
    }

    async deactivateSubscription(c: Context<{ Variables: { userEmail: string } }>) {
        const userEmail = c.get("userEmail");

        const result = await this.subscriptionsService.deactivateSubscription(userEmail);
        if (result) {
            return c.json({ result: subscriptionsResponsesMessages.successfulSubscriptionDeactivation });
        } else {
            throw new HTTPException(400, { message: subscriptionsResponsesMessages.subscriptionDeactivationFailed })
        }
    }

    async activateSubscription(c: Context<{ Variables: { userEmail: string } }>) {
        const userEmail = c.get("userEmail");

        const result = await this.subscriptionsService.activateSubscription(userEmail);
        if (result) {
            return c.json({ result: subscriptionsResponsesMessages.successfulSubscriptionActivation });
        } else {
            throw new HTTPException(400, { message: subscriptionsResponsesMessages.subscriptionDeactivationFailed })
        }
    }

    async stripeWebhookHandler(c: Context) {
        const signature = c.req.header('stripe-signature') as string;
        const req = c.req.raw;

        try {
            const event = await this.subscriptionsService.verifyWebhookSigning(await req.text(), signature);
            await this.subscriptionsService.stripeWebhookEventProcessing(event)
            return c.text('Received', 200);
        } catch (err) {
            throw new Error("Webhook signature verification failed: " + (err as Error).message);
        }
    }
}