import { Client as PostgresClient } from "deno.land/x/postgres";
import { testingUserCredentials } from "../mock/data/mockUsers.ts";

export default async function createTestingDataset(db: PostgresClient) {
    const newDataset = {
        title: "New Dataset",
        description: "New Dataset description",
    }

    const { rows: [dataset] } = await db.queryObject<Dataset>({
        text: 'INSERT INTO datasets (title, description, user_email) VALUES ($1, $2, $3) RETURNING *',
        args: [
            newDataset.title,
            newDataset.description,
            testingUserCredentials.email
        ],
    });

    return dataset
};
