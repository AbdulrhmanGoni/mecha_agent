
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

