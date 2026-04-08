import { Client, Receiver } from "@upstash/qstash";
import parsedEnvVariables from "../configurations/parseEnvironmentVariables.ts";

export class QStashClient {
    private client: Client;
    public readonly receiver: Receiver;

    constructor() {
        this.client = new Client({
            baseUrl: parsedEnvVariables.QSTASH_URL,
            token: parsedEnvVariables.QSTASH_TOKEN,
        });

        this.receiver = new Receiver({
            currentSigningKey: parsedEnvVariables.QSTASH_CURRENT_SIGNING_KEY,
            nextSigningKey: parsedEnvVariables.QSTASH_NEXT_SIGNING_KEY,
        });
    }

    async enqueue(channel: string, message: unknown, options?: { delay?: number }) {
        try {
            await this.client.publishJSON({
                url: `${parsedEnvVariables.SERVER_URL}/api/${channel}`,
                body: message,
                delay: options?.delay
            });
        } catch (error) {
            console.error("Failed to enqueue task via QStash:", error);
        }
    }
}

export const qStashClient = new QStashClient();