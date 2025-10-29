import { MockPaymentGatewayClient } from "../../tests/mock/configs/MockPaymentGatewayClient.ts";
import { kvStoreClient } from "./denoKvStoreClient.ts";
import parsedEnvVariables from "./parseEnvironmentVariables.ts";
import { StripePaymentGatewayClient } from "./stripePaymentGatewayClient.ts";
import Stripe from "stripe";

export function bootstrapPaymentGatewayClient() {
    if (parsedEnvVariables.ENVIRONMENT == "testing") {
        return new MockPaymentGatewayClient({} as Stripe, kvStoreClient);
    } else {
        if (!parsedEnvVariables.STRIPE_SECRET_KEY) {
            throw new Error("'STRIPE_SECRET_KEY' environment variable is missing");
        }
        const stripe = new Stripe(parsedEnvVariables.STRIPE_SECRET_KEY, {
            apiVersion: "2025-03-31.basil",
        });
        return new StripePaymentGatewayClient(stripe, kvStoreClient);
    }
};
