import Stripe from "stripe";
import { StripePaymentGatewayClient } from "../../../src/configurations/stripePaymentGatewayClient.ts";

export class MockPaymentGatewayClient extends StripePaymentGatewayClient {
    constructor(private _stripe: Stripe, private _kv: Deno.Kv) {
        super(_stripe, _kv)
    }

    override getCustomerId(_userEmail: string) {
        return Promise.resolve("Customer Id")
    }

    override updateSubscriptionCancelationAtEnd(_subscriptionId: string, _value: boolean) {
        return Promise.resolve(true)
    }

    override verifyCheckoutSession(_sessionId: string) {
        return Promise.resolve(true)
    }

    override syncCustomerSubscription(_customerId: string) {
        return Promise.resolve({ status: "none" })
    }

    override processEvent(_event: Stripe.Event) {
        return Promise.resolve({ status: "none" })
    }

    override createSubscriptionSession(_userEmail: string, _plan: Plan) {
        return Promise.resolve({
            url: "http://localhost/checkout",
        })
    }

    override verifyWebhookSigning(_body: string, _signature: string) {
        // deno-lint-ignore no-explicit-any
        return Promise.resolve({} as any)
    }
}