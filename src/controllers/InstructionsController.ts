import { Context } from "hono";
import { InstructionsService } from "../services/InstructionsService.ts";
import { HTTPException } from 'hono/http-exception';

export class InstructionsController {
    constructor(private readonly instructionsService: InstructionsService) { }

    async insert(c: Context<{ Variables: { userEmail: string } }, never, { out: { json: InstructionInput[] } }>) {
        const instructions = c.req.valid("json");
        const userEmail = c.get("userEmail");

        const result = await this.instructionsService.insert(
            instructions.map((instruction) => {
                return { ...instruction, userEmail }
            })
        );
        return c.json({ result });
    }

    async update(c: Context<{ Variables: { userEmail: string } }, never, { out: { json: Omit<UpdateInstructionInput, "userEmail">[] } }>) {
        const instructions = c.req.valid("json");
        const userEmail = c.get("userEmail");

        const result = await this.instructionsService.update(
            instructions.map((instruction) => {
                return { ...instruction, userEmail }
            })
        );
        return c.json({ result });
    }

    async remove(c: Context<{ Variables: { userEmail: string } }, never, { out: { json: string[] } }>) {
        const instructionsIds = c.req.valid("json");
        const userEmail = c.get("userEmail");
        const result = await this.instructionsService.remove(userEmail, instructionsIds);
        return c.json({ result });
    }

    async clear(c: Context<{ Variables: { userEmail: string } }>) {
        const datasetId = c.req.query("datasetId");
        const userEmail = c.get("userEmail");
        if (!datasetId) {
            throw new HTTPException(400, { message: "No dataset id provided to clear its instructions" });
        }
        const result = await this.instructionsService.clear(datasetId, userEmail);
        return c.json({ result });
    }
}
