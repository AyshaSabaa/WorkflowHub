import nodemailer from "nodemailer";

const transporter =
  process.env.SMTP_HOST
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    : null;

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!transporter) {
    console.log(`[Email stub] To: ${params.to} | ${params.subject}`);
    return;
  }
  await transporter.sendMail({
    from: process.env.SMTP_FROM || "Avishkar AI <noreply@avishkar.ai>",
    to: params.to,
    subject: params.subject,
    html: params.html,
  });
}
