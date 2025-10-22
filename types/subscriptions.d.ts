
type Plan = {
    planName: "Free" | "Pro"
    maxPublishedAgentsCount: number,
    maxInferencesPerDay: number,
    subscriptionCostPerMonth: number,
    priceId: string
}

type CustomerSubscription = { status: "none" } |
{
    subscriptionId: string | null;
    status: import("stripe").Stripe.Subscription.Status;
    priceId: string | null;
    planName: string;
    currentPeriodStart: number | null;
    currentPeriodEnd: number | null;
    cancelAtPeriodEnd: boolean;
    paymentMethod: {
        brand: string | null;
        last4: string | null;
    } | null;
};