import parsedEnvVariables from "./parseEnvironmentVariables.ts";
import { MockPaymentGatewayClient } from "../../tests/mock/configs/MockPaymentGatewayClient.ts";
import { StripePaymentGatewayClient } from "./stripePaymentGatewayClient.ts";
import Stripe from "stripe";

export function bootstrapPaymentGatewayClient() {
    let paymentGatewayClient: PaymentGatewayClientInterface;

    if (parsedEnvVariables.DENO_ENV === "testing") {
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
