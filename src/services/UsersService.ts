import { type Client as PostgresClient } from "deno.land/x/postgres";
import { PasswordHasher } from "../helpers/passwordHasher.ts";
import { ObjectStorageService } from "./ObjectStorageService.ts";
import { plans } from "../constant/plans.ts";
import { SubscriptionsService } from "./SubscriptionsService.ts";

const userRowFieldsNamesMap: Record<string, string> = {
    lastSignIn: "last_sign_in",
}

export class UsersService {
    constructor(
        private readonly dbClient: PostgresClient,
        private readonly objectStorage: ObjectStorageService,
        private readonly kvStore: Deno.Kv,
        private readonly subscriptionsService: SubscriptionsService,
    ) { }

    async create(userInput: SignUpUserInput) {
        const hashedPassword = await PasswordHasher.hash(userInput.password);

        const { rows } = await this.dbClient.queryObject<Pick<User, "avatar" | "email"> & { name: string }>({
            text: `
                INSERT INTO users(username, email, password, avatar, signing_method) 
                VALUES($1, $2, $3, $4, $5)
                RETURNING username as name, email, avatar;
            `,
            args: [
                userInput.username,
                userInput.email,
                hashedPassword,
                userInput.avatar,
                userInput.signingMethod,
            ],
        });

        if (rows[0]) {
            return rows[0]
        }

        return null
    }

    async getByEmail(email: string) {
        const { rows } = await this.dbClient.queryObject<User>({
            text: `SELECT * FROM users WHERE email = $1`,
            args: [email],
            camelCase: true,
        });

        if (rows[0]) {
            return rows[0]
        }

        return null
    }

    async checkUserExistance(userEmail: string) {
        const { rows } = await this.dbClient.queryObject<User>({
            text: `SELECT email FROM users WHERE email = $1`,
            args: [userEmail],
        });

        return !!rows[0]
    }

    async getUserData(email: string) {
        const { rows } = await this.dbClient.queryObject<User>({
            text: `
                SELECT 
                    username as name, 
                    avatar, 
                    signing_method, 
                    last_sign_in, 
                    api_keys_count, 
                    agents_count,
                    published_agents,
                    datasets_count
                FROM users 
                WHERE users.email = $1
            `,
            args: [email],
            camelCase: true,
        });

        if (rows[0]) {
            const subscription = await this.subscriptionsService.getUserSubscriptionData(email)
            const userPlan = subscription ? subscription.planName : "Free"
            const userInferences = await this.kvStore.get<bigint>(["inferences", email])
            const lastWeekInferences = await this.kvStore.get<number[]>(["last-week-inferences", email])

            return {
                ...rows[0],
                email,
                subscription,
                todayInference: {
                    current: Number(userInferences.value || 0),
                    max: plans.find((p) => p.planName === userPlan)?.maxInferencesPerDay
                },
                lastWeekInferences: lastWeekInferences.value || [],
            }
        }

        return null
    }

    async update(email: string, updateData: UpdateUserData) {
        const { removeAvatar, ...updateUserData } = updateData
        let oldAvatar: string | undefined;
        if (removeAvatar || updateUserData.avatar) {
            const { rows: [user] } = await this.dbClient.queryObject<User>({
                text: "SELECT avatar FROM users WHERE email = $1",
                args: [email],
            })
            oldAvatar = user.avatar
            removeAvatar && Object.assign(updateUserData, { avatar: null });
        }

        type UpdateDataFormat = [string, (string | Date | null)[]]
        const [fields, values] = Object
            .entries(updateUserData)
            .reduce<UpdateDataFormat>(([fields, values], [field, value], i, arr) => {
                return [
                    (
                        fields +
                        `${userRowFieldsNamesMap[field] || field} = $${i + 2}` +
                        `${i === arr.length - 1 ? "" : ", "}`
                    ),
                    [...values, value ?? null]
                ]
            }, ["", []])

        const transaction = this.dbClient.createTransaction("update_user_data")
        await transaction.begin();

        const { rowCount } = await transaction.queryObject<User>({
            text: `UPDATE users SET ${fields} WHERE email = $1;`,
            args: [email, ...values],
        });

        if (rowCount) {
            if (oldAvatar) {
                this.objectStorage.deleteAvatars(oldAvatar);
            }
            await transaction.commit();
            return true
        }

        await transaction.rollback();
        return false
    }

    async changePassword(email: string, newPassword: string) {
        const hashedPassword = await PasswordHasher.hash(newPassword);

        const { rowCount } = await this.dbClient.queryObject({
            text: `UPDATE users SET password = $2 WHERE email = $1`,
            args: [email, hashedPassword],
        });

        return !!rowCount
    }

    async delete(email: string) {
        const { rowCount: userDeleted } = await this.dbClient.queryObject({
            text: `DELETE FROM users WHERE email = $1`,
            args: [email],
        });

        if (userDeleted) {
            const aSecond = 1000;
            const aMinute = aSecond * 60;
            const enqueueingResult = await this.kvStore.enqueue(
                { task: "delete_user_legacy", payload: { userEmail: email } },
                {
                    keysIfUndelivered: [["delete_user_legacy", email, Date.now()]],
                    backoffSchedule: [aSecond * 10, aMinute, aMinute * 5, aMinute * 15],
                    delay: aSecond * 30,
                },
            );

            if (enqueueingResult.ok) {
                return true;
            }

            throw new Error(`Failed to enqueue user deletion task for '${email}'`);
        }

        return false
    }
}
