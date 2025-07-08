import { z } from 'zod';
import { validator } from 'hono/validator';
import schemaParser from "../../helpers/schemaParser.ts";

const verifyEmailRequestInputSchema = z.object({
    email: z.string().email(),
    checkExistance: z.coerce.boolean().optional(),
}).strict()

const verifyEmailRequestInputValidator = validator('query', (value, c) => {
    return schemaParser<typeof verifyEmailRequestInputSchema.shape, string | string[]>(
        c,
        verifyEmailRequestInputSchema,
        value
    );
})

export default verifyEmailRequestInputValidator;
