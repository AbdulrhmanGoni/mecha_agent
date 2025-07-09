import { z } from 'zod';
import { validator } from 'hono/validator';
import schemaParser from "../../helpers/schemaParser.ts";
import signInSchema from "./signInSchema.ts";

const changePasswordInputSchema = z.object({
    currentPassword: signInSchema.shape.password,
    newPassword: signInSchema.shape.password,
}).strict();

const changePasswordInputValidator = validator('json', (value, c) => {
    return schemaParser<typeof changePasswordInputSchema.shape, string | string[]>(
        c,
        changePasswordInputSchema,
        value
    );
})

export default changePasswordInputValidator;
