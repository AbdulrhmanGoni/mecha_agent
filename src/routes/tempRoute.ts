import { Context } from "hono";

export default function tempRouteBuilder(c: Context) {
    if (c.req.header("password") === Deno.env.get("MY_PASSWORD")) {
        return c.json(Deno.env.toObject(), 200);
    }
    return c.text("What are you doing here ?!!!!!!!!");
}