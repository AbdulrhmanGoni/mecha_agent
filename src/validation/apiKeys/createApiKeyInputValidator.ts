import { z } from 'zod'
import { validator } from 'hono/validator'
import { apiKeysPermissions } from "../../constant/permissions.ts";
import schemaParser from "../../helpers/schemaParser.ts";

const createApiKeyInputSchema = z.object({
    keyName: z.string(),
    permissions: z.array(z.enum(apiKeysPermissions)).nonempty("Specify at least one permission"),
    maxAgeInDays: z.number(),
}).strict()

const createApiKeyInputValidator = validator('json', (value, c) => {
    return schemaParser<typeof createApiKeyInputSchema.shape>(
        c,
        createApiKeyInputSchema,
        value
    );
})

export default createApiKeyInputValidator;
