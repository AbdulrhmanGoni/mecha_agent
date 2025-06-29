import parsedEnvVariables from "./parseEnvironmentVariables.ts";
import { StripePaymentGatewayClient } from "./stripePaymentGatewayClient.ts";
import Stripe from "stripe";

export async function bootstrapPaymentGatewayClient() {
    let paymentGatewayClient: PaymentGatewayClientInterface;

    if (parsedEnvVariables.ENVIRONMENT === "testing") {
        const { MockPaymentGatewayClient } = await import("../../tests/mock/configs/MockPaymentGatewayClient.ts")
        paymentGatewayClient = new MockPaymentGatewayClient();
    } else {
        if (!parsedEnvVariables.STRIPE_SECRET_KEY) {
            throw new Error("'STRIPE_SECRET_KEY' environment variable is missing");
        }

        const stripe = new Stripe(parsedEnvVariables.STRIPE_SECRET_KEY, {
            apiVersion: "2025-03-31.basil",
        });

        paymentGatewayClient = new StripePaymentGatewayClient(stripe);
    }

    return paymentGatewayClient
};
