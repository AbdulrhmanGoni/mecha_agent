import process from "node:process";

const testType = process.argv[process.argv.length - 1];

const testCommand = `exec testing_server_container deno test -N -R -E --env-file=docker/.env.testing tests/${testType}/index.test.ts`

const runTestsCommand = new Deno.Command("docker", {
    args: testCommand.split(" ")
});

await runTestsCommand.spawn().output();
