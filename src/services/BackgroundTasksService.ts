import { kvStoreClient } from "../configurations/denoKvStoreClient.ts";
import { DatabaseService } from "./DatabaseService.ts";
import { InstructionsService } from "./InstructionsService.ts";
import performanceInSeconds from "../helpers/performanceInSeconds.ts";

export class BackgroundTasksService {
    constructor(
        private readonly kvStoreClient: Deno.Kv,
        private readonly databaseService: DatabaseService,
        private readonly instructionsService: InstructionsService,
    ) {
        this.kvStoreClient.listenQueue((msg: BackgroundTaskMessage) => {
            switch (msg.task) {
                case "delete_expired_anonymous_chats":
                    this.taskPerformenceLogger(msg.task, this.cleanExpiredAnonymousChats())
                    break;

                case "reset_users_inferences_rate_limits":
                    this.taskPerformenceLogger(msg.task, this.resetUsersInferencesRateLimits());
                    break;

                case "delete_dataset_instructions":
                    this.taskPerformenceLogger(
                        msg.task,
                        this.instructionsService.clearDatasetInstructions(msg.payload.datasetId, msg.payload.userEmail)
                    );
                    break;

                default:
                    console.warn(new Date().toISOString(), `Unknown message enqueued: ${msg}`)
                    break;
            }
        });
    }

    private async cleanExpiredAnonymousChats() {
        await this.databaseService.query(
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

    private taskPerformenceLogger(task: string, taskPromise: Promise<unknown>) {
        console.log(`"${task}" task started 🚀`);
        const taskStartTime = performance.now();
        taskPromise.finally(() => {
            console.log(`"${task}" task completed in ${performanceInSeconds(taskStartTime)} ✅`)
        });
    }
}

Deno.cron("Delete expired anonymous chats", "0 0 * * *", () => {
    kvStoreClient.enqueue({ task: "delete_expired_anonymous_chats" });
});

Deno.cron("Reset users inferences rate limits", "0 0 * * *", () => {
    kvStoreClient.enqueue({ task: "reset_users_inferences_rate_limits" });
});
