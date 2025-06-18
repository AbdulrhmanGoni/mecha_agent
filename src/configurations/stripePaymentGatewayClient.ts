import Stripe from "stripe";
import parsedEnvVariables from "./parseEnvironmentVariables.ts";

export class StripePaymentGatewayClient implements PaymentGatewayClientInterface {
    constructor(private stripe: Stripe) {
        if (parsedEnvVariables.DENO_ENV !== "testing") {
            if (!parsedEnvVariables.PRO_SUBSCRIPTION_PRICE_ID) {
                throw new Error("'PRO_SUBSCRIPTION_PRICE_ID' environment variable is missing");
            }

            if (!parsedEnvVariables.STRIPE_WEBHOOK_SECRET) {
                throw new Error("'STRIPE_WEBHOOK_SECRET' environment variable is missing");
            }

            if (!parsedEnvVariables.SUCCESSFUL_SUBSCRIPTION_REDIRECT_URL) {
                throw new Error("'SUCCESSFUL_SUBSCRIPTION_REDIRECT_URL' environment variable is missing");
            }

            if (!parsedEnvVariables.CANCEL_SUBSCRIPTION_REDIRECT_URL) {
                throw new Error("'CANCEL_SUBSCRIPTION_REDIRECT_URL' environment variable is missing");
            }
        }
    }

    async createSubscriptionSession(userEmail: string, plan: Plan) {
        try {
            const session = await this.stripe.checkout.sessions.create({
                mode: "subscription",
                payment_method_types: ["card"],
                customer_email: userEmail,
                subscription_data: { metadata: { plan: plan.planName } },
                line_items: [
                    {
                        price: plan.priceId,
                        quantity: 1,
                    },
                ],
                success_url: `${parsedEnvVariables.SUCCESSFUL_SUBSCRIPTION_REDIRECT_URL}?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${parsedEnvVariables.CANCEL_SUBSCRIPTION_REDIRECT_URL}`,
            });

            return {
                url: session.url,
            }
        } catch (e) {
            const error = e as Stripe.errors.StripeError
            throw `Stripe Error${error.statusCode ? ` (${error.statusCode})` : ""}: ${error.message}`
        }
    }

    private async updateSubscriptionCancelationAtEnd(subscriptionId: string, value: boolean) {
        const updatedSubscription = await this.stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: value,
        });
        return updatedSubscription.cancel_at_period_end === value
    }

    async deactivateSubscription(subscriptionId: string) {
        return await this.updateSubscriptionCancelationAtEnd(subscriptionId, true)
    }

    async activateSubscription(subscriptionId: string) {
        return await this.updateSubscriptionCancelationAtEnd(subscriptionId, false)
    }

    async verifyCheckoutSessionExistence(sessionId: string) {
        try {
            const session = await this.stripe.checkout.sessions.retrieve(sessionId);
            return !!session.id
        } catch (e) {
            const error = e as Stripe.errors.StripeError
            throw new Error(`Stripe Error${error.statusCode ? ` (${error.statusCode})` : ""}: ${error.message}`)
        }
    }

    async verifyWebhookSigning(body: string, signature: string) {
        return await this.stripe.webhooks.constructEventAsync(
            body,
            signature,
            parsedEnvVariables.STRIPE_WEBHOOK_SECRET as string
        );
    }
}
