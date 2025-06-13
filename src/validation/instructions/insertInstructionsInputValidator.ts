import { z } from 'zod';
import { validator } from 'hono/validator';
import schemaParser from "../../helpers/schemaParser.ts";

const instructionInputSchema = z.object({
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
