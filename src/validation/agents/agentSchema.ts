import { z } from "zod";
import { responseSyntaxTypes } from "../../constant/agents.ts";
import avatarFieldValidator from "../shared/avatarFieldValidator.ts";

const agentSchema = z.object({
    agentName: z.string().max(40),
    description: z.string().max(100),
    avatar: avatarFieldValidator.optional(),
    systemInstructions: z.string().max(10000).optional(),
    dontKnowResponse: z.string().max(100).optional(),
    greetingMessage: z.string().max(80).optional(),
    responseSyntax: z.enum(responseSyntaxTypes).optional(),
})

export default agentSchema