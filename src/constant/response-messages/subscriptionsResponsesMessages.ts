const subscriptionsResponsesMessages = {
    successfulSubscriptionCancelation: "Your subscription has been canceled successfully",
    successfulSubscriptionActivation: "Your subscription has been activated successfully",
    unknownPlan: (subscriptionPlan: string) => `Unknown subscription plan! (${subscriptionPlan})`,
    failedSessionCreation: "Failed to create the subscription session",
    missingPlan: "The subscription plan is missing!",
    notSubscribed: "You are not subscribed!",
    cannotSubscribeToFreePlan: "You cannot subscribe to the free plan",
    noSessionId: "No session id provided",
    alreadySubscribed: (subscriptionPlan: string) => "You are already subscribed to this plan: " + subscriptionPlan
}

export default subscriptionsResponsesMessages