import { SendMailOptions, type Transporter, createTransport } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import parsedEnvVariables from "../configurations/parseEnvironmentVariables.ts";

export class MailsSenderService {
    private transporter: Transporter<SMTPTransport.SentMessageInfo, SMTPTransport.Options>
    constructor() {
        const auth = {
            user: parsedEnvVariables.MAIL_SENDER_USER,
            pass: parsedEnvVariables.MAIL_SENDER_PASS,
        }

        if (parsedEnvVariables.ENVIRONMENT === "production") {
            this.transporter = createTransport({ service: 'gmail', auth });
        } else {
            this.transporter = createTransport({
                host: parsedEnvVariables.MAIL_SENDER_HOST,
                port: Number(parsedEnvVariables.MAIL_SENDER_PORT),
                auth,
            });
        }
    }

    async send(mailOptions: SendMailOptions): Promise<SMTPTransport.SentMessageInfo> {
        return await this.transporter.sendMail({
            from: parsedEnvVariables.MAIL_SENDER_USER,
            ...mailOptions,
        });
    }
}