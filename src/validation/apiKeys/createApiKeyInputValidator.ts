import { z } from 'zod'
import { validator } from 'hono/validator'
import { apiKeysPermissions } from "../../constant/permissions.ts";
import schemaParser from "../../helpers/schemaParser.ts";

const createApiKeyInputSchema = z.object({
    keyName: z.string().min(1).max(80),
    permissions: z.array(z.enum(apiKeysPermissions)).nonempty("Specify at least one permission"),
    maxAgeInDays: z.number()
        .int()
        .min(1, "Expiration must be at least 1 day")
        .max(730, "Expiration cannot exceed 2 years")
        .optional(),
}).strict()

const createApiKeyInputValidator = validator('json', (value, c) => {
    return schemaParser<typeof createApiKeyInputSchema.shape>(
        c,
        createApiKeyInputSchema,
        value
    );
})

export default createApiKeyInputValidator;
