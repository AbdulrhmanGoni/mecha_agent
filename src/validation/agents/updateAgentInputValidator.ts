import { z } from 'npm:zod';
import { validator } from 'npm:hono/validator';
import schemaParser from "../../helpers/schemaParser.ts";
import { ParsedFormValue } from "npm:hono/types";
import agentSchema from "./agentSchema.ts";

const updateAgentInputSchema = z.object({
    agentName: agentSchema.shape.agentName.optional(),
    description: agentSchema.shape.description.optional(),
    avatar: agentSchema.shape.avatar,
    systemInstructions: agentSchema.shape.systemInstructions,
    dontKnowResponse: agentSchema.shape.dontKnowResponse,
    greetingMessage: agentSchema.shape.greetingMessage,
    responseSyntax: agentSchema.shape.responseSyntax,
    removeAvatar: z.coerce.boolean().optional(),
}).strict()

const updateAgentInputValidator = validator('form', (value, c) => {
    return schemaParser<typeof updateAgentInputSchema.shape, ParsedFormValue | ParsedFormValue[]>(
        c,
        updateAgentInputSchema,
        value
    );
})

export default updateAgentInputValidator;
