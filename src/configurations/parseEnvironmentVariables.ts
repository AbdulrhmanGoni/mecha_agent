import z from "npm:zod";

function parseEnvironmentVariables<
    T extends z.ZodObject<z.ZodRawShape, z.UnknownKeysParam, z.ZodTypeAny>,
>(schema: T): z.infer<typeof schema> {
    const vars: Record<string, string | undefined> = {};
    for (const key in schema._def.shape()) {
        if (
            Deno.permissions.requestSync({ name: "env", variable: key }).state ===
            "granted"
        ) {
            vars[key] = Deno.env.get(key);
        }
    }

    return schema.parse(vars);
};

const envSchema = z.object({
    SERVER_PORT: z.coerce.number().default(10000),

    DB_PORT: z.coerce.number().default(5432),
    DB_HOST: z.string(),
    DB_NAME: z.string(),
    DB_USERNAME: z.string(),
    DB_PASSWORD: z.string(),

    VECTOR_DB_PORT: z.coerce.number().default(6333),
    VECTOR_DB_HOST: z.string(),

    OWNER_NAME: z.string(),
    OLLAMA_HOST: z.string(),
    MODEL_NAME: z.string().default("llama3.2:3b"),
    EMBEDDING_MODEL_NAME: z.string().default("all-minilm:l6-v2"),
    DONT_KNOW_RESPOND: z.string().optional(),

    JWT_SECRET_KEY: z.string(),
});

const parsedEnvVariables = parseEnvironmentVariables(envSchema);

export default parsedEnvVariables