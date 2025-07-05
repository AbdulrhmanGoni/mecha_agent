import { z } from 'zod';
import { validator } from 'hono/validator';
import schemaParser from "../../helpers/schemaParser.ts";

const verifyEmailResponseInputSchema = z.object({
    email: z.string().email(),
    otp: z.string(),
    signature: z.string(),
}).strict()

const verifyEmailResponseInputValidator = validator('query', (value, c) => {
    return schemaParser<typeof verifyEmailResponseInputSchema.shape, string | string[]>(
        c,
        verifyEmailResponseInputSchema,
        value
    );
})

export default verifyEmailResponseInputValidator;
