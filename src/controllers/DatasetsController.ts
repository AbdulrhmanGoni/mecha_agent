import { Context } from "hono";
import { DatasetsService } from "../services/DatasetsService.ts";
import datasetsResponsesMessages from "../constant/response-messages/datasetsResponsesMessages.ts";

export class DatasetsController {
    constructor(private datasetsService: DatasetsService) { }

    async create(c: Context<{ Variables: { userEmail: string } }, never, { out: { json: CreateDatasetInput } }>) {
        const dataset = c.req.valid("json");
        const userEmail = c.get("userEmail");
        const result = await this.datasetsService.create(userEmail, dataset);

        if (result) {
            return c.json({ result }, 201);
        }

        return c.json({ error: datasetsResponsesMessages.failedCreation }, 400);
    }

    async getOne(c: Context<{ Variables: { userEmail: string } }>) {
        const userEmail = c.get("userEmail");
        const datasetId = c.req.param("datasetId");
        const result = await this.datasetsService.getOne(datasetId, userEmail);

        if (result) {
            return c.json({ result }, 200);
        }

        return c.json({ error: "Failed to fetch the dataset, Maybe it doen't exist" }, 400);
    }

    async getAll(c: Context<{ Variables: { userEmail: string } }>) {
        const userEmail = c.get("userEmail");
        const result = await this.datasetsService.getAll(userEmail);

        if (result) {
            return c.json({ result }, 200);
        }

        return c.json({ error: "Failed to fetch your datasets" }, 400);
    }

    async delete(c: Context<{ Variables: { userEmail: string } }>) {
        const datasetId = c.req.param("datasetId");
        const userEmail = c.get("userEmail");
        const result = await this.datasetsService.delete({ datasetId, userEmail });

        if (result) {
            return c.json({ result: datasetsResponsesMessages.successfulDeletion });
        }

        return c.json({ error: datasetsResponsesMessages.failedDeletion }, 400);
    }

    async update(c: Context<{ Variables: { userEmail: string } }, never, { out: { json: UpdateDatasetInput } }>) {
        const updateData = c.req.valid("json");

        if (!Object.keys(updateData).length) {
            return c.json({ error: datasetsResponsesMessages.noUpdateData }, 400);
        }

        const datasetId = c.req.param("datasetId") as string;
        const userEmail = c.get("userEmail");
        const result = await this.datasetsService.update(datasetId, userEmail, updateData);

        if (result) {
            return c.json({ result: datasetsResponsesMessages.successfulUpdate });
        }

        return c.json({ error: datasetsResponsesMessages.failedUpdate }, 400);
    }
}

