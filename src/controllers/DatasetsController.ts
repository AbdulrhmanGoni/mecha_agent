import { Context } from "hono";
import { DatasetsService } from "../services/DatasetsService.ts";

export class DatasetsController {
    constructor(private datasetsService: DatasetsService) { }

    async create(c: Context<{ Variables: { userEmail: string } }, never, { out: { form: CreateDatasetInput } }>) {
        const dataset = c.req.valid("form");
        const userEmail = c.get("userEmail");
        const result = await this.datasetsService.create(userEmail, dataset);

        return c.json({ result }, 201);
    }

    async delete(c: Context<{ Variables: { userEmail: string } }>) {
        const datasetId = c.req.param("datasetId");
        const agentId = c.req.query("agentId") as string;
        const userEmail = c.get("userEmail");
        const result = await this.datasetsService.delete({ agentId, datasetId, userEmail });

        return c.json({ result });
    }

    async update(c: Context<{ Variables: { userEmail: string } }, never, { out: { json: UpdateDatasetInput } }>) {
        const updateData = c.req.valid("json");
        const datasetId = c.req.param("datasetId") as string;
        const userEmail = c.get("userEmail");
        const result = await this.datasetsService.update(datasetId, userEmail, updateData);

        return c.json({ result });
    }
}

