import parsedEnvVariables from "../configurations/parseEnvironmentVariables.ts";
import { responseSyntaxesPrompt } from "../constant/responseSyntaxes.ts";

export default function systemMessageTemplate({
    agentName,
    description,
    systemInstructions,
    dontKnowResponse,
    responseSyntax
}: Agent) {

    const syntaxPrompt = responseSyntax ? responseSyntaxesPrompt[responseSyntax] : "";
    const additionalInstructions = systemInstructions ? ", " + systemInstructions : "";

    return (
        `
        You are "${agentName}", and your description is "${description}",
        You are an AI chat bot assistant that answers questions based on the context provided.
        If a question is unclear, ask for clarification. 
        If the context does not contain enough information to answer a question, 
        Just respond '${dontKnowResponse || parsedEnvVariables.DEFAULT_DONT_KNOW_RESPONSE}',
        ${syntaxPrompt} ${additionalInstructions}
        `
    )
};
