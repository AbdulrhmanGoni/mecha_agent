import Stripe from "stripe";
import parsedEnvVariables from "./parseEnvironmentVariables.ts";

export class StripePaymentGatewayClient {
    constructor(private stripe: Stripe, private kv: Deno.Kv) {
        if (parsedEnvVariables.ENVIRONMENT !== "testing") {
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

    async getCustomerId(userEmail: string) {
        const customerRecordKey = ["stripe", "customers", userEmail];
        const customerRecord = await this.kv.get<string>(customerRecordKey);
        if (customerRecord.value) {
            return customerRecord.value
        }

        const newCustomer = await this.stripe.customers.create({
            email: userEmail,
        });

        await this.kv.set(customerRecordKey, newCustomer.id);
        return newCustomer.id
    }

    async createSubscriptionSession(stripeCustomerId: string, plan: Plan) {
        const session = await this.stripe.checkout.sessions.create({
            customer: stripeCustomerId,
            mode: "subscription",
            payment_method_types: ["card"],
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
    }

    async updateSubscriptionCancelationAtEnd(subscriptionId: string, value: boolean) {
        const updatedSubscription = await this.stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: value,
        });
        return updatedSubscription.cancel_at_period_end === value
    }

    async verifyWebhookSigning(body: string, signature: string) {
        return await this.stripe.webhooks.constructEventAsync(
            body,
            signature,
            parsedEnvVariables.STRIPE_WEBHOOK_SECRET as string
        );
    }

    async verifyCheckoutSession(sessionId: string) {
        try {
            const session = await this.stripe.checkout.sessions.retrieve(sessionId);
            return !!session.id
        } catch (e) {
            const error = e as Stripe.errors.StripeError
            throw new Error(`Stripe Error${error.statusCode ? ` (${error.statusCode})` : ""}: ${error.message}`)
        }
    }

    private async saveCustomerSubscription(customerId: string, subscription: Stripe.Subscription) {
        const customerSubscriptionKey = ["stripe", "subscriptions", customerId];

        if (!subscription) {
            const subData = { status: "none" };
            await this.kv.set(customerSubscriptionKey, subData);
            return subData;
        }

        const subData: CustomerSubscription = {
            subscriptionId: subscription.id,
            status: subscription.status,
            priceId: subscription.items.data[0].price.id,
            planName: subscription.metadata.plan,
            currentPeriodEnd: subscription.items.data[0].current_period_end,
            currentPeriodStart: subscription.items.data[0].current_period_start,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            paymentMethod:
                subscription.default_payment_method &&
                    typeof subscription.default_payment_method !== "string"
                    ? {
                        brand: subscription.default_payment_method.card?.brand ?? null,
                        last4: subscription.default_payment_method.card?.last4 ?? null,
                    }
                    : null,
        };

        await this.kv.set(customerSubscriptionKey, subData);
        return subData;
    }

    async syncCustomerSubscription(customerId: string) {
        const subscriptions = await this.stripe.subscriptions.list({
            customer: customerId,
            limit: 1,
            status: "all",
            expand: ["data.default_payment_method"],
        });

        return this.saveCustomerSubscription(customerId, subscriptions.data[0])
    }

    async processEvent(event: Stripe.Event) {
        if (!this.allowedEvents.includes(event.type)) return;

        const { customer: customerId } = event?.data?.object as {
            customer: string;
        };

        if (typeof customerId !== "string") {
            throw new Error(
                `Customer ID isn't string.\nEvent type: ${event.type}`
            );
        }

        return await this.syncCustomerSubscription(customerId);
    }

    private allowedEvents = [
        "checkout.session.completed",
        "customer.subscription.created",
        "customer.subscription.updated",
        "customer.subscription.deleted",
        "customer.subscription.paused",
        "customer.subscription.resumed",
        "customer.subscription.pending_update_applied",
        "customer.subscription.pending_update_expired",
        "customer.subscription.trial_will_end",
        "invoice.paid",
        "invoice.payment_failed",
        "invoice.payment_action_required",
        "invoice.upcoming",
        "invoice.marked_uncollectible",
        "invoice.payment_succeeded",
        "payment_intent.succeeded",
        "payment_intent.payment_failed",
        "payment_intent.canceled",
    ];
}
