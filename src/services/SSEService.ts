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
}
