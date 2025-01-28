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
}
