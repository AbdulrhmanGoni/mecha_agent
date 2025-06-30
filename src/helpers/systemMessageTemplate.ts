import { responseSyntaxPrompts } from "../constant/agents.ts";

export default function systemMessageTemplate({
    agentName,
    systemInstructions,
    dontKnowResponse,
    responseSyntax
}: Agent) {
    return (
        `
        You name is "${agentName}",
        You are an AI chatbot answers questions only according to the provided context.
        If a question is unclear, ask for clarification.
        Keep your responses breif and to the point, 
        If the question is not relevant to the context, or if the context lacks sufficient information to answer accurately, 
        ${dontKnowResponse ?
            `Just respond "${dontKnowResponse}"` :
            "Respond by stating that you cannot provide a proper answer and briefly explain why (e.g., missing details, unclear intent, or out-of-scope topic)."
        },
        ${responseSyntax ? responseSyntaxPrompts[responseSyntax] + ", " : ""}
        ${systemInstructions ? ", " + systemInstructions : ""}
        `
    )
};
