import nodemailer from "nodemailer"

export const createEmailTransporter = () =>
  nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.APP_EMAIL as string,
      pass: process.env.APP_PASSWORD as string,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    dns: { family: 4 },
  } as any)

export const sendAppEmail = async (mailOptions: any) => {
  const transporter = createEmailTransporter()
  return transporter.sendMail(mailOptions)
}
