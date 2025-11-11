import { Client as PostgresClient } from "deno.land/x/postgres";

export default async function insertAgentsIntoDB(
    { db, agents }:
        { db: PostgresClient, agents: (Pick<Agent, "agentName" | "description" | "userEmail" | "avatar"> & { id?: string })[] }
) {
    const withId = !!agents[0].id
    const fields = `agent_name, description, user_email${withId ? ", id" : ""}`;
    const fieldsCount = fields.split(",").length

    const placeholders = agents.map((_, i) => (
        `($${i * fieldsCount + 1}, $${i * fieldsCount + 2}, $${i * fieldsCount + 3}${withId ? `,$${i * fieldsCount + 4}` : ""})`
    )).join(", ")

    const valuse = agents.flatMap((agent) => {
        const vals = [agent.agentName, agent.description, agent.userEmail]
        if (withId) {
            vals.push(agent.id || "")
        }
        return vals
    })

    const { rows } = await db.queryObject<{ id: string }>({
        text: `INSERT INTO agents(${fields}) VALUES ${placeholders} RETURNING id;`,
        args: valuse
    })

    return rows
};

