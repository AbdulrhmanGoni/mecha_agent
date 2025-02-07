import { Context } from "hono";
import { InstructionsService } from "../services/InstructionsService.ts";
import { HTTPException } from 'hono/http-exception';

export class InstructionsController {
    constructor(private readonly instructionsService: InstructionsService) { }

    async insert(c: Context<never, never, { out: { json: Instruction[] } }>) {
        const instructions = c.req.valid("json");
        const result = await this.instructionsService.insert(instructions);
        return c.json({ result });
    }

    async update(c: Context<never, never, { out: { json: UpdateInstructionInput[] } }>) {
        const instructions = c.req.valid("json");
        const result = await this.instructionsService.update(instructions);
        return c.json({ result });
    }

    async remove(c: Context<never, never, { out: { json: string[] } }>) {
        const instructionsIds = c.req.valid("json");
        const result = await this.instructionsService.remove(instructionsIds);
        return c.json({ result });
    }

    async clear(c: Context) {
        const datasetId = c.req.query("datasetId");
        if (!datasetId) {
            throw new HTTPException(400, { message: "No dataset id provided to clear its instructions" });
        }
        const result = await this.instructionsService.clear(datasetId);
        return c.json({ result });
    }
}
