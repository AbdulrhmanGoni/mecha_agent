const authResponsesMessages = {
    wrongCredentials: "Wrong username or password",
    noUser: "The user does not exist",
    userSignedUpWithAnotherMethod: "The user already had signed up with another signing method",
    userAlreadyExisting: "The user is already existing, Just sign in !",
    notVerifiedEmail: "Your email is not verified, Ask for an OTP to verify your email",
    failedToSendOTP: "We couldn't send the OTP to your email, Are you this is a valid email?",
    failedToVerifyOTP: "The OTP you entered is invalid or expired, Double check and try again or request another OTP",

    passwordChangedSuccessfully: "Your password has been  changed successfully",
    wrongCurrentPassword: "Your current password doesn't match the one you entered",
    passwordCantBeChanged: "You can't change your password because you didn't signed up with email and password",
    unexpectedChangePasswordError: "Unexpected error during 'Change Password' process",

    passwordResetSuccessfully: "Your password has been reset successfully, You can now sign in.",
    resetPasswordFailed: "We couldn't reset your password",
    tooManyTries: "Too many login attempts. Please try again after 30 minutes.",
}

export default authResponsesMessages