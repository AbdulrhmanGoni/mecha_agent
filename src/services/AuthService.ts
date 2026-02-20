import { UsersService } from "./UsersService.ts";
import { PasswordHasher } from "../helpers/passwordHasher.ts";
import { MailsSenderService } from "./MailsSenderService.ts";
import generateOTP from "../helpers/generateOTP.ts";
import createOneTimePasswordMail from "../helpers/createOneTimePasswordMail.ts";
import randomString from "../helpers/randomString.ts";

function formVerifiedEmailRecord(email: string, validFor: ValidationPurpose): Deno.KvKey {
    return ["verified-emails", validFor, email]
}

function formLoginTriesRecordKey(email: string): Deno.KvKey {
    return ["login-tries", email]
}

export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly mailsSenderService: MailsSenderService,
        private readonly kvStore: Deno.Kv,
    ) { }

    protected otpVerificationPeriodInMs = 60000 * 3; // 3 minutes
    protected maxLoginTries = 10;
    protected loginTriesPeriodInMs = 60000 * 30; // 30 minutes

    async signUpUser(userInput: SignUpUserInput) {
        if (userInput.signingMethod === "credentials") {
            const verifiedEmailRecord = await this.kvStore.get<boolean>(formVerifiedEmailRecord(userInput.email, "sign-up"))
            if (!verifiedEmailRecord.value) {
                return {
                    notVerifiedEmail: true
                }
            }
        }

        const user = await this.usersService.getByEmail(userInput.email);

        if (user) {
            return {
                userExists: true,
                notSameSigningMethod: user.signingMethod != userInput.signingMethod
            }
        }

        const newUser = await this.usersService.create(userInput);

        return {
            newUser
        }
    }

    async checkEmailExistance(email: string) {
        const userExists = await this.usersService.checkUserExistance(email);

        return userExists
    }

    async signInUser(userInput: SignInUserInput) {
        const loginTriesKey = formLoginTriesRecordKey(userInput.email);
        const tries = await this.kvStore.get<number>(loginTriesKey);

        if (tries.value && tries.value >= this.maxLoginTries) {
            return {
                success: false,
                tooManyTries: true
            }
        }

        const user = await this.usersService.getByEmail(userInput.email);
        if (user) {
            if (user.signingMethod !== userInput.signingMethod) {
                await this.incrementLoginTries(userInput.email);
                return {
                    success: false,
                    wrongSigningMethod: true
                }
            }

            const isMatched = await PasswordHasher.verify(
                userInput.password,
                user.password,
            );

            if (isMatched) {
                await this.kvStore.delete(loginTriesKey);
                await this.usersService.update(userInput.email, { lastSignIn: new Date() })
                    .then(() => true)
                    .catch(() => false)

                return {
                    success: true,
                    user: {
                        name: user.username,
                        email: user.email,
                        avatar: user.avatar
                    }
                }
            }
        }

        await this.incrementLoginTries(userInput.email);

        return {
            success: false,
            noUser: !user
        }
    }

    private async incrementLoginTries(email: string) {
        const loginTriesKey = formLoginTriesRecordKey(email);
        const tries = await this.kvStore.get<number>(loginTriesKey);
        const newValue = tries.value ? tries.value + 1 : 1;
        await this.kvStore.set(loginTriesKey, newValue, { expireIn: this.loginTriesPeriodInMs });
    }

    async generateAndSendOTP(email: string) {
        const otp = generateOTP()
        const mailSent = await this.mailsSenderService.send({
            subject: "Email Verification",
            text: "Hi, Here is your one time password (OTP) to verify your email with Mecha Agent platform: " + otp,
            to: [email],
            html: await createOneTimePasswordMail(otp),
        });

        if (mailSent) {
            const signature = randomString(10);
            await this.kvStore.set(
                ["OTPs", email],
                { otp, signature },
                { expireIn: this.otpVerificationPeriodInMs }
            )

            return {
                otpSent: mailSent,
                otp,
                signature,
            }
        }

        return { otpSent: mailSent }
    }

    async verifyOTP({ email, otp, signature, purpose }: VerifyEmailResponseInput) {
        const otpRecordKey: Deno.KvKey = ["OTPs", email]
        const { value } = await this.kvStore.get<OneTimePasswordRecord>(otpRecordKey);

        if (otp === value?.otp && signature === value?.signature) {
            const verifiedEmailRecord = formVerifiedEmailRecord(email, purpose);
            const { ok } = await this.kvStore.atomic()
                .set(verifiedEmailRecord, true, { expireIn: this.otpVerificationPeriodInMs })
                .delete(otpRecordKey)
                .commit()

            return ok
        }

        return false
    }

    async changePassword(userEmail: string, changePasswordInput: ChangePasswordInput) {
        const user = await this.usersService.getByEmail(userEmail);

        if (user) {
            if (user.signingMethod !== "credentials") {
                return {
                    success: false,
                    wrongSigningMethod: true
                }
            }

            const isMatched = await PasswordHasher.verify(
                changePasswordInput.currentPassword,
                user.password,
            );

            if (isMatched) {
                const passwordChanged = await this.usersService.changePassword(userEmail, changePasswordInput.newPassword)

                return { success: passwordChanged }
            } else {
                return {
                    success: false,
                    wrongPassword: true,
                }
            }
        }

        return { success: false }
    }

    async resetPassword(userEmail: string, newPassword: string) {
        const verifiedEmailRecord = await this.kvStore.get<boolean>(formVerifiedEmailRecord(userEmail, "reset-password"))
        if (!verifiedEmailRecord.value) {
            return {
                success: false,
                notVerifiedEmail: true
            }
        }

        const user = await this.usersService.getByEmail(userEmail);

        if (user) {
            if (user.signingMethod !== "credentials") {
                return {
                    success: false,
                    wrongSigningMethod: true
                }
            }

            const passwordReset = await this.usersService.changePassword(userEmail, newPassword)
            return { success: passwordReset }
        }

        return { success: false }
    }
}