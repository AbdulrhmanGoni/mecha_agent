import { bootstrapServices } from "./services/bootstrap.ts";
import bootstrapControllers from "./controllers/bootstrap.ts";
import bootstrapRoutes from "./routes/bootstrap.ts";
import { bootstrapConfigurations } from "./configurations/bootstrap.ts";

export default async function bootstrapApp() {
    const configurations = await bootstrapConfigurations();

    const services = await bootstrapServices(configurations);

    const controllers = bootstrapControllers({
        services,
    });

    const app = bootstrapRoutes({
        controllers,
        services: {
            guardService: services.guardService,
        },
    });

    return app
};
