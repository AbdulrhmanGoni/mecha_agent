const decoder = new TextDecoder()

export default async function createOneTimePasswordMail(otp: string) {
    const htmlFile = decoder.decode(await Deno.readFile("src/constant/html-mails-templates/oneTimePasswordMailTemplate.min.txt"))
    return htmlFile.replace("${OTP}", otp)
};
