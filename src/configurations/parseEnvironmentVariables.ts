import z from "zod";
import { responseSyntaxes } from "../constant/responseSyntaxes.ts";

function parseEnvironmentVariables<
    T extends z.ZodObject<z.ZodRawShape, z.UnknownKeysParam, z.ZodTypeAny>,
>(schema: T): z.infer<typeof schema> {
    const vars: Record<string, string | undefined> = {};
    for (const key in schema._def.shape()) {
        const permissionRequest = Deno.permissions.requestSync({ name: "env", variable: key })
        if (permissionRequest.state === "granted") {
            vars[key] = Deno.env.get(key);
        }
    }

    return schema.parse(vars);
};

const envSchema = z.object({
    DENO_ENV: z.enum(["testing", "production", "development"]).default("development"),

    GEMINI_API_KEY: z.string().optional(),

    SERVER_PORT: z.coerce.number().default(10000),

    DB_PORT: z.coerce.number().optional(),
    DB_HOST: z.string(),
    DB_NAME: z.string(),
    DB_USERNAME: z.string(),
    DB_PASSWORD: z.string(),
    DB_REQUIRE_SSL_MODE: z.string().optional(),

    VECTOR_DB_PORT: z.coerce.number().optional(),
    VECTOR_DB_HOST: z.string(),
    VECTOR_DB_API_KEY: z.string().optional(),

    OBJECT_STORAGE_DB_PORT: z.coerce.number().default(9000),
    OBJECT_STORAGE_DB_HOST: z.string(),
    OBJECT_STORAGE_USERNAME: z.string(),
    OBJECT_STORAGE_PASSWORD: z.string(),

    OLLAMA_HOST: z.string().optional(),

    MODEL_NAME: z.string().default("qwen2.5:3b-instruct"),
    EMBEDDING_MODEL_NAME: z.string().default("all-minilm:l6-v2"),
    DEFAULT_RESPONSE_SYNTAX: z.enum(responseSyntaxes).optional(),
    DEFAULT_GREETING_MESSAGE: z.string().default("Hello, How can i help you?"),

    JWT_SECRET_KEY: z.string(),
});

const parsedEnvVariables = parseEnvironmentVariables(envSchema);

export default parsedEnvVariables