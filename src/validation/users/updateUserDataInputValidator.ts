import { z } from 'zod';
import { validator } from 'hono/validator';
import schemaParser from "../../helpers/schemaParser.ts";

const updateUserDataInputSchema = z.object({
    username: z.string().min(3).max(70).optional(),
    newAvatar: z.string().url().optional(),
    removeAvatar: z.coerce.boolean().optional(),
}).strict()

const updateUserDataInputValidator = validator('json', (value, c) => {
    return schemaParser<typeof updateUserDataInputSchema.shape, string | boolean>(
        c,
        updateUserDataInputSchema,
        value
    );
})

export default updateUserDataInputValidator;
