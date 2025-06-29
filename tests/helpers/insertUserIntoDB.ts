import { Client as PostgresClient } from "deno.land/x/postgres";
import { hash } from "argon2";

export default async function insertUserIntoDB({ db, user }: { db: PostgresClient, user: SignUpUserInput }) {
    const hashedPassword = await hash(user.password);

    return db.queryObject({
        text: `
        INSERT INTO users(username, email, password, signing_method) 
        VALUES($1, $2, $3, $4)
    `,
        args: [
            user.username,
            user.email,
            hashedPassword,
            user.signingMethod,
        ]
    })
};
