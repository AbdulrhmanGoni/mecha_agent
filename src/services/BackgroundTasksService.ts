import { kvStoreClient } from "../configurations/denoKvStoreClient.ts";
import { DatabaseService } from "./DatabaseService.ts";
import { InstructionsService } from "./InstructionsService.ts";
import performanceInSeconds from "../helpers/performanceInSeconds.ts";
import { ObjectStorageService } from "./ObjectStorageService.ts";

export class BackgroundTasksService {
    constructor(
        private readonly kvStoreClient: Deno.Kv,
        private readonly databaseService: DatabaseService,
        private readonly instructionsService: InstructionsService,
        private readonly objectStorageService: ObjectStorageService,
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

                case "delete_agents_avatars_from_S3":
                    this.taskPerformenceLogger(msg.task, this.deleteAgentsAvatarsFromS3());
                    break;

                case "delete_user_legacy":
                    this.taskPerformenceLogger(msg.task, this.deleteUserLegacy(msg.payload.userEmail));
                    break;

                default:
                    console.warn(new Date().toISOString(), `Unknown message enqueued: ${msg}`)
                    break;
            }
        });
    }

    private async cleanExpiredAnonymousChats() {
        await this.databaseService.query(`DELETE FROM anonymous_chats WHERE (started_at + INTERVAL '1 day') < NOW()`)
    }

    private async resetUsersInferencesRateLimits() {
        for await (const record of this.kvStoreClient.list<bigint>({ prefix: ["inferences"] })) {
            this.setLastWeekInferencesRecording(record.key[1] as string, record.value)
            await this.kvStoreClient.set(record.key, new Deno.KvU64(0n))
        }
    }

    private async deleteAgentsAvatarsFromS3() {
        const { rows } = await this.databaseService.query<{ id: string }>(
            `DELETE FROM deleted_agents_avatars RETURNING id`
        )

        await this.objectStorageService.deleteFiles(
            this.objectStorageService.buckets.agentsAvatars,
            rows.map(row => row.id)
        )
    }

    private async setLastWeekInferencesRecording(userEmail: string, todayValue: bigint) {
        const inferencesRecordKey = ["last-week-inferences", userEmail]
        const record = await this.kvStoreClient.get<number[]>(inferencesRecordKey)
        if (record.value) {
            record.value.pop()
            record.value.unshift(Number(todayValue))
            await this.kvStoreClient.set(inferencesRecordKey, record.value)
        } else {
            await this.kvStoreClient.set(inferencesRecordKey, [Number(todayValue), 0, 0, 0, 0, 0, 0])
        }
    }

    private async deleteUserLegacy(userEmail: string) {
        await this.instructionsService.clearUserInstructions(userEmail);
        await this.kvStoreClient.delete(["last-week-inferences", userEmail]);
        await this.kvStoreClient.delete(["inferences", userEmail]);
        await this.deleteAgentsAvatarsFromS3()
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
