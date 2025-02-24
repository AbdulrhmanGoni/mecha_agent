import { validator } from 'hono/validator'
import agentSchema from "./agentSchema.ts";
import schemaParser from "../../helpers/schemaParser.ts";
import { ParsedFormValue } from "hono/types";
import parsedEnvVariables from "../../configurations/parseEnvironmentVariables.ts";
import z from "zod";

const createAgentInputSchema = z.object({
    ...agentSchema.shape,
    greetingMessage: agentSchema.shape.greetingMessage.default(parsedEnvVariables.DEFAULT_GREETING_MESSAGE),
}).strict()

const createAgentInputValidator = validator('form', (value, c) => {
    return schemaParser<typeof createAgentInputSchema.shape, ParsedFormValue | ParsedFormValue[]>(
        c,
        createAgentInputSchema,
        value
    );
})

export default createAgentInputValidator;
