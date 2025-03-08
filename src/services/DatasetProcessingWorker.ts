/// <reference no-default-lib="true" />
/// <reference lib="deno.worker" />

import { datasetProcessingWorkerConfigs } from "../configurations/datasetProcessingWorkerConfigs.ts";
import { bootstrapDatasetProcessingWorker } from "./bootstrapDatasetProcessingWorker.ts";

const configurations = datasetProcessingWorkerConfigs();

const datasetProcessor = bootstrapDatasetProcessingWorker({
    ollamaClient: configurations.ollamaClient,
    vectorDatabaseClient: configurations.vectorDatabaseClient,
    minioClient: configurations.minioClient,
});

self.onmessage = (e: DatasetProcessingWorkerEvent) => {
    switch (e.data.process) {
        case "new_dataset":
            datasetProcessor.processDataset(e.data.payload)
                .then((result) => {
                    self.postMessage({
                        process: result ? "successful_process" : "failed_process",
                        payload: {
                            datasetId: e.data.payload.id,
                            userEmail: e.data.payload.userEmail
                        }
                    })
                })
                .catch(() => {
                    self.postMessage({
                        process: "failed_process",
                        payload: {
                            datasetId: e.data.payload.id,
                            userEmail: e.data.payload.userEmail
                        }
                    })
                })
            break;

        case "delete_dataset":
            datasetProcessor.deleteDataset(e.data.payload.datasetId, e.data.payload.userEmail)
                .then(() => {
                    self.postMessage({
                        process: "successful_deletion",
                        payload: {
                            datasetId: e.data.payload.datasetId,
                            userEmail: e.data.payload.userEmail
                        }
                    })
                })
                .catch(() => {
                    self.postMessage({
                        process: "failed_deletion",
                        payload: {
                            datasetId: e.data.payload.datasetId,
                            userEmail: e.data.payload.userEmail
                        }
                    })
                })
            break;
    }
};
