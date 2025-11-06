import { validator } from 'hono/validator'
import agentSchema from "./agentSchema.ts";
import schemaParser from "../../helpers/schemaParser.ts";
import { ParsedFormValue } from "hono/types";
import z from "zod";
import { defaultGreetingMessage } from "../../constant/agents.ts";

const createAgentInputSchema = z.object({
    ...agentSchema.shape,
    greetingMessage: agentSchema.shape.greetingMessage.default(defaultGreetingMessage),
}).strict()

const createAgentInputValidator = validator('json', (value, c) => {
    return schemaParser<typeof createAgentInputSchema.shape, ParsedFormValue | ParsedFormValue[]>(
        c,
        createAgentInputSchema,
        value
    );
})

export default createAgentInputValidator;
