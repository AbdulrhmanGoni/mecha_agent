import { Ollama } from "npm:ollama";
import parsedEnvVariables from "../src/configurations/parseEnvironmentVariables.ts";

const ollamaClient = new Ollama({ host: parsedEnvVariables.OLLAMA_HOST });

const modelfile = `FROM ${parsedEnvVariables.BASE_MODEL_NAME}`

const response = await ollamaClient.create({
    model: parsedEnvVariables.MODEL_NAME,
    modelfile,
})

console.log(
    response.status === "success" ?
        `Model '${parsedEnvVariables.MODEL_NAME}' created successfully` :
        `Model '${parsedEnvVariables.MODEL_NAME}' creation failed`
)
