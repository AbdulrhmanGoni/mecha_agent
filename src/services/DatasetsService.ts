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
        this.datasetProcessingWorker.addEventListener("message", async (e) => {
            switch (e.data.process) {
                case "successful_process":
                    await this.update(
                        e.data.payload.datasetId,
                        e.data.payload.userEmail,
                        { status: "processed" }
                    );
                    this.sseService.dispatchEvent({
                        event: "dataset-status",
                        target: e.data.payload.datasetId,
                        message: "processed"
                    });
                    break;
                case "failed_process":
                    await this.update(
                        e.data.payload.datasetId,
                        e.data.payload.userEmail,
                        { status: "unprocessed" }
                    );
                    this.sseService.dispatchEvent({
                        event: "dataset-status",
                        target: e.data.payload.datasetId,
                        message: "unprocessed"
                    });
                    break;
            }
        })

        this.datasetProcessingWorker.addEventListener("error", (e) => {
            console.log("Error from 'datasetProcessingWorker' worker ! =>", e.error)
        })
    }

    async create(userEmail: string, datasetInput: CreateDatasetInput) {
        const newDatasetId = crypto.randomUUID();

        const transactionSession = this.databaseService.createTransaction("dataset_creation");
        await transactionSession.begin();

        const { rows: [dataset] } = await transactionSession.queryObject<Dataset>({
            text: `
                INSERT INTO datasets (id, agent_id, title, description, status, user_email) 
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *;
            `,
            args: [
                newDatasetId,
                datasetInput.agentId,
                datasetInput.title,
                datasetInput.description,
                "processing",
                userEmail
            ],
            camelCase: true
        });

        const { rowCount: updatedAgents } = await transactionSession.queryObject<Dataset>({
            text: "UPDATE agents SET dataset_id = $2 WHERE id = $1 AND user_email = $3",
            args: [dataset.agentId, dataset.id, dataset.userEmail],
            camelCase: true
        });

        if (dataset && updatedAgents === 1) {
            try {
                await this.objectStorageService.uploadFile(
                    this.objectStorageService.buckets.datasets,
                    datasetInput.datasetFile,
                    { id: dataset.id, metaData: { "user-email": userEmail } }
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

    async getOne(datasetId: string, userEmail: string) {
        const { rows } = await this.databaseService.query<Dataset>({
            text: "SELECT * FROM datasets WHERE id = $1 AND user_email = $2;",
            args: [datasetId, userEmail],
            camelCase: true
        })

        return rows[0]
    }

    async update(datasetId: string, userEmail: string, updateData: UpdateDatasetInput) {
        type UpdateFormat = [string, string[]]

        const [fields, values] = Object
            .entries(updateData)
            .reduce<UpdateFormat>(([fields, values], [field, value], i, arr) => {
                return [
                    (
                        fields + `${field} = $${i + 3}` +
                        `${i === arr.length - 1 ? "" : ", "}`
                    ),
                    [...values, value || ""]
                ]
            }, ["", []])

        const { rowCount } = await this.databaseService.query({
            text: `UPDATE datasets SET ${fields} WHERE id = $1 AND user_email = $2`,
            args: [datasetId, userEmail, ...values],
        })

        return !!rowCount
    }

    async delete(
        { agentId, datasetId, userEmail }:
            { agentId: string, userEmail: string, datasetId: string }
    ) {
        const { rowCount: datasetDeleted } = await this.databaseService.query({
            text: "DELETE FROM datasets WHERE id = $1 AND agent_id = $2 AND user_email = $3;",
            args: [datasetId, agentId, userEmail],
        })

        if (datasetDeleted) {
            this.datasetProcessingWorker.postMessage({
                process: "delete_dataset",
                payload: { datasetId, userEmail }
            });
            return true
        }

        return false
    }
}
