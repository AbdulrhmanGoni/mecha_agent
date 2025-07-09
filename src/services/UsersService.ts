import { DatabaseService } from "./DatabaseService.ts";
import { PasswordHasher } from "../helpers/passwordHasher.ts";
import { ObjectStorageService } from "./ObjectStorageService.ts";
import { mimeTypeToFileExtentionMap } from "../constant/supportedFileTypes.ts";
import { plans } from "../constant/plans.ts";

const userRowFieldsNamesMap: Record<string, string> = {
    lastSignIn: "last_sign_in",
}

export class UsersService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly objectStorage: ObjectStorageService,
        private readonly kvStore: Deno.Kv,
    ) { }

    async create(userInput: SignUpUserInput) {
        const hashedPassword = await PasswordHasher.hash(userInput.password);

        const { rows } = await this.databaseService.query<Pick<User, "avatar" | "email"> & { name: string }>({
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
        const { rows } = await this.databaseService.query<User>({
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
        const { rows } = await this.databaseService.query<User>({
            text: `SELECT email FROM users WHERE email = $1`,
            args: [userEmail],
        });

        return !!rows[0]
    }

    async getUserData(email: string) {
        const { rows } = await this.databaseService.query<User>({
            text: `
                SELECT 
                users.username as name, 
                users.avatar, 
                users.signing_method, 
                users.last_sign_in, 
                users.current_plan, 
                users.api_keys_count, 
                users.agents_count,
                users.published_agents,
                users.datasets_count,
                    CASE 
                        WHEN subscriptions.subscription_id IS NOT NULL THEN
                            json_build_object(
                                'createdAt', subscriptions.created_at,
                                'status', subscriptions.status
                            )
                        ELSE NULL 
                    END AS subscription
                FROM users 
                LEFT JOIN subscriptions ON users.subscription_id = subscriptions.subscription_id
                WHERE users.email = $1
            `,
            args: [email],
            camelCase: true,
        });

        if (rows[0]) {
            const userInferences = await this.kvStore.get<bigint>(["inferences", email, rows[0].currentPlan])
            const lastWeekInferences = await this.kvStore.get<number[]>(["last-week-inferences", email])

            return {
                ...rows[0],
                email,
                todayInference: {
                    current: Number(userInferences.value || 0),
                    max: plans.find((p) => p.planName === rows[0].currentPlan)?.maxInferencesPerDay
                },
                lastWeekInferences: lastWeekInferences.value || []
            }
        }

        return null
    }

    async update(email: string, updateData: UpdateUserData) {
        const { newAvatar, removeAvatar, ...updateUserData } = updateData
        let newAvatarId: string = ""

        if (removeAvatar) {
            Object.assign(updateUserData, { avatar: null });
        }

        if (newAvatar?.size && newAvatar?.name) {
            const fileExtention = mimeTypeToFileExtentionMap[newAvatar.type];
            newAvatarId = `${crypto.randomUUID()}.${fileExtention}`;
            Object.assign(updateUserData, { avatar: newAvatarId });
        }

        type UpdateDataFormat = [string, (string | Date)[]]
        const [fields, values] = Object
            .entries(updateUserData)
            .reduce<UpdateDataFormat>(([fields, values], [field, value], i, arr) => {
                return [
                    (
                        fields +
                        `${userRowFieldsNamesMap[field] || field} = $${i + 2}` +
                        `${i === arr.length - 1 ? "" : ", "}`
                    ),
                    [...values, value || ""]
                ]
            }, ["", []])

        const transaction = this.databaseService.createTransaction("update_user_data")
        await transaction.begin();

        const { rowCount, rows: [{ avatar: oldAvatar }] } = await transaction.queryObject<User>({
            text: `UPDATE users SET ${fields} WHERE email = $1 RETURNING avatar`,
            args: [email, ...values],
        });

        if (rowCount) {
            let uploadFileFailed = false;

            if (newAvatar && newAvatarId) {
                uploadFileFailed = await this.objectStorage.uploadFile(
                    this.objectStorage.buckets.usersAvatars,
                    newAvatar,
                    {
                        id: newAvatarId,
                        metaData: { "user-email": email }
                    }
                )
                    .then(() => false)
                    .catch(() => true)
            }

            if (oldAvatar && (removeAvatar || newAvatar)) {
                await this.objectStorage.deleteFile(
                    this.objectStorage.buckets.usersAvatars,
                    oldAvatar,
                )
            }

            if (!uploadFileFailed) {
                await transaction.commit();

                return true
            }
        }

        await transaction.rollback();

        return false
    }

    async changePassword(email: string, newPassword: string) {
        const hashedPassword = await PasswordHasher.hash(newPassword);

        const { rowCount } = await this.databaseService.query({
            text: `UPDATE users SET password = $2 WHERE email = $1`,
            args: [email, hashedPassword],
        });

        return !!rowCount
    }

    async delete(email: string) {
        const { rowCount: userDeleted } = await this.databaseService.query({
            text: `DELETE FROM users WHERE email = $1`,
            args: [email],
        });

        return !!userDeleted
    }
}
