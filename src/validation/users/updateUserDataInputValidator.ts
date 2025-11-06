import { z } from 'zod';
import { validator } from 'hono/validator';
import schemaParser from "../../helpers/schemaParser.ts";
import { ParsedFormValue } from "hono/types";

const updateUserDataInputSchema = z.object({
    username: z.string().min(3).max(70).optional(),
    newAvatar: z.string().url().optional(),
    removeAvatar: z.coerce.boolean().optional(),
}).strict()

const updateUserDataInputValidator = validator('form', (value, c) => {
    return schemaParser<typeof updateUserDataInputSchema.shape, ParsedFormValue | ParsedFormValue[]>(
        c,
        updateUserDataInputSchema,
        value
    );
})

export default updateUserDataInputValidator;
