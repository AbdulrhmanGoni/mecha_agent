import { bootstrapConfigurations } from "../src/configurations/bootstrap.ts";

export default async function bootstrapTestingConfigs() {
    const configurations = await bootstrapConfigurations();

    return {
        configurations,
    };
};

export type TestingAppConfigs = Awaited<ReturnType<typeof bootstrapTestingConfigs>>