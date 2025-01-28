import { Context } from "npm:hono";
import { InstructionsService } from "../services/InstructionsService.ts";
import { HTTPException } from 'npm:hono/http-exception';

export class InstructionsController {
    constructor(private readonly instructionsService: InstructionsService) { }

    async insertInstructions(c: Context<never, never, { out: { json: Instruction[] } }>) {
        const instructions = c.req.valid("json");
        const result = await this.instructionsService.insertInstructions(instructions);
        return c.json({ result });
    }

    async updateInstructions(c: Context<never, never, { out: { json: UpdateInstructionInput[] } }>) {
        const instructions = c.req.valid("json");
        const result = await this.instructionsService.updateInstructions(instructions);
        return c.json({ result });
    }

    async removeInstructions(c: Context<never, never, { out: { json: string[] } }>) {
        const instructionsIds = c.req.valid("json");
        const result = await this.instructionsService.removeInstructions(instructionsIds);
        return c.json({ result });
    }

    async clearInstructions(c: Context) {
        const datasetId = c.req.query("datasetId");
        if (!datasetId) {
            throw new HTTPException(400, { message: "No dataset id provided to clear its instructions" });
        }
        const result = await this.instructionsService.clearInstructions(datasetId);
        return c.json({ result });
    }
}
