import parsedEnvVariables from "../configurations/parseEnvironmentVariables.ts";

export const plans: Plan[] = [
    {
        planName: "Free",
        maxAgentsCount: 1,
        maxApiKeysCount: 1,
        maxInferencesPerDay: 30,
        subscriptionCostPerMonth: 0,
        priceId: ""
    },
    {
        planName: "Pro",
        maxAgentsCount: 5,
        maxApiKeysCount: 5,
        maxInferencesPerDay: 240,
        subscriptionCostPerMonth: 4.99,
        priceId: parsedEnvVariables.PRO_SUBSCRIPTION_PRICE_ID as string
    },
] 