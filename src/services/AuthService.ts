import { UsersService } from "./UsersService.ts";
import { PasswordHasher } from "../helpers/passwordHasher.ts";
import { MailsSenderService } from "./MailsSenderService.ts";
import generateOTP from "../helpers/generateOTP.ts";
import createOneTimePasswordMail from "../helpers/createOneTimePasswordMail.ts";
import randomString from "../helpers/randomString.ts";

type OneTimePasswordsStore = {
    otp: string;
    signature: string;
}

const OTPs = new Map<string, OneTimePasswordsStore>();
const verifiedEmails = new Set<string>();

export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly mailsSenderService: MailsSenderService,
    ) { }

    otpVerificationPeriodInMs = 1000 * 60 * 3;

    async signUpUser(userInput: SignUpUserInput) {
        if (userInput.signingMethod === "credentials" && !verifiedEmails.has(userInput.email)) {
            return {
                notVerifiedEmail: true
            }
        }

        const user = await this.usersService.getByEmail(userInput.email);

        if (user) {
            return {
                existingWithSameSigingMethod: user.signingMethod === userInput.signingMethod
            }
        }

        const newUser = await this.usersService.create(userInput);

        return {
            newUser
        }
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
        const { accepted } = await this.mailsSenderService.send({
            subject: "Email Verification",
            text: "Hi, Here is your one time password (OTP) to verify your email with Mecha Agent platform: " + otp,
            to: email,
            html: await createOneTimePasswordMail(otp),
        });

        const mailSent = accepted.some(email => email === email);

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

    verifyOTP(email: string, otp: string, signature: string) {
        const otpStore = OTPs.get(email);

        if (otp === otpStore?.otp && signature === otpStore?.signature) {
            OTPs.delete(email);
            verifiedEmails.add(email)
            setTimeout(() => {
                verifiedEmails.delete(email)
            }, this.otpVerificationPeriodInMs)
            return true
        }

        return false
    }
}