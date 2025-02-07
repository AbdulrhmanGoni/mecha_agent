import z from "zod";
import { responseSyntaxes } from "../constant/responseSyntaxes.ts";
import { defaultRootUsername, defaultRootPassword } from "../constant/root.ts";
import rootUserSchema from "../validation/auth/rootUserSchema.ts";

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
    SERVER_PORT: z.coerce.number().default(10000),

    ROOT_USERNAME: rootUserSchema.shape.username.default(defaultRootUsername),
    ROOT_PASSWORD: rootUserSchema.shape.password.default(defaultRootPassword),

    DB_PORT: z.coerce.number().default(5432),
    DB_HOST: z.string(),
    DB_NAME: z.string(),
    DB_USERNAME: z.string(),
    DB_PASSWORD: z.string(),

    VECTOR_DB_PORT: z.coerce.number().default(6333),
    VECTOR_DB_HOST: z.string(),

    OBJECT_STORAGE_DB_PORT: z.coerce.number().default(9000),
    OBJECT_STORAGE_DB_HOST: z.string(),
    OBJECT_STORAGE_USERNAME: z.string(),
    OBJECT_STORAGE_PASSWORD: z.string(),

    OLLAMA_HOST: z.string(),

    BASE_MODEL_NAME: z.string().default("llama3.2:3b"),
    MODEL_NAME: z.string().default("Mecha_Agent"),
    EMBEDDING_MODEL_NAME: z.string().default("all-minilm:l6-v2"),
    DEFAULT_DONT_KNOW_RESPONSE: z.string().default("Sorry!, I don't have enough information to answer"),
    DEFAULT_RESPONSE_SYNTAX: z.enum(responseSyntaxes).optional(),
    DEFAULT_GREETING_MESSAGE: z.string().default("Hello, How can i help you?"),

    JWT_SECRET_KEY: z.string(),
});

const parsedEnvVariables = parseEnvironmentVariables(envSchema);

export default parsedEnvVariables