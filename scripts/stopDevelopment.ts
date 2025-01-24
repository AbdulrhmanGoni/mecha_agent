const stopDevMode = new Deno.Command("docker", {
    args: ["compose", "-f", "docker/docker-compose-dev.yml", "down"]
});

await stopDevMode.spawn().output();
