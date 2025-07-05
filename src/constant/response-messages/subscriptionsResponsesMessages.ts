const subscriptionsResponsesMessages = {
    successfulSubscriptionDeactivation: "Your subscription has been deactivated successfully",
    successfulSubscriptionActivation: "Your subscription has been activated successfully",
    subscriptionDeactivationFailed: "We couldn't deactivate your subscription, If you tried again and the erorr presists, Please contact us at our support email",
    subscriptionActivationFailed: "We couldn't activate your subscription, If you tried again and the erorr presists, Please contact us at our support email",
    unknownPlan: (subscriptionPlan: string) => `Unknown subscription plan! (${subscriptionPlan})`,
    failedSessionCreation: "Failed to create the subscription session",
    missingPlan: "The subscription plan is missing!",
    cannotSubscribeToFreePlan: "You cannot subscribe to the free plan",
    noSessionId: "No session id provided",
    alreadySubscribed: (subscriptionPlan: string) => "You are already subscribed to this plan: " + subscriptionPlan
}

export default subscriptionsResponsesMessages