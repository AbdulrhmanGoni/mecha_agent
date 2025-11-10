const [env, ...restArgs] = Deno.args

const migrationCommand = new Deno.Command(
    Deno.execPath(),
    { args: ["-E", "--allow-run", "dbmate", "--env-file", "docker/.env." + env, ...restArgs] }
)

migrationCommand.spawn().output()