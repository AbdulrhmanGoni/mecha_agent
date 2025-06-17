import { DatabaseService } from "./DatabaseService.ts";

export class SubscriptionsService {
    constructor(
        private paymentGatewayClientInterface: PaymentGatewayClientInterface,
        private databaseService: DatabaseService,
        private kvStoreClient: Deno.Kv,
    ) { }

    async createSubscriptionSession(userEmail: string, plan: Plan) {
        const { rows: [user] } = await this.databaseService.query<Pick<User, "currentPlan">>({
            text: "SELECT current_plan FROM users WHERE email = $1",
            args: [userEmail],
            camelCase: true,
        });

        if (user.currentPlan === plan.planName) {
            return {
                success: false,
                samePlan: true,
            }
        }

        const session = await this.paymentGatewayClientInterface.createSubscriptionSession(
            userEmail,
            plan.priceId
        )

        return {
            success: true,
            session,
        }
    }

    async verifyCheckoutSessionExistence(sessionId: string) {
        return await this.paymentGatewayClientInterface.verifyCheckoutSessionExistence(sessionId);
    }

    async createSubscription(userEmail: string, customerId: string, subscriptionId: string) {
        const session = this.databaseService.createTransaction("subscription_creation");
        await session.begin();

        const { rowCount } = await session.queryObject<{ id: string }>({
            text: `
                INSERT INTO subscriptions(customer_id, subscription_id, user_email, plan) 
                VALUES($1, $2, $3, $4)
            `,
            args: [customerId, subscriptionId, userEmail, "Pro"],
        });

        if (rowCount) {
            const { rowCount } = await session.queryObject({
                text: 'UPDATE users SET subscription_id = $2, current_plan = $3 WHERE email = $1',
                args: [userEmail, subscriptionId, "Pro"],
            });

            if (rowCount) {
                await session.commit()
                await this.kvStoreClient.delete(["inferences", userEmail, "Free"]);

                return true
            }
        }

        await session.rollback()
        return false
    }

    async cancelSubscription(userEmail: string) {
        const session = this.databaseService.createTransaction("subscription_cancelation");
        await session.begin();

        const { rows: [user] } = await session.queryObject<Pick<User, "subscriptionId"> | undefined>({
            text: "UPDATE subscriptions SET status = 'canceled' WHERE user_email = $1 RETURNING subscription_id;",
            args: [userEmail],
            camelCase: true,
        })

        if (user?.subscriptionId) {
            const subscriptionCanceled = await this.paymentGatewayClientInterface.cancelSubscription(user.subscriptionId);
            if (subscriptionCanceled) {
                session.commit();
                return true
            } else {
                session.rollback();
            }
        }

        return false
    }

    async activateSubscription(userEmail: string) {
        const session = this.databaseService.createTransaction("subscription_activation");
        await session.begin();

        const { rows: [user] } = await session.queryObject<Pick<User, "subscriptionId"> | undefined>({
            text: "UPDATE subscriptions SET status = 'active' WHERE user_email = $1 RETURNING subscription_id;",
            args: [userEmail],
            camelCase: true,
        })

        if (user?.subscriptionId) {
            const subscriptionCanceled = await this.paymentGatewayClientInterface.activateSubscription(user.subscriptionId);
            if (subscriptionCanceled) {
                session.commit();
                return true
            } else {
                session.rollback();
            }
        }

        return false
    }

    async deleteSubscription(customerId: string) {
        const session = this.databaseService.createTransaction("subscription_deletion");
        await session.begin();

        const { rows: [subscription] } = await session.queryObject<Pick<Subscription, "userEmail" | "plan">>({
            text: 'SELECT user_email, plan FROM subscriptions WHERE customer_id = $1',
            args: [customerId],
            camelCase: true,
        });

        if (!subscription) {
            await session.rollback()
            return false
        }

        const publishedAgentsEdit = "published_agents = CASE WHEN published_agents > 0 THEN 1 ELSE 0 END"
        const { rowCount: deletedUsers } = await session.queryObject({
            text: `UPDATE users SET subscription_id = $2, current_plan = $3, ${publishedAgentsEdit} WHERE email = $1`,
            args: [subscription.userEmail, null, "Free"],
        });
        if (!deletedUsers) {
            await session.rollback()
            return false
        }

        const { rowCount } = await session.queryObject({
            text: `
            UPDATE agents SET is_published = false WHERE user_email = $1 AND id NOT IN
            (SELECT id from agents WHERE user_email = $1 AND is_published = true ORDER BY created_at LIMIT 1)
            `,
            args: [subscription.userEmail],
        });
        if (!rowCount) {
            await session.rollback()
            return false
        }

        const { rowCount: deletedSubscriptions } = await session.queryObject({
            text: 'DELETE FROM subscriptions WHERE customer_id = $1',
            args: [customerId],
        });
        if (!deletedSubscriptions) {
            await session.rollback()
            return false
        }

        await this.kvStoreClient.delete(["inferences", subscription.userEmail, subscription.plan]);
        await session.commit();
        return true;
    }

    verifyWebhookSigning(body: string, signature: string) {
        return this.paymentGatewayClientInterface.verifyWebhookSigning(body, signature)
    }
}
