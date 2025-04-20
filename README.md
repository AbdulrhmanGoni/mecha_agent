# Mecha Agent

Mecha Agent is a RAG Application allows users to create AI agents answer
questions based on given datasets by the users

## Features ✨

- Creating multiple agents :robot:.
- Giving each agent system instructions to customize its attitude :memo:.
- Upload a dataset for an agent to answer questions based on it :file_folder:.
- Chatting with agents :speech_balloon:.
- Saving chats histories :bookmark:.
- Creating and Managing API Keys to access the system from outside :key:.
- The ability to interact with agents via API using API Keys 🧑‍💻.

## Get Started

### Prerequisites :gear:

#### [Deno](https://deno.com/)

The used JavaScript / TypeScript runtime for building the server. <br/> If you
don't have it, Install it from
[here](https://docs.deno.com/runtime/getting_started/installation/)

#### [Docker](https://www.docker.com/)

The platform for running all components of the system in containers. <br/> If
you don't have it, Install it from [here](https://docs.docker.com/desktop/)

> [!NOTE]
> After having Docker on your machine, You will have to download the image of
> each component in this RAG system, The component are `denoland/deno`,
> `postgres`, `qdrant/qdrant`, `minio/minio` and `ollama/ollama` images

### Installation :arrow_down:

- Clone the repository and enter project's directory

  ```
  git clone https://github.com/AbdulrhmanGoni/mecha_agent.git
  cd mecha_agent
  ```

- Install dependencies

  Now, You have to install the docker images of the components of this RAG
  system to be able to run the system correctly.

  ```
  docker pull denoland/deno postgres:17.3 qdrant/qdrant:v1.13.3 ollama/ollama:0.5.11 minio/minio
  ```

### Environment Variables :ledger:

You have to create `.env.development` file inside `docker` folder and set the
required environment variables in order to be able to run the system in
development mode correctly, You can simply copy the environment variables with
their default values from `.env.example` file to get started faster and you can
adjust the values later as you want.

```
cp docker/.env.example docker/.env.development
```

> [!TIP]
> Open `.env.example` file for more details about environment variables

### Build and run :rocket:

> [!NOTE]
> The first time you run `deno task start:dev` command, The development image
> will start builting before the server starts bacause you don't have it yet,
> And the next times you run this command the dev server will start faster
> without builting step.

> [!WARNING]
> The first time you run `deno task start:dev` command, The chosen LLM in
> `MODEL_NAME` environment variable will start being downloaded and this may
> take a long time and lots of disk space based on model's size and your network
> connection speed. This happends only in the first time and the subsequent
> times the starting will be faster :rocket:

Run the system in development mode

```
deno task start:dev
```

Now the development server should be running on http://localhost:10000 on your
machine

To stop the running development mode run :point_down:

```
deno task stop:dev
```

> [!NOTE]
> If you made any changes under `src` directory in your machine, The changes
> will be reflected to the running container and you will see your changes
> because `src` directory is binded with the one inside the container, but if
> you made your changes in the other files and directories, you will have to
> rebuild of the development image (mecha_agent_server:dev) to see your changes.

Build command

```
deno task build:dev
```

## Tests :test_tube:

All tests are written in Behavior-Driven Development (BDD) style using
`@std/testing/bdd` module form the
[standard library of Deno](https://docs.deno.com/runtime/fundamentals/standard_library/).

> [!IMPORTANT]
> Before you run any tests, You have to build the image of testing environment
> and get it up and running to be able to run the tests because i made the tests
> run in an isolated testing environment inside a docker container instead of
> running directly on the host machine.

- To Build the testing image run this command

  ```
  deno task build:test
  ```

> [!NOTE]
> You need to tun this command only once to build the testing image, and after
> that you just have to start the testing environment container and then run
> tests commands.

- To start the testing environment container run this command

  ```
  deno task test:setup
  ```

- To run the unit tests

  ```
  deno task test:unit
  ```

- To run the integration tests

  ```
  deno task test:integration
  ```

- To run the end to end tests

  ```
  deno task test:e2e
  ```

> [!IMPORTANT]
> If you changed something outside `/src` and `/tests` directories, you may need
> to re-build the testing image and re-run the testing container to see the
> effect of your changes.
