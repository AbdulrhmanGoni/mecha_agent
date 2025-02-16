import { Context } from "hono";
import { SSEService } from "../services/SSEService.ts";
import randomString from "../helpers/randomString.ts";

export class SSEController {
    constructor(private sseService: SSEService) { }

    subscribe(c: Context) {
        const headers = new Headers({
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        });

        const userEmail = c.get("userEmail");
        const event = c.req.param("event") as SSEEvent;
        const target = c.req.param("target");
        const subscriberId = `${userEmail}-${randomString(10)}`;

        const readable = this.sseService.subscribe({ event, target, subscriberId });

        c.req.raw.signal.addEventListener("abort", () => {
            this.sseService.unsubscribe({ event, target, subscriberId });
        });

        return new Response(readable, { headers });
    }
}
