import { Context } from "hono";
import { InstructionsService } from "../services/InstructionsService.ts";
import instructionsResponsesMessages from "../constant/response-messages/instructionsResponsesMessages.ts";

export class InstructionsController {
    constructor(private readonly instructionsService: InstructionsService) { }

    async insert(c: Context<{ Variables: { userEmail: string } }, never, { out: { json: NewInstructionInput[] } }>) {
        const instructions = c.req.valid("json");
        const userEmail = c.get("userEmail");
        const datasetId = c.req.query("datasetId") as string;

        const result = await this.instructionsService.insert({
            instructions,
            datasetId,
            userEmail,
        });

        if (result) {
            return c.json({ result: instructionsResponsesMessages.successfulInsert }, 201);
        }

        return c.json({ result: instructionsResponsesMessages.failedInsert }, 400);
    }

    async query(c: Context<{ Variables: { userEmail: string } }, never, { out: { query: QueryInstructionParams } }>) {
        const userEmail = c.get("userEmail");
        const { page, pageSize, datasetId, searchText } = c.req.valid("query");

        let result: Instruction[] = [];

        if (searchText) {
            result = await this.instructionsService.search(datasetId, userEmail, {
                page,
                pageSize,
                searchText,
            })
        } else {
            result = await this.instructionsService.list(datasetId, userEmail, {
                page,
                pageSize,
            })
        }

        return c.json({ result });
    }

    async update(c: Context<{ Variables: { userEmail: string } }, never, { out: { json: UpdateInstructionInput[] } }>) {
        const instructions = c.req.valid("json");

        const result = await this.instructionsService.update(instructions);

        if (result) {
            return c.json({ result: instructionsResponsesMessages.successfulUpdate });
        }

        return c.json({ result: instructionsResponsesMessages.failedUpdate }, 400);
    }

    async remove(c: Context<{ Variables: { userEmail: string } }, never, { out: { json: string[] } }>) {
        const instructionsIds = c.req.valid("json");
        const userEmail = c.get("userEmail");
        const result = await this.instructionsService.remove(userEmail, instructionsIds);

        if (result) {
            return c.json({ result: instructionsResponsesMessages.successfulRemove });
        }

        return c.json({ result: instructionsResponsesMessages.failedRemove }, 400);
    }
}
