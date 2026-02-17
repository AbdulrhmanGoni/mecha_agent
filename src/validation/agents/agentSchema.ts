import { z } from "zod";

const agentSchema = z.object({
    agentName: z.string().max(40),
    description: z.string().max(100),
    avatar: z.string().url().optional(),
    systemInstructions: z.string().max(10000).optional(),
    dontKnowResponse: z.string().max(100).optional(),
    greetingMessage: z.string().max(80).optional(),
})

export default agentSchema