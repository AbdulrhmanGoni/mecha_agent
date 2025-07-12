import { bootstrapServices } from "./services/bootstrap.ts";
import bootstrapControllers from "./controllers/bootstrap.ts";
import bootstrapRoutes from "./routes/bootstrap.ts";
import { bootstrapConfigurations } from "./configurations/bootstrap.ts";
import bootstrapMiddlewares from "./middlewares/bootstrap.ts";
import performanceInSeconds from "./helpers/performanceInSeconds.ts";

export default async function bootstrapApp() {
    console.log("Bootstrapping configurations...");
    const configurationsStart = performance.now();
    const configurations = await bootstrapConfigurations();
    console.log(`Configurations bootstrapped in ${performanceInSeconds(configurationsStart)}`);

    console.log("Bootstrapping services...");
    const servicesStart = performance.now();
    const services = await bootstrapServices(configurations);
    console.log(`Services bootstrapped in ${performanceInSeconds(servicesStart)}`);

    console.log("Bootstrapping middlewares...");
    const middlewaresStart = performance.now();
    const middlewares = bootstrapMiddlewares({
        configs: {
            kvStoreClient: configurations.kvStoreClient,
            databaseClient: configurations.databaseClient,
        }
    });
    console.log(`Middlewares bootstrapped in ${performanceInSeconds(middlewaresStart)}`);

    console.log("Bootstrapping controllers...");
    const controllersStart = performance.now();
    const controllers = bootstrapControllers({
        services,
        configs: {
            kvStoreClient: configurations.kvStoreClient,
        }
    });
    console.log(`Controllers bootstrapped in ${performanceInSeconds(controllersStart)}`);

    console.log("Bootstrapping routes...");
    const routesStart = performance.now();
    const app = bootstrapRoutes({
        controllers,
        middlewares,
        services: {
            guardService: services.guardService,
        },
    });
    console.log(`Routes bootstrapped in ${performanceInSeconds(routesStart)}`);

    return app
};
