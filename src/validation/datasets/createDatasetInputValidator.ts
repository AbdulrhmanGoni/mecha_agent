import { validator } from 'hono/validator'
import schemaParser from "../../helpers/schemaParser.ts";
import datasetSchema from "./datasetSchema.ts";

export const createDatasetInputSchema = datasetSchema.strict();

const createDatasetInputValidator = validator('json', (value, c) => {
    return schemaParser<typeof createDatasetInputSchema.shape, string>(
        c,
        createDatasetInputSchema,
        value
    );
})

export default createDatasetInputValidator;
