import { z } from 'zod';
import { validator } from 'npm:hono/validator';
import schemaParser from "../../helpers/schemaParser.ts";

const apiKeyIdValidator = z.string().uuid({
    message: "API Key id must be UUID"
})

const apiKeysIdsInputValidator = validator('json', (value, c) => {
    const apiKeysIdsInputSchema = z
        .array(apiKeyIdValidator)
        .nonempty("No API Keys ids provided");

    return schemaParser(
        c,
        apiKeysIdsInputSchema,
        value,
        (message, issues) => `${message} ${issues.message} at: index ${issues.path}\n`
    )
})

export default apiKeysIdsInputValidator;
