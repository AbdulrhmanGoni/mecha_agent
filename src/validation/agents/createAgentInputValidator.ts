import { validator } from 'hono/validator'
import agentSchema from "./agentSchema.ts";
import schemaParser from "../../helpers/schemaParser.ts";
import { ParsedFormValue } from "hono/types";

const createAgentInputSchema = agentSchema.strict()

const createAgentInputValidator = validator('form', (value, c) => {
    return schemaParser<typeof createAgentInputSchema.shape, ParsedFormValue | ParsedFormValue[]>(
        c,
        createAgentInputSchema,
        value
    );
})

export default createAgentInputValidator;
