import { compare } from "deno.land/x/bcrypt";
import { UsersService } from "./UsersService.ts";

export class AuthService {
    constructor(
        private readonly usersService: UsersService,
    ) { }

    async signUpUser(userInput: SignUpUserInput) {
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

            const isMatched = await compare(userInput.password, user.password);

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
}