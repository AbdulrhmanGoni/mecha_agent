import { kvStoreClient } from "../configurations/denoKvStoreClient.ts";
import { DatabaseService } from "./DatabaseService.ts";
import { InstructionsService } from "./InstructionsService.ts";

export class BackgroundTasksService {
    constructor(
        private readonly kvStoreClient: Deno.Kv,
        private readonly databaseService: DatabaseService,
        private readonly instructionsService: InstructionsService,
    ) {
        this.kvStoreClient.listenQueue((msg: BackgroundTaskMessage) => {
            switch (msg.task) {
                case "delete-expired-anonymous-chats":
                    this.cleanExpiredAnonymousChats()
                    break;

                case "reset-users-inferences-rate-limits":
                    this.resetUsersInferencesRateLimits()
                    break;

                case "delete_dataset_instructions":
                    this.instructionsService.clear(msg.payload.datasetId, msg.payload.userEmail)
                    break;

                default:
                    console.warn(new Date().toISOString(), `Unknown message enqueued: ${msg}`)
                    break;
            }
        });
    }

    private cleanExpiredAnonymousChats() {
        this.databaseService.query(
            `DELETE FROM anonymous_chats WHERE (started_at + INTERVAL '1 day') < NOW()`
        ).then(({ rowCount }) => {
            console.log("'delete-expired-anonymous-chats' task done, deleted rows:", rowCount)
        })
    }

    private async resetUsersInferencesRateLimits() {
        for await (const record of this.kvStoreClient.list<bigint>({ prefix: ["inferences"] })) {
            this.setLastWeekInferencesRecording(record.key[1] as string, record.value)
            await this.kvStoreClient.set(record.key, new Deno.KvU64(0n))
        }
    }

    private async setLastWeekInferencesRecording(userEmail: string, todayValue: bigint) {
        const record = await this.kvStoreClient.get<number[]>(["last-week-inferences", userEmail])
        if (record.value) {
            record.value.pop()
            record.value.unshift(Number(todayValue))
            await this.kvStoreClient.set(["last-week-inferences", userEmail], record.value)
        } else {
            await this.kvStoreClient.set(["last-week-inferences", userEmail], [Number(todayValue), 0, 0, 0, 0, 0, 0])
        }
    }
}

Deno.cron("Delete expired anonymous chats", "0 0 * * *", () => {
    kvStoreClient.enqueue({ task: "delete-expired-anonymous-chats" });
});

Deno.cron("Reset users inferences rate limits", "0 0 * * *", () => {
    kvStoreClient.enqueue({ task: "reset-users-inferences-rate-limits" });
});
