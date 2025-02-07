import { z } from 'zod'
import { validator } from 'npm:hono/validator'
import { permissionsArray } from "../../constant/permissions.ts";
import schemaParser from "../../helpers/schemaParser.ts";

const createApiKeyInputSchema = z.object({
    keyName: z.string(),
    permissions: z.array(z.enum(permissionsArray)).nonempty("Specify at least one permission"),
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
