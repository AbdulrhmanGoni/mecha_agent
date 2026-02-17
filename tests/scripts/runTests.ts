import process from "node:process";

const testType = process.argv[process.argv.length - 1];

const testCommand = `exec testing_server_container deno test -N -R -E --unstable-kv --env-file=docker/.env.testing tests/${testType}/index.test.ts`

const runTestsCommand = new Deno.Command("docker", {
    args: testCommand.split(" ")
});

await runTestsCommand.spawn().output()
    .then((output) => {
        if (output.code === 0) {
            console.log("All e2e tests successfully passed ✅");
        } else {
            throw new Error("One or more e2e tests failed ❌");
        }
    })
