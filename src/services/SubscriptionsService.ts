import { StripePaymentGatewayClient } from "../configurations/stripePaymentGatewayClient.ts";
import Stripe from "stripe";

export class SubscriptionsService {
    constructor(
        private stripePaymentGatewayClient: StripePaymentGatewayClient,
        private kvStoreClient: Deno.Kv,
    ) { }

    async createSubscriptionSession(userEmail: string, plan: Plan) {
        const stripeCustomerId = await this.stripePaymentGatewayClient.getCustomerId(userEmail);
        const session = await this.stripePaymentGatewayClient.createSubscriptionSession(
            stripeCustomerId,
            plan,
        )

        return {
            success: true,
            session,
            samePlan: false,
        }
    }

    async onCheckoutSuccess(userEmail: string, sessionId: string) {
        if (await this.stripePaymentGatewayClient.verifyCheckoutSession(sessionId)) {
            const { value } = await this.kvStoreClient.get<string>(["stripe", "customers", userEmail]);
            if (value) {
                await this.stripePaymentGatewayClient.syncCustomerSubscription(value);
            }
            return true
        }
        return false
    }

    async getUserSubscriptionData(userEmail: string) {
        const customerId = await this.kvStoreClient.get<string>(["stripe", "customers", userEmail])
        if (customerId.value) {
            const subscription = await this.kvStoreClient.get<CustomerSubscription>(["stripe", "subscriptions", customerId.value])
            if (subscription.value && subscription.value.status != "none") {
                return subscription.value
            }
        }
        return null
    }

    async deactivateSubscription(userEmail: string) {
        const subscription = await this.getUserSubscriptionData(userEmail)
        if (subscription) {
            return await this.stripePaymentGatewayClient.updateSubscriptionCancelationAtEnd(
                subscription.subscriptionId!, true
            );
        }
        return false
    }

    async activateSubscription(userEmail: string) {
        const subscription = await this.getUserSubscriptionData(userEmail)
        if (subscription) {
            return await this.stripePaymentGatewayClient.updateSubscriptionCancelationAtEnd(
                subscription.subscriptionId!, false
            );
        }
        return false
    }

    verifyWebhookSigning(body: string, signature: string) {
        return this.stripePaymentGatewayClient.verifyWebhookSigning(body, signature)
    }

    stripeWebhookEventProcessing(event: Stripe.Event) {
        return this.stripePaymentGatewayClient.processEvent(event)
    }
}
