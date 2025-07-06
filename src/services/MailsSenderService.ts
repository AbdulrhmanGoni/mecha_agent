import { Transporter, createTransport } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import parsedEnvVariables from "../configurations/parseEnvironmentVariables.ts";
import Mailjet from 'node-mailjet';

export class MailsSenderService {
    private transporter?: Transporter<SMTPTransport.SentMessageInfo, SMTPTransport.Options>
    private mailjet?: Mailjet.Client
    constructor() {
        const auth = {
            user: parsedEnvVariables.MAIL_SENDER_USER,
            pass: parsedEnvVariables.MAIL_SENDER_PASS,
        }

        if (parsedEnvVariables.ENVIRONMENT == "production") {
            this.mailjet = Mailjet.Client.apiConnect(auth.user, auth.pass)
        } else {
            this.transporter = createTransport({
                host: parsedEnvVariables.MAIL_SENDER_HOST,
                port: Number(parsedEnvVariables.MAIL_SENDER_PORT),
                auth,
            });
        }
    }

    async send(mailOptions: SendMailOptions): Promise<boolean> {
        if (parsedEnvVariables.ENVIRONMENT == "production") {
            if (!this.mailjet) {
                throw new Error("Mailjet client hasn't been initialized")
            }

            const res = await this.mailjet
                .post('send', { version: 'v3.1' })
                .request({
                    Messages: [
                        {
                            From: {
                                Email: parsedEnvVariables.MAIL_SENDER_USER,
                                Name: "Mecha Agent",
                            },
                            To: mailOptions.to.map((Email) => { Email }),
                            Subject: mailOptions.subject,
                            TextPart: mailOptions.text,
                            HTMLPart: mailOptions.html
                        }
                    ]
                })

            return res.response.status == 200
        } else {
            if (!this.transporter) {
                throw new Error("Nodemailer's Transporter hasn't been created")
            }

            const { accepted } = await this.transporter.sendMail({
                from: parsedEnvVariables.MAIL_SENDER_USER,
                ...mailOptions,
            });

            return accepted.some(email => email === email);
        }
    }
}