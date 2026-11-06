import { Worker } from "bullmq";
import bullmqConnection from "../../config/redis/bullmq.connection";
import { ISendEmailPayload, sendMail } from "../../config/email";
import logger from "../../shared/utils/logger";

export const emailWorker = new Worker<ISendEmailPayload>(
  "email",
  async (job) => {
    await sendMail(job.data);
  },
  {
    connection: bullmqConnection,
    concurrency: 5,
  },
);

emailWorker.on("completed", (job) => {
  logger.info(
    ` [Email Worker success] Email Job ${job.id} completed successfully.`,
  );
  //   jobsProcessedCounter.inc({ job_type: 'email_job' });
});

// emailWorker.on("failed", (job, err: Error) => {
//   logger.error(
//     {
//       error: err.message,
//       stack: err.stack,
//     },
//     ` [Email Worker failed] Email Job ${job?.id} failed.`,
//   );
//   //   jobsFailedCounter.inc({ job_type: 'email_job' });
// });

emailWorker.on("failed", (job, err) => {
  logger.error(
    { err, jobId: job?.id, attemptsMade: job?.attemptsMade },
    "email job failed",
  );
});

emailWorker.on("error", (err) => {
  logger.error({ err }, "email worker error");
});
