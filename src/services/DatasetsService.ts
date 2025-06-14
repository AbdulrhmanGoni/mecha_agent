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

    async create(userEmail: string, datasetInput: CreateDatasetInput) {
        const { rows } = await this.databaseService.query<Dataset>({
            text: 'INSERT INTO datasets (title, description, user_email) VALUES ($1, $2, $3) RETURNING *',
            args: [
                datasetInput.title,
                datasetInput.description,
                userEmail
            ],
            camelCase: true
        });

        return rows[0]
    }

    async getOne(datasetId: string, userEmail: string) {
        const { rows } = await this.databaseService.query<Dataset>({
            text: "SELECT * FROM datasets WHERE id = $1 AND user_email = $2;",
            args: [datasetId, userEmail],
            camelCase: true
        })

        return rows[0]
    }

    async getAll(userEmail: string) {
        const { rows } = await this.databaseService.query<Dataset>({
            text: "SELECT * FROM datasets WHERE user_email = $1;",
            args: [userEmail],
            camelCase: true
        })

        return rows
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
            text: `UPDATE datasets SET ${fields}, updated_at = NOW() WHERE id = $1 AND user_email = $2`,
            args: [datasetId, userEmail, ...values],
        })

        return !!rowCount
    }

    async delete(
        { datasetId, userEmail }:
            { userEmail: string, datasetId: string }
    ) {
        const { rowCount: datasetDeleted } = await this.databaseService.query({
            text: "DELETE FROM datasets WHERE id = $1 AND user_email = $2;",
            args: [datasetId, userEmail],
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
