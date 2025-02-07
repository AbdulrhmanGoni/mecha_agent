import { Context } from "hono";
import { DatasetsService } from "../services/DatasetsService.ts";

export class DatasetsController {
    constructor(private datasetsService: DatasetsService) { }

    async create(c: Context<never, never, { out: { form: CreateDatasetInput } }>) {
        const dataset = c.req.valid("form");
        const result = await this.datasetsService.create(dataset);

        return c.json({ result }, 201);
    }

    async delete(c: Context) {
        const datasetId = c.req.param("datasetId");
        const agentId = c.req.query("agentId") as string;
        const result = await this.datasetsService.delete(agentId, datasetId);
        return c.json({ result });
    }

    async update(c: Context<never, never, { out: { json: UpdateDatasetInput } }>) {
        const updateData = c.req.valid("json");
        const datasetId = c.req.param("datasetId") as string;
        const result = await this.datasetsService.update(datasetId, updateData);
        return c.json({ result });
    }
}

