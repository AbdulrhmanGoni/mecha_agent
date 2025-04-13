/// <reference no-default-lib="true" />
/// <reference lib="deno.worker" />

import { datasetProcessingWorkerConfigs } from "../configurations/datasetProcessingWorkerConfigs.ts";
import { bootstrapDatasetProcessingWorker } from "./bootstrapDatasetProcessingWorker.ts";

const configurations = datasetProcessingWorkerConfigs();

const datasetProcessor = bootstrapDatasetProcessingWorker({
    embeddingClient: configurations.embeddingClient,
    vectorDatabaseClient: configurations.vectorDatabaseClient,
    minioClient: configurations.minioClient,
});

self.onmessage = (e: DatasetProcessingWorkerEvent) => {
    switch (e.data.process) {
        case "new_dataset": {
            const payload = e.data.payload as Dataset
            datasetProcessor.processDataset(payload)
                .then((result) => {
                    self.postMessage({
                        process: result ? "successful_process" : "failed_process",
                        payload: {
                            datasetId: payload.id,
                            userEmail: payload.userEmail
                        }
                    })
                })
                .catch(() => {
                    self.postMessage({
                        process: "failed_process",
                        payload: {
                            datasetId: payload.id,
                            userEmail: payload.userEmail
                        }
                    })
                })
            break;
        }
        case "delete_dataset": {
            const payload = e.data.payload as { datasetId: string, userEmail: string }
            datasetProcessor.deleteDataset(payload.datasetId, payload.userEmail)
                .then(() => {
                    self.postMessage({
                        process: "successful_deletion",
                        payload: {
                            datasetId: payload.datasetId,
                            userEmail: payload.userEmail
                        }
                    })
                })
                .catch(() => {
                    self.postMessage({
                        process: "failed_deletion",
                        payload: {
                            datasetId: payload.datasetId,
                            userEmail: payload.userEmail
                        }
                    })
                })
            break;
        }
    }
};
