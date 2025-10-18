# Mecha Agent (Web Server)

This is the server side of **Mecha Agent** platform where users create their own
AI agent chatbots, Give them custom instructions and knowledge as dataset, And
publish them for the world to interact and chat with.

## Documentation

Go to the
[**documentation site**](https:abdulrhmangoni.github.io/mecha_agent_docs) of
**Mecha Agent** platform for more info

## Contribution

I welcome any kind of contributions.

Fell free to open an issue when:

- You encounter any problems in while using **Mecha Agent** platform.
- You have an idea to enhance **Mecha Agent** platform (e.g New features or
  improvements).

If you want to contribute by writing code (e.g Impelementing new features or
fixing bugs), Don't hesitate to open a pull request, Follow the following
[Get started](#get-started) guide to set up the **Mecha Agent** server side in
your machine and start your contributions!

### Get Started

#### Prerequisites

##### [Deno](https://deno.com/)

The used JavaScript / TypeScript runtime for building the server. <br/> If you
don't have it, Install it from
[here](https://docs.deno.com/runtime/getting_started/installation/)

##### [Docker](https://www.docker.com/)

The platform for running all components of **Mecha Agent**'s Backend System in
containers. <br/> If you don't have it, Install it from
[here](https://docs.docker.com/desktop/)

#### Setting up development environment

##### Install system's components

First clone the repository and enter project's directory

```
git clone https://github.com/AbdulrhmanGoni/mecha_agent.git
cd mecha_agent
```

Then Install project's dependencies

```
deno install
```

Then you have to download the docker image of each component in this backend
system which are:

- `denoland/deno`
- `postgres:17.3`
- `qdrant/qdrant:v1.13.3`
- `minio/minio`
- `ollama/ollama`
- `prom/prometheus:v3.2.1`
- `grafana/grafana:11.6.0`

```
docker pull denoland/deno postgres:17.3 qdrant/qdrant:v1.13.3 ollama/ollama minio/minio prom/prometheus:v3.2.1 grafana/grafana:11.6.0
```

##### Set up Environment Variables :ledger:

Create `.env.development` file inside `docker` folder and set the required
environment variables in order to be able to run the system in development mode
correctly.

You can simply copy the environment variables with their default values from
`.env.example` file to get started faster and you can adjust the variables later
as you need.

```
cp docker/.env.example docker/.env.development
```

> [!TIP]
> Open `.env.example` file for more details about environment variables

> [!NOTE]
> If you decided to change `MODEL_NAME` or `EMBEDDING_MODEL_NAME` environment
> variables, Make sure that the models you choose are available on
> [Ollama platform](https://ollama.com).

##### Build and run the server :rocket:

Build the image of the project by running the following command

```
deno task build:dev
```

And them run the following command to start the backend system of **MechaAgent**
platform in development mode

```
deno task start:dev
```

Now each component of the backend system should be up and running inside a
docker container on your machine like this :point_down:

```
dev_server_container is running on http://localhost:10000

dev_database_container is running on http://localhost:5432

dev_ollama_container doesn't listen to any port

dev_vector_database_container is running on http://localhost:6333

dev_prometheus_container is running on http://localhost:9090

dev_grafana_container is running on http://localhost:4444

dev_object_storage_container is running on http://localhost:9001
```

Lastly, You need to run the following command to download the Large Language
Model (LLM) that asnwers users queries and the embedding model that converts
datasets to vectors that are supposed to be stored in the vector database
(Qdrant).

> [!NOTE]
> The following command needs the Ollama container up and running to download
> the models inside of it, So make sure to run `deno task start:dev` before
> running the following command.

```
deno task pull-models:dev
```

> [!NOTE]
> If you made any changes under `src` directory of the project in your machine,
> The changes will be reflected to the running container of the server and you
> will see the result of your changes because `src` directory is binded with the
> one inside the container, but if you made your changes in the other files and
> directories, You will need to re-build the image of the server (by running
> `deno task build:dev`) to see the effect of your changes applied.

To shut down the backend system run :point_down:

```sh
deno task stop:dev # Stops and deletes all running containers of the backend system
```

##### Tests :test_tube:

All tests are written in Behavior-Driven Development (BDD) style using
`@std/testing/bdd` module form the
[standard library of Deno](https://docs.deno.com/runtime/fundamentals/standard_library/).

> [!IMPORTANT]
> Before you run any integration or end-to-end tests, You have to build the
> image of testing environment and get it up and running to be able to run the
> tests because i made the tests run in an isolated testing environment inside a
> docker container instead of running directly on the host machine.

To Build the testing image run this command

```
deno task build:test
```

Then you have to get the backend system up running in testing environment by
running run this command

```
deno task test:setup
```

Now each component of the backend system should be up running inside a testing
docker container on your machine, You can then run the differet types of tests
as the following: :point_down:

- To run the integration tests

  ```
  deno task test:integration
  ```

- To run the end to end tests

  ```
  deno task test:e2e
  ```

- To run the unit tests

  ```
  deno task test:unit
  ```

> [!NOTE]
> If you want to run only unit tests, There is no need to run
> `deno task test:setup` command to set up the whole backend system in docker
> containers, You can directly run `deno task test:unit` whenever you want
> because i made unit tests run directly on the host machine (your machine).

> [!IMPORTANT]
> If you changed something outside `/src` and `/tests` directories, you may need
> to re-build the testing image and re-run the testing container to see the
> effect of your changes on the tests.
