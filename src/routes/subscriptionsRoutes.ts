import { Hono } from "hono";
import { GuardService } from "../services/GuardService.ts";
// import { readPermission, writePermission } from "../constant/permissions.ts";
import { SubscriptionsController } from "../controllers/SubscriptionsController.ts";

export default function subscriptionsRoutesBuilder(
    subscriptionsController: SubscriptionsController,
    _guardService: GuardService,
) {
    const subscriptionsRoutes = new Hono();

    subscriptionsRoutes.get(
        '/plans',
        subscriptionsController.getPlans.bind(subscriptionsController)
    );

    // subscriptionsRoutes.get(
    //     '/sessions/new',
    //     guardService.guardRoute({ permissions: [readPermission, writePermission] }),
    //     subscriptionsController.createSubscriptionSession.bind(subscriptionsController)
    // );

    // subscriptionsRoutes.get(
    //     '/sessions/verify-session',
    //     guardService.guardRoute({ permissions: [readPermission] }),
    //     subscriptionsController.verifyCheckoutSessionExistence.bind(subscriptionsController)
    // );

    // subscriptionsRoutes.post(
    //     '/webhook',
    //     subscriptionsController.stripeWebhookHandler.bind(subscriptionsController)
    // );

    // subscriptionsRoutes.delete(
    //     '/deactivate-subscription',
    //     guardService.guardRoute({ permissions: [readPermission, writePermission] }),
    //     subscriptionsController.deactivateSubscription.bind(subscriptionsController)
    // );

    // subscriptionsRoutes.patch(
    //     '/activate-subscription',
    //     guardService.guardRoute({ permissions: [readPermission, writePermission] }),
    //     subscriptionsController.activateSubscription.bind(subscriptionsController)
    // );

    return subscriptionsRoutes;
};
