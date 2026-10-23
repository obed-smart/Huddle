import { Queue } from "bullmq";
import bullmqConnection from "../../config/bullmq.connection";
import { ISendEmailPayload } from "../../config/email";
import { AuthUser } from "../../shared/types";
import { buildWelcomeEmail } from "./templates/wellcome-email";
import {
  buildPasswordChangedEmail,
  buildPasswordResetEmail,
} from "./templates/password.reset.email";
import { string } from "zod";
import { buildVerifyEmail } from "./templates/verify.email";
import { buildAccountExistsEmail } from "./templates/account.exist.email";
import env from "../../config/env";

const emailQueue = new Queue<ISendEmailPayload>("email", {
  connection: bullmqConnection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: { count: 100, age: 900 },
    removeOnFail: { count: 7 * 24 * 3600 },
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

export async function addVerifyEmailJob(
  email: string,
  displayName: string,
  verifyUrl: string,
  token: string,
) {
  const ttlHours = new Date(
    Date.now() + env.EMAIL_VERIFICATION_LIFESPAN * 60 * 60 * 1000,
  ).getHours();

  emailQueue.add(
    "verify-email",
    {
      to: email,
      subject: "Confirm your email for Huddle",
      html: buildVerifyEmail(verifyUrl, ttlHours, displayName),
    },
    { jobId: `verify/${email}/${token}` },
  );
}

export async function addAccountExistsJob(
  email: string,
  displayName: string,
  loginUrl: string,
) {
  return emailQueue.add(
    "account-exists",
    {
      to: email,
      subject: "You already have a Huddle account",
      html: buildAccountExistsEmail(loginUrl, displayName),
    },
    { jobId: `account-exists/${email}` },
  );
}
