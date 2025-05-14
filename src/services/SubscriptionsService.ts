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
        const { rows: [user] } = await this.databaseService.query<Pick<User, "subscriptionId"> | undefined>({
            text: "SELECT subscription_id FROM users WHERE email = $1",
            args: [userEmail],
            camelCase: true,
        })

        if (user?.subscriptionId) {
            return await this.paymentGatewayClientInterface.cancelSubscription(user.subscriptionId);
        }

        return false
    }

    async deleteSubscription(customerId: string) {
        const session = this.databaseService.createTransaction("subscription_deletion");
        await session.begin();

        const { rows: [subscription] } = await session.queryObject<{ userEmail: string }>({
            text: 'SELECT user_email FROM subscriptions WHERE customer_id = $1',
            args: [customerId],
            camelCase: true,
        });

        if (!subscription) {
            await session.rollback()
            return false
        }

        const { rowCount: deletedUsers } = await session.queryObject({
            text: 'UPDATE users SET subscription_id = $2, current_plan = $3 WHERE email = $1',
            args: [subscription.userEmail, null, "Free"],
        });
        if (!deletedUsers) {
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

        await this.kvStoreClient.delete(["inferences", subscription.userEmail, "Pro"]);
        await session.commit();
        return true;
    }

    verifyWebhookSigning(body: string, signature: string) {
        return this.paymentGatewayClientInterface.verifyWebhookSigning(body, signature)
    }
}
