import parsedEnvVariables from "../configurations/parseEnvironmentVariables.ts";

export const plans: Plan[] = [
    {
        planName: "Free",
        maxPublishedAgentsCount: 1,
        maxInferencesPerDay: 30,
        subscriptionCostPerMonth: 0,
        priceId: ""
    },
    {
        planName: "Pro",
        maxPublishedAgentsCount: 5,
        maxInferencesPerDay: 240,
        subscriptionCostPerMonth: 4.99,
        priceId: parsedEnvVariables.PRO_SUBSCRIPTION_PRICE_ID as string
    },
] 