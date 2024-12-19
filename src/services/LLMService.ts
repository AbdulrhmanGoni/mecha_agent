import { Ollama } from "npm:ollama";
import parsedEnvVariables from "../configurations/parseEnvironmentVariables.ts";

export class LLMService {
    constructor(private readonly ollamaClient: Ollama) { }

    async generate(prompt: string, system: string) {
        return await this.ollamaClient.generate({
            model: parsedEnvVariables.MODEL_NAME,
            prompt,
            system,
            keep_alive: "1h",
            stream: true,
        })
    }
}