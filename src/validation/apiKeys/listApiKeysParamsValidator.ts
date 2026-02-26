import { z } from 'zod';
import { validator } from 'hono/validator';
import schemaParser from "../../helpers/schemaParser.ts";

const listApiKeysParamsSchema = z.object({
    page: z.coerce.number().default(0),
    pageSize: z.coerce.number().default(20),
}).strict()

const listApiKeysParamsValidator = validator('query', (value, c) => {
    return schemaParser<typeof listApiKeysParamsSchema.shape, string | string[] | number | number[]>(
        c,
        listApiKeysParamsSchema,
        value
    )
})

export default listApiKeysParamsValidator;
