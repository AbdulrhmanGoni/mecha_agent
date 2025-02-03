import { validator } from 'npm:hono/validator'
import schemaParser from "../../helpers/schemaParser.ts";
import { ParsedFormValue } from "npm:hono/types";
import datasetSchema from "./datasetSchema.ts";

export const createDatasetInputSchema = datasetSchema.strict();

const createDatasetInputValidator = validator('form', (value, c) => {
    return schemaParser<typeof createDatasetInputSchema.shape, ParsedFormValue | ParsedFormValue[]>(
        c,
        createDatasetInputSchema,
        value
    );
})

export default createDatasetInputValidator;
