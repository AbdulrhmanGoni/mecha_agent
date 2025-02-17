import { Ollama } from "ollama";
import parsedEnvVariables from "../src/configurations/parseEnvironmentVariables.ts";

const ollamaClient = new Ollama({ host: parsedEnvVariables.OLLAMA_HOST });

const response = await ollamaClient.create({
    model: parsedEnvVariables.MODEL_NAME,
    from: parsedEnvVariables.BASE_MODEL_NAME,
    parameters: {
        temperature: 0.1
    }
})

console.log(
    response.status === "success" ?
        `Model '${parsedEnvVariables.MODEL_NAME}' created based on '${parsedEnvVariables.BASE_MODEL_NAME}' model successfully` :
        `Model '${parsedEnvVariables.MODEL_NAME}' creation based on '${parsedEnvVariables.BASE_MODEL_NAME}' model failed`
)
