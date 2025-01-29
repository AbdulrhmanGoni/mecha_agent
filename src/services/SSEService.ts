import { encoder } from "djwt/util";

const sseSubscribers: Record<SSEEvent, SSESubscriber[]> = {
    "dataset-status": []
}

export class SSEService {
    constructor() { }

    subscribe({ event, target, subscriberId }: { event: SSEEvent, target: string, subscriberId: string }) {
        const stream = new ReadableStream({
            start(controller) {
                sseSubscribers[event].push({ [target]: { subscriberChannel: controller, subscriberId } })
            },
        });

        return stream
    }

    unsubscribe({ event, target, subscriberId }: { event: SSEEvent, target: string, subscriberId: string }) {
        sseSubscribers[event] = sseSubscribers[event].filter((subscriber) => {
            if (subscriber[target].subscriberId === subscriberId) {
                subscriber[target].subscriberChannel.close();
                return false;
            }

            return true;
        })
    }

    dispatchEvent({ event, target, subscriberId, message }: {
        event: SSEEvent,
        target: string,
        subscriberId?: string,
        message: string
    }) {
        sseSubscribers[event].forEach((subscriber) => {
            if (subscriberId) {
                if (subscriber[target]?.subscriberId === subscriberId) {
                    subscriber[target]?.subscriberChannel.enqueue(encoder.encode(`data: ${message}\n\n`));
                }
            } else {
                subscriber[target]?.subscriberChannel.enqueue(encoder.encode(`data: ${message}\n\n`));
            }
        })
    }
}
