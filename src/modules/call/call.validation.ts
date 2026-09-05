import z from "zod";

export const initiateCallEventSchema = z.object({
  conversationId: z.uuid({
    error: (issue) =>
      issue.input === undefined
        ? "conversationId is required"
        : "conversationId must be a valid uuid",
  }),
  callMediaType: z.enum(["video", "audio"], {
    error: (issue) => ({
      message:
        issue.input === undefined
          ? "callMediaType is required"
          : typeof issue.input !== "string"
            ? "callMediaType must be a string"
            : "callMediaType must be either 'video' or 'audio'",
    }),
  }),
});
