import { Context } from "hono";
import { BackgroundTasksService } from "../services/BackgroundTasksService.ts";
import { QStashClient } from "../configurations/qStashClient.ts";

export class BackgroundTasksController {
    constructor(
        private readonly backgroundTasksService: BackgroundTasksService,
        private readonly qStashClient: QStashClient,
    ) { }

    async handleBackgroundTask(c: Context) {
        const signature = c.req.header("upstash-signature");
        if (!signature) return c.text("Missing upstash-signature header", 401);

        const body = await c.req.text();
        const url = c.req.url;

        try {
            const isValid = await this.qStashClient.receiver.verify({ body, signature, url });
            if (!isValid) return c.text("Invalid signature", 401);
        } catch (error) {
            console.error("QStash signature verification failed:", error);
            return c.text("Verification failed", 401);
        }

        try {
            const payload = JSON.parse(body) as BackgroundTaskMessage;
            this.backgroundTasksService.handleTask(payload);
            return c.text("OK", 200);
        } catch (error) {
            console.error("Failed to parse/handle background task:", error);
            return c.text("Internal Server Error", 500);
        }
    }
}
