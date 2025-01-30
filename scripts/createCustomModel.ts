import { Ollama } from "npm:ollama";
import parsedEnvVariables from "../src/configurations/parseEnvironmentVariables.ts";

const ollamaClient = new Ollama({ host: parsedEnvVariables.OLLAMA_HOST });

const modelfile = `
FROM ${parsedEnvVariables.BASE_MODEL_NAME}

PARAMETER temperature 0.1
`

const response = await ollamaClient.create({
    model: parsedEnvVariables.MODEL_NAME,
    modelfile,
})

console.log(
    response.status === "success" ?
        `Model '${parsedEnvVariables.MODEL_NAME}' created based on ${parsedEnvVariables.BASE_MODEL_NAME} model successfully` :
        `Model '${parsedEnvVariables.MODEL_NAME}' creation based on ${parsedEnvVariables.BASE_MODEL_NAME} model failed`
)
