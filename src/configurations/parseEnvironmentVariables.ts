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

    ROOT_USERNAME: z.string(),
    ROOT_PASSWORD: z.string(),

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
    DONT_KNOW_RESPOND: z.string().optional(),

    JWT_SECRET_KEY: z.string(),
});

const parsedEnvVariables = parseEnvironmentVariables(envSchema);

export default parsedEnvVariables