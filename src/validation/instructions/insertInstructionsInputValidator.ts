import { z } from 'zod';
import { validator } from 'npm:hono/validator';
import schemaParser from "../../helpers/schemaParser.ts";

const instructionInputSchema = z.object({
    id: z.string(),
    datasetId: z.string(),
    systemMessage: z.string().optional(),
    prompt: z.string(),
    response: z.string(),
}).strict()

const insertInstructionsInputValidator = validator('json', (value, c) => {
    const insertInstructionsInputSchema = z
        .array(instructionInputSchema)
        .nonempty("Add at least one instruction to insert");

    return schemaParser<typeof instructionInputSchema.shape>(
        c,
        insertInstructionsInputSchema,
        value
    )
})

export default insertInstructionsInputValidator;
