import { z } from 'zod';
import { validator } from 'hono/validator';
import schemaParser from "../../helpers/schemaParser.ts";

const queryInstructionsParamsSchema = z.object({
    page: z.coerce.number().default(0),
    pageSize: z.coerce.number().default(20),
    searchText: z.string().optional(),
    datasetId: z.string().uuid(),
}).strict()

const queryInstructionsParamsValidator = validator('query', (value, c) => {
    return schemaParser<typeof queryInstructionsParamsSchema.shape, string | string[] | number | number[]>(
        c,
        queryInstructionsParamsSchema,
        value
    )
})

export default queryInstructionsParamsValidator;
