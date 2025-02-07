import { z } from 'zod'
import { validator } from 'npm:hono/validator'
import schemaParser from "../../helpers/schemaParser.ts";
import datasetSchema from "./datasetSchema.ts";

export const updateDatasetInputSchema = z.object({
    title: datasetSchema.shape.title.optional(),
    description: datasetSchema.shape.description.optional(),
}).strict();

const updateDatasetInputValidator = validator('json', (value, c) => {
    return schemaParser<typeof updateDatasetInputSchema.shape>(
        c,
        updateDatasetInputSchema,
        value
    );
})

export default updateDatasetInputValidator;
