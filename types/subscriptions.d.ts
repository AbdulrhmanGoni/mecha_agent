
type Plan = {
    planName: "Free" | "Pro"
    maxPublishedAgentsCount: number,
    maxInferencesPerDay: number,
    subscriptionCostPerMonth: number,
    priceId: string
}

type Subscription = {
    customer_id: string,
    subscription_id: string,
    userEmail: string,
    plan: Plan["planName"],
    created_at: Date,
}

interface PaymentGatewayClientInterface {
    createSubscriptionSession(userEmail: string, plan: Plan): Promise<{ url: string | null }>;
    deactivateSubscription(subscriptionId: string): Promise<boolean>;
    activateSubscription(subscriptionId: string): Promise<boolean>;
    verifyCheckoutSessionExistence(sessionId: string): Promise<boolean>;
    verifyWebhookSigning(body: string, signature: string): Promise<import("stripe").Stripe.Event>;
}
