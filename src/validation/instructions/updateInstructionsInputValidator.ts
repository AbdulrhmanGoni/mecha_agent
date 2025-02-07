import { z } from 'zod'
import { validator } from 'hono/validator'
import schemaParser from "../../helpers/schemaParser.ts";

const instructionInputSchema = z.object({
    id: z.string(),
    datasetId: z.string(),
    systemMessage: z.string().optional(),
    prompt: z.string().optional(),
    response: z.string().optional(),
}).strict()

const updateInstructionsInputValidator = validator('json', (value, c) => {
    const updateInstructionsInputSchema = z
        .array(instructionInputSchema)
        .nonempty("Specify at least one instruction to update it");

    return schemaParser(
        c,
        updateInstructionsInputSchema,
        value
    )
})

export default updateInstructionsInputValidator;
