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
    agentsCount: number;
    apiKeysCount: number;
    publishedAgents: number;
    datasetsCount: number;
    currentPlan: Plan["planName"];
    subscriptionId: string;
}

type UpdateUserData = Partial<Pick<User, "lastSignIn" | "username"> & {
    newAvatar: File;
    removeAvatar: boolean;
}>

type ValidationPurpose = "sign-up" | "reset-password"

type VerifiedEmailRecord = `${string}_${ValidationPurpose}`

type VerifiedEmailsStore = Set<VerifiedEmailRecord>

type OneTimePasswordsStore = {
    otp: string;
    signature: string;
}

type VerifyEmailResponseInput = {
    email: User["email"];
    otp: string;
    signature: string;
    purpose: ValidationPurpose;
}

type verifyEmailRequestInput = Pick<VerifyEmailResponseInput, "email">
