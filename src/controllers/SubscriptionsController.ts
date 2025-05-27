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

    async cancelSubscription(c: Context<{ Variables: { userEmail: string } }>) {
        const userEmail = c.get("userEmail");

        const result = await this.subscriptionsService.cancelSubscription(userEmail);
        if (result) {
            return c.json({ result: subscriptionsResponsesMessages.successfulSubscriptionCancelation });
        } else {
            return c.json({ error: subscriptionsResponsesMessages.notSubscribed }, 400);
        }
    }

    async activateSubscription(c: Context<{ Variables: { userEmail: string } }>) {
        const userEmail = c.get("userEmail");

        const result = await this.subscriptionsService.activateSubscription(userEmail);
        if (result) {
            return c.json({ result: subscriptionsResponsesMessages.successfulSubscriptionActivation });
        } else {
            return c.json({ error: subscriptionsResponsesMessages.notSubscribed }, 400);
        }
    }

    async stripeWebhookHandler(c: Context) {
        const signature = c.req.header('stripe-signature') as string;
        const req = c.req.raw;

        try {
            const event = await this.subscriptionsService.verifyWebhookSigning(await req.text(), signature);
            switch (event.type) {
                case 'invoice.payment_succeeded': {
                    const subscriptionId = event.data.object.lines.data[0]?.parent?.subscription_item_details?.subscription
                    const customerId = event.data.object.customer
                    const userEmail = event.data.object.customer_email
                    if (userEmail && customerId && subscriptionId) {
                        await this.subscriptionsService.createSubscription(userEmail, customerId.toString(), subscriptionId)
                    }
                    break;
                }

                case 'invoice.payment_failed': {
                    const customerId = event.data.object.customer
                    if (customerId) {
                        await this.subscriptionsService.deleteSubscription(customerId.toString());
                    }
                    break;
                }

                case 'customer.subscription.deleted': {
                    const customerId = event.data.object.customer
                    if (customerId) {
                        this.subscriptionsService.deleteSubscription(customerId.toString());
                    }
                    break;
                }

                default: console.warn('Unhandled stripe event:', event.type)
            }

            return c.text('Received', 200);
        } catch (err) {
            throw new Error("Webhook signature verification failed: " + (err as Error).message);
        }
    }
}