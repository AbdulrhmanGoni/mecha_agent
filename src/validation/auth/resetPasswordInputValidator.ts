import { z } from 'zod';
import { validator } from 'hono/validator';
import schemaParser from "../../helpers/schemaParser.ts";
import signInSchema from "./signInSchema.ts";

const resetPasswordInputSchema = z.object({
    email: signInSchema.shape.email,
    newPassword: signInSchema.shape.password,
}).strict();

const resetPasswordInputValidator = validator('json', (value, c) => {
    return schemaParser<typeof resetPasswordInputSchema.shape, string | string[]>(
        c,
        resetPasswordInputSchema,
        value
    );
})

export default resetPasswordInputValidator;
