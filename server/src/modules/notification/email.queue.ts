import { Queue } from "bullmq";
import bullmqConnection from "../../config/bullmq.connection";
import { ISendEmailPayload } from "../../config/email";
import { AuthUser } from "../../shared/types";
import {
  buildPasswordChangedEmail,
  buildPasswordResetEmail,
  buildWelcomeEmail,
} from "./email.template";

const emailQueue = new Queue<ISendEmailPayload>("email", {
  connection: bullmqConnection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export async function addWellcomeEmail(user: AuthUser) {
  emailQueue.add(
    "wellcome",
    {
      to: user.email,
      subject: "Welcome to Huddle! 🚀 Your account is ready",
      html: buildWelcomeEmail(user.displayName ?? user.username),
    },
    {
      jobId: `wellcome/${user.email}`,
    },
  );
}

export async function addPasswordResetEmail(email: string, otp: string) {
  emailQueue.add(
    "password-reset",
    {
      to: email,
      subject: "Password Reset Request",
      html: buildPasswordResetEmail(otp),
    },
    { jobId: `passwword-reset/${email}` },
  );
}

export async function addPasswordChangedEmail(email: string, changedAt: Date) {
  emailQueue.add(
    "password-reset",
    {
      to: email,
      subject: "Your password was changed",
      html: buildPasswordChangedEmail(email, changedAt),
    },
    { jobId: `passwword-chnaged/${email}` },
  );
}
