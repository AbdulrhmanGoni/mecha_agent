import { DatabaseService } from "./DatabaseService.ts";
import { ObjectStorageService } from "./ObjectStorageService.ts";
import { SSEService } from "./SSEService.ts";

export class DatasetsService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly objectStorageService: ObjectStorageService,
        private readonly datasetProcessingWorker: Worker,
        private readonly sseService: SSEService,
    ) {
    }

    async create(datasetInput: CreateDatasetInput) {
        const newDatasetId = crypto.randomUUID();

        const transactionSession = this.databaseService.createTransaction("dataset_creation");
        await transactionSession.begin();

        const { rows: [dataset] } = await transactionSession.queryObject<Dataset>({
            text: `INSERT INTO datasets (id, agent_id, title, description, status) VALUES ($1, $2, $3, $4, $5) RETURNING *;`,
            args: [newDatasetId, datasetInput.agentId, datasetInput.title, datasetInput.description, "processing"],
            camelCase: true
        });

        const { rowCount: updatedAgents } = await transactionSession.queryObject<Dataset>({
            text: "UPDATE agents SET dataset_id = $2 WHERE id = $1",
            args: [dataset.agentId, dataset.id],
            camelCase: true
        });

        if (dataset && updatedAgents === 1) {
            try {
                await this.objectStorageService.uploadFile(
                    this.objectStorageService.buckets.datasets,
                    datasetInput.datasetFile,
                    { id: dataset.id }
                );

                await transactionSession.commit();

                this.datasetProcessingWorker.postMessage({
                    process: "new_dataset",
                    payload: dataset,
                });

                return dataset;
            } catch {
                //
            }
        }

        await transactionSession.rollback();
        return null;
    }

    async delete(agentId: string, datasetId: string) {
        const { rowCount: datasetDeleted } = await this.databaseService.query({
            text: "DELETE FROM datasets WHERE id = $1 AND agent_id = $2;",
            args: [datasetId, agentId],
        })

        if (datasetDeleted) {
            this.datasetProcessingWorker.postMessage({
                process: "delete_dataset",
                payload: { agentId, datasetId }
            });
            return true
        }

        return false
    }
}
