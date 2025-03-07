import { Context } from "hono";
import { DatasetsService } from "../services/DatasetsService.ts";
import datasetsResponsesMessages from "../constant/response-messages/datasetsResponsesMessages.ts";

export class DatasetsController {
    constructor(private datasetsService: DatasetsService) { }

    async create(c: Context<{ Variables: { userEmail: string } }, never, { out: { form: CreateDatasetInput } }>) {
        const dataset = c.req.valid("form");
        const userEmail = c.get("userEmail");
        const result = await this.datasetsService.create(userEmail, dataset);

        if (result) {
            return c.json({ result }, 201);
        }

        return c.json({ error: datasetsResponsesMessages.failedCreation });
    }

    async delete(c: Context<{ Variables: { userEmail: string } }>) {
        const datasetId = c.req.param("datasetId");
        const agentId = c.req.query("agentId") as string;
        const userEmail = c.get("userEmail");
        const result = await this.datasetsService.delete({ agentId, datasetId, userEmail });

        if (result) {
            return c.json({ result: datasetsResponsesMessages.successfulDeletion });
        }

        return c.json({ error: datasetsResponsesMessages.failedDeletion });
    }

    async update(c: Context<{ Variables: { userEmail: string } }, never, { out: { json: UpdateDatasetInput } }>) {
        const updateData = c.req.valid("json");

        if (!Object.keys(updateData).length) {
            return c.json({ error: datasetsResponsesMessages.noUpdateData });
        }

        const datasetId = c.req.param("datasetId") as string;
        const userEmail = c.get("userEmail");
        const result = await this.datasetsService.update(datasetId, userEmail, updateData);

        if (result) {
            return c.json({ result: datasetsResponsesMessages.successfulUpdate });
        }

        return c.json({ error: datasetsResponsesMessages.failedUpdate });
    }
}

