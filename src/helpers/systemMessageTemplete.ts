import parsedEnvVariables from "../configurations/parseEnvironmentVariables.ts";
import { responseSyntaxesPrompt } from "../constant/responseSyntaxes.ts";

export default function systemMessageTemplete({
    agentName,
    description,
    systemInstructions,
    dontKnowResponse,
    responseSyntax
}: Agent) {

    const fallbackResponse = dontKnowResponse || parsedEnvVariables.DEFAULT_DONT_KNOW_RESPONSE;
    const syntaxPrompt = responseSyntaxesPrompt[responseSyntax];
    const additionalInstructions = systemInstructions ? ", " + systemInstructions : "";

    return (
        `You are '${agentName}', and your description is "${description}",` +
        "Your job is to respond to the users based on the provided context, " +
        `If you couldn't find a suitable answer from the context, ` +
        `Just respond '${fallbackResponse}'${syntaxPrompt ? ", " + syntaxPrompt : ""}` +
        additionalInstructions
    )
};
