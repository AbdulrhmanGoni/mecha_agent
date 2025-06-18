export class MockPaymentGatewayClient implements PaymentGatewayClientInterface {
    constructor() {

    }

    async deactivateSubscription(_userEmail: string) {
        return true
    }

    async activateSubscription(_subscriptionId: string): Promise<boolean> {
        return true
    }

    async createSubscriptionSession(_userEmail: string, _plan: Plan) {
        return {
            url: "http://localhost/checkout",
        }
    }

    async verifyCheckoutSessionExistence(_sessionId: string) {
        return true
    }

    verifyWebhookSigning(_body: string, _signature: string) {
        return {} as any
    }
}