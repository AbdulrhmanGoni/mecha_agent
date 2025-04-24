import { bootstrapServices } from "./services/bootstrap.ts";
import bootstrapControllers from "./controllers/bootstrap.ts";
import bootstrapRoutes from "./routes/bootstrap.ts";
import { bootstrapConfigurations } from "./configurations/bootstrap.ts";
import bootstrapMiddlewares from "./middlewares/bootstrap.ts";

export default async function bootstrapApp() {
    const configurations = await bootstrapConfigurations();

    const services = await bootstrapServices(configurations);

    const middlewares = bootstrapMiddlewares({
        configs: {
            kvStoreClient: configurations.kvStoreClient,
        }
    });

    const controllers = bootstrapControllers({
        services,
        configs: {
            kvStoreClient: configurations.kvStoreClient,
        }
    });

    const app = bootstrapRoutes({
        controllers,
        middlewares,
        services: {
            guardService: services.guardService,
        },
    });

    return app
};
