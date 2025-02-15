type SignInUserInput = {
    email: string;
    password: string;
    signingMethod: string;
}

type SignUpUserInput = SignInUserInput & {
    username: string;
    avatar?: string | null;
}

type User = SignUpUserInput & {
    createdAt: Date;
    lastSignIn: Date;
}
