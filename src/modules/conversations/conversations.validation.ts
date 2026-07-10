import { z } from "zod";

export const conversationIdSchema = z.object({
  id: z.uuid({
    error: (issue) =>
      issue.input === undefined
        ? "targeted user id is required"
        : "targeted user id must be a valid uuid",
  }),
});

// export const conversationIdSchema = z.object({
//   id: z.uuid({
//     error: (issue) =>
//       issue.input === undefined
//         ? "conversationId is required"
//         : "conversationId must be a valid uuid",
//   }),
// });
