import { hash } from "deno.land/x/bcrypt";
import { DatabaseService } from "./DatabaseService.ts";
import { ObjectStorageService } from "./ObjectStorageService.ts";
import { mimeTypeToFileExtentionMap } from "../constant/supportedFileTypes.ts";

const userRowFieldsNamesMap: Record<string, string> = {
    lastSignIn: "last_sign_in",
}

export class UsersService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly objectStorage: ObjectStorageService,
    ) { }

    async create(userInput: SignUpUserInput) {
        const hashedPassword = await hash(userInput.password);

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
            camelCase: true,
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
            camelCase: true,
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
}
