import { type Client as PostgresClient } from "deno.land/x/postgres";
import { InstructionsService } from "./InstructionsService.ts";

export class DatasetsService {
    constructor(
        private readonly dbClient: PostgresClient,
        private readonly instructionsService: InstructionsService,
        private readonly kvClient: Deno.Kv,
    ) {
    }

    async create(userEmail: string, datasetInput: CreateDatasetInput) {
        const transaction = this.dbClient.createTransaction("create_dataset");
        await transaction.begin();

        const { rows } = await transaction.queryObject<Dataset>({
            text: 'INSERT INTO datasets (title, description, user_email) VALUES ($1, $2, $3) RETURNING *',
            args: [
                datasetInput.title,
                datasetInput.description,
                userEmail
            ],
            camelCase: true
        });

        if (rows[0]) {
            const updateUserResult = await transaction.queryObject({
                text: 'UPDATE users SET datasets_count = datasets_count + 1 WHERE email = $1',
                args: [userEmail],
            });

            if (updateUserResult.rowCount === 1) {
                await transaction.commit();
                return rows[0]
            }
        }

        await transaction.rollback();
        return null
    }

    async getOne(datasetId: string, userEmail: string): Promise<Dataset & { instructionsCount: number } | null> {
        const { rows } = await this.dbClient.queryObject<Dataset>({
            text: "SELECT * FROM datasets WHERE id = $1 AND user_email = $2;",
            args: [datasetId, userEmail],
            camelCase: true
        })

        if (rows[0]) {
            const instructionsCount = await this.instructionsService.count(datasetId, userEmail)
            Object.defineProperty(
                rows[0],
                "instructionsCount",
                { value: instructionsCount, enumerable: true }
            )
            return rows[0] as Dataset & { instructionsCount: number }
        }

        return null
    }

    async getAll(userEmail: string) {
        const { rows } = await this.dbClient.queryObject<Dataset>({
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

        const { rowCount } = await this.dbClient.queryObject({
            text: `UPDATE datasets SET ${fields}, updated_at = NOW() WHERE id = $1 AND user_email = $2`,
            args: [datasetId, userEmail, ...values],
        })

        return !!rowCount
    }

    async delete({ datasetId, userEmail }: { userEmail: string, datasetId: string }) {
        const transaction = this.dbClient.createTransaction("delete_dataset");
        await transaction.begin();

        const { rowCount: datasetDeleted } = await transaction.queryObject({
            text: "DELETE FROM datasets WHERE id = $1 AND user_email = $2;",
            args: [datasetId, userEmail],
        })

        if (datasetDeleted) {
            const updateUserResult = await transaction.queryObject({
                text: 'UPDATE users SET datasets_count = datasets_count - 1 WHERE email = $1',
                args: [userEmail],
            });

            if (updateUserResult.rowCount === 1) {
                await transaction.commit();
                await this.kvClient.enqueue(
                    {
                        task: "delete_dataset_instructions",
                        payload: { datasetId, userEmail },
                    },
                    { keysIfUndelivered: [["delete_dataset_instructions", datasetId]] }
                )
                return true
            }
        }

        await transaction.rollback();
        return false
    }
}
