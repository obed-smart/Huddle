import AppError from "../shared/utils/apiError";
import logger from "../shared/utils/logger";
import env from "./env";

export interface ISendEmailPayload {
  to: string;
  subject: string;
  html: string;
}

export const sendMail = async (payload: ISendEmailPayload) => {
  const emailOptions = {
    from: '"Huddle"<codingwithsmart@gmail.com>',
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
  };

  try {
    const response = await fetch("https://sendliberty.com/api/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.SEND_LIB_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailOptions),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Email API responded ${response.status}: ${body}`);
    }

    logger.debug({ to: payload.to }, "Email sent successfully");
  } catch (error) {
    logger.error({ err: error, to: payload.to }, "Failed sending email");
    throw new AppError("Failed to send email", 500);
  }
};
