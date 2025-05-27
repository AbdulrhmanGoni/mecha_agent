
type Plan = {
    planName: "Free" | "Pro"
    maxAgentsCount: number,
    maxApiKeysCount: number,
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
    createSubscriptionSession(userEmail: string, priceId: string): Promise<{ url: string | null }>;
    cancelSubscription(subscriptionId: string): Promise<boolean>;
    activateSubscription(subscriptionId: string): Promise<boolean>;
    verifyCheckoutSessionExistence(sessionId: string): Promise<boolean>;
    verifyWebhookSigning(body: string, signature: string): Promise<import("stripe").Stripe.Event>;
}
