import { UsersService } from "./UsersService.ts";
import { PasswordHasher } from "../helpers/passwordHasher.ts";
import { MailsSenderService } from "./MailsSenderService.ts";
import generateOTP from "../helpers/generateOTP.ts";
import createOneTimePasswordMail from "../helpers/createOneTimePasswordMail.ts";
import randomString from "../helpers/randomString.ts";

const OTPs = new Map<string, OneTimePasswordsStore>();
const verifiedEmails: VerifiedEmailsStore = new Set();

function formVerifiedEmailRecord(email: string, validFor: ValidationPurpose): VerifiedEmailRecord {
    return `${email}_${validFor}`
}

export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly mailsSenderService: MailsSenderService,
    ) { }

    otpVerificationPeriodInMs = 1000 * 60 * 3;

    async signUpUser(userInput: SignUpUserInput) {
        if (
            userInput.signingMethod === "credentials" &&
            !verifiedEmails.has(formVerifiedEmailRecord(userInput.email, "sign-up"))
        ) {
            return {
                notVerifiedEmail: true
            }
        }

        const user = await this.usersService.getByEmail(userInput.email);

        if (user) {
            return {
                userExists: true,
                notSameSigningMethod: user.signingMethod === userInput.signingMethod
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
        const user = await this.usersService.getByEmail(userInput.email);

        if (user) {
            if (user.signingMethod !== userInput.signingMethod) {
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

        return {
            success: false,
            noUser: !user
        }
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
            OTPs.set(email, { otp, signature })
            setTimeout(() => {
                OTPs.delete(email)
            }, this.otpVerificationPeriodInMs)

            return {
                otpSent: mailSent,
                otp,
                signature,
            }
        }

        return { otpSent: mailSent }
    }

    verifyOTP({ email, otp, signature, purpose }: VerifyEmailResponseInput) {
        const otpStore = OTPs.get(email);

        if (otp === otpStore?.otp && signature === otpStore?.signature) {
            const verifiedEmailRecord = formVerifiedEmailRecord(email, purpose);

            OTPs.delete(email);
            verifiedEmails.add(verifiedEmailRecord)

            setTimeout(() => {
                verifiedEmails.delete(verifiedEmailRecord)
            }, this.otpVerificationPeriodInMs)

            return true
        }

        return false
    }
}