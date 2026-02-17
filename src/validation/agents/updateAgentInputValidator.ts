import { z } from 'zod';
import { validator } from 'hono/validator';
import schemaParser from "../../helpers/schemaParser.ts";
import agentSchema from "./agentSchema.ts";

const updateAgentInputSchema = z.object({
    agentName: agentSchema.shape.agentName.optional(),
    description: agentSchema.shape.description.optional(),
    avatar: agentSchema.shape.avatar,
    systemInstructions: agentSchema.shape.systemInstructions,
    dontKnowResponse: agentSchema.shape.dontKnowResponse,
    greetingMessage: agentSchema.shape.greetingMessage,
    removeAvatar: z.coerce.boolean().optional(),
}).strict()

const updateAgentInputValidator = validator('json', (value, c) => {
    return schemaParser<typeof updateAgentInputSchema.shape, string | boolean>(
        c,
        updateAgentInputSchema,
        value
    );
})

export default updateAgentInputValidator;
