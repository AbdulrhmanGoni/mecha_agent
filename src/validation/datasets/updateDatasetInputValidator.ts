import { z } from 'zod'
import { validator } from 'hono/validator'
import schemaParser from "../../helpers/schemaParser.ts";
import datasetSchema from "./datasetSchema.ts";
import { ParsedFormValue } from "hono/types";

export const updateDatasetInputSchema = z.object({
    title: datasetSchema.shape.title.optional(),
    description: datasetSchema.shape.description.optional(),
}).strict();

const updateDatasetInputValidator = validator('form', (value, c) => {
    return schemaParser<typeof updateDatasetInputSchema.shape, ParsedFormValue | ParsedFormValue[]>(
        c,
        updateDatasetInputSchema,
        value
    );
})

export default updateDatasetInputValidator;
