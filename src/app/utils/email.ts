import ejs from "ejs";
import nodemailer from "nodemailer";
import path from "path";
import { envVariables } from "../config/env";

type TTemplateName = "otp" | "verification" | "resetPassword";

type TSendEmailPayload = {
  to: string;
  subject: string;
  html?: string;
  templateName?: TTemplateName;
  templateData?: Record<string, unknown>;
};

const transporter = nodemailer.createTransport({
  host: envVariables.EMAIL_SENDER.SMTP_HOST,
  port: Number(envVariables.EMAIL_SENDER.SMTP_PORT || 465),
  secure: true,
  auth: {
    user: envVariables.EMAIL_SENDER.SMTP_USER,
    pass: envVariables.EMAIL_SENDER.SMTP_PASS,
  },
});

export const sendEmail = async ({
  to,
  subject,
  html,
  templateName,
  templateData,
}: TSendEmailPayload) => {
  if (!envVariables.EMAIL_SENDER.SMTP_USER || !envVariables.EMAIL_SENDER.SMTP_PASS) {
    console.warn("Email sender is not configured. Skipping email send.");
    return;
  }

  let renderedHtml = html || "";

  if (!renderedHtml && templateName) {
    const templatePath = path.resolve(
      process.cwd(),
      `src/app/templates/${templateName}.ejs`,
    );

    renderedHtml = await ejs.renderFile(templatePath, templateData || {});
  }

  if (!renderedHtml && subject) {
    renderedHtml = `<p>${subject}</p>`;
  }

  await transporter.sendMail({
    from: envVariables.EMAIL_SENDER.SMTP_FROM || envVariables.EMAIL_SENDER.SMTP_USER,
    to,
    subject,
    html: renderedHtml,
  });
};
