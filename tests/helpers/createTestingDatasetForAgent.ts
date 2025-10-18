import { Client as PostgresClient } from "deno.land/x/postgres";
import { QdrantClient } from "qdrant";
import { Client as MinioClient } from "minio/dist/esm/minio.d.mts";
import insertUserIntoDB from "./insertUserIntoDB.ts";
import insertAgentsIntoDB from "./insertAgentsIntoDB.ts";
import mockInstructions from "../mock/data/mockInstructions.ts";
import { getMockDatasetFile, mockDatasetForAgents } from "../mock/data/mockDataset.ts";
import { Readable } from "node:stream";

type Params = {
    db: PostgresClient,
    vectorDB?: QdrantClient,
    objectStorage: MinioClient,
    user: SignUpUserInput,
    agent: (Pick<Agent, "agentName" | "description"> & { id?: string }),
    dontEmbed?: boolean,
}

export default async function createTestingDatasetForAgent({ db, vectorDB, objectStorage, user, agent, dontEmbed }: Params) {
    await insertUserIntoDB({ db, user })
    const [{ id: newAgentId }] = await insertAgentsIntoDB({
        db,
        agents: [{
            agentName: agent.agentName,
            description: agent.description,
            userEmail: user.email,
            id: agent.id
        }]
    })

    const newDatasetId = crypto.randomUUID();

    const newDataset = mockDatasetForAgents({
        id: newAgentId,
        agentName: agent.agentName,
    })

    const { rows: [newDatasetData] } = await db.queryObject<Dataset>({
        text: `
            INSERT INTO datasets (id, title, description, agent_id, status, user_email) 
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `,
        args: [newDatasetId, newDataset.title, newDataset.description, newAgentId, "processed", user.email],
        camelCase: true
    })

    await db.queryObject(
        `UPDATE agents SET dataset_id = $1 WHERE id = $2`,
        [newDatasetId, newAgentId]
    )

    const mockDatasetFile = getMockDatasetFile()

    await objectStorage.putObject(
        "datasets",
        newDatasetId,
        Readable.from(mockDatasetFile.stream()),
        mockDatasetFile.size,
        { "user-email": user.email, 'Content-Type': mockDatasetFile.type },
    )

    if (!dontEmbed && vectorDB) {
        const testingEmbeddingFileURL = import.meta.resolve("../mock/data/testingEmbedding.json");
        const testingEmbedding = JSON.parse(Deno.readTextFileSync(testingEmbeddingFileURL.replace("file://", "")));

        await vectorDB.upsert(
            "datasets",
            {
                wait: true,
                points: mockInstructions.map((instruction) => {
                    return {
                        payload: {
                            ...instruction,
                            datasetId: newDatasetId,
                            userEmail: user.email,
                            id: instruction.id,
                        },
                        id: crypto.randomUUID(),
                        vector: testingEmbedding
                    }
                })
            }
        )
    }

    return {
        newDatasetId,
        newDatasetData,
        newAgentId,
    }
};
