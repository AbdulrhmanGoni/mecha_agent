import { validator } from 'hono/validator'
import schemaParser from "../../helpers/schemaParser.ts";
import signInSchema from "./signInSchema.ts";

const signInValidator = validator('json', (value, c) => {
    return schemaParser<typeof signInSchema.shape>(
        c,
        signInSchema,
        value
    );
})

export default signInValidator;
