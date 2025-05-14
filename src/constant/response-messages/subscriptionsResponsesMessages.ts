const subscriptionsResponsesMessages = {
    unknownPlan: (subscriptionPlan: string) => `Unknown subscription plan! (${subscriptionPlan})`,
    failedSessionCreation: "Failed to create the subscription session",
    missingPlan: "The subscription plan is missing!",
    cannotSubscribeToFreePlan: "You cannot subscribe to the free plan",
    noSessionId: "No session id provided",
    alreadySubscribed: (subscriptionPlan: string) => "You are already subscribed to this plan: " + subscriptionPlan
}

export default subscriptionsResponsesMessages