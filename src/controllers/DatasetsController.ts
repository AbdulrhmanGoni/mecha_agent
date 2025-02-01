import { Context } from "npm:hono";
import { DatasetsService } from "../services/DatasetsService.ts";

export class DatasetsController {
    constructor(private datasetsService: DatasetsService) { }

    async create(c: Context<never, never, { out: { form: CreateDatasetInput } }>) {
        const dataset = c.req.valid("form");
        const result = await this.datasetsService.create(dataset);

        return c.json({ result }, 201);
    }
}

