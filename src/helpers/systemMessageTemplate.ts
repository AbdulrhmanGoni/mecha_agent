import chatsResponsesMessages from "../constant/response-messages/chatsResponsesMessages.ts";
import { responseSyntaxPrompts } from "../constant/agents.ts";

export default function systemMessageTemplate({
    agentName,
    description,
    systemInstructions,
    dontKnowResponse,
    responseSyntax
}: Agent) {
    return (
        `
        You are "${agentName}", and your description is "${description}",
        You are an AI chat bot assistant that answers questions based on the context provided.
        If a question is unclear, ask for clarification.
        If the context does not contain enough information to answer a question, 
        ${dontKnowResponse ? `Just respond "${dontKnowResponse}"` : chatsResponsesMessages.dontKnow},
        ${responseSyntax ? responseSyntaxPrompts[responseSyntax] + ", " : ""}
        ${systemInstructions ? ", " + systemInstructions : ""}
        `
    )
};
