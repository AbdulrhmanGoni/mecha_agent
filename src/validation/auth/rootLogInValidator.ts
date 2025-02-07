import { validator } from 'hono/validator'
import rootUserSchema from "./rootUserSchema.ts";
import schemaParser from "../../helpers/schemaParser.ts";

const rootLogInSchema = rootUserSchema.strict();

const rootLogInValidator = validator('json', (value, c) => {
    return schemaParser<typeof rootLogInSchema.shape>(
        c,
        rootLogInSchema,
        value
    );
})

export default rootLogInValidator;
