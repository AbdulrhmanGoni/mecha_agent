const stopTestingContainers = new Deno.Command("docker", {
    args: ["compose", "-f", "docker/docker-compose-test.yml", "stop"]
});

await stopTestingContainers.spawn().output();

const removeTestingContainers = new Deno.Command("docker", {
    args: ["compose", "-f", "docker/docker-compose-test.yml", "rm", "-v", "-f"]
});

await removeTestingContainers.spawn().output();
