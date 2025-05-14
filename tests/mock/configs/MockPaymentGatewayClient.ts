export class MockPaymentGatewayClient implements PaymentGatewayClientInterface {
    constructor() {

    }

    async cancelSubscription(_userEmail: string) {
        return true
    }

    async createSubscriptionSession(_userEmail: string, _priceId: string) {
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