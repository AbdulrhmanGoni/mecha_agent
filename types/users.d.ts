type SignInUserInput = {
    email: string;
    password: string;
    signingMethod: string;
}

type SignUpUserInput = SignInUserInput & {
    username: string;
    avatar?: string;
}

type User = SignUpUserInput & {
    createdAt: Date;
    lastSignIn: Date;
    agentsCount: number;
    apiKeysCount: number;
    publishedAgents: number;
    datasetsCount: number;
    currentPlan: Plan["planName"];
    subscriptionId: string;
}

type UpdateUserData = Partial<Pick<User, "lastSignIn" | "username" | "avatar"> & {
    removeAvatar: boolean;
}>

type ValidationPurpose = "sign-up" | "reset-password"

type OneTimePasswordRecord = {
    otp: string;
    signature: string;
}

type VerifyEmailResponseInput = {
    email: User["email"];
    otp: string;
    signature: string;
    purpose: ValidationPurpose;
}

type verifyEmailRequestInput = { checkExistance: boolean } & Pick<VerifyEmailResponseInput, "email">

type ChangePasswordInput = {
    currentPassword: string;
    newPassword: string;
}

type ResetPasswordInput = {
    email: User["email"];
    newPassword: string;
}

type SendMailOptions = {
    to: string[],
    subject: string,
    text: string,
    html: string,
}