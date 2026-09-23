import z from "zod";

export const initiateCallEventSchema = z.object({
  conversationId: z.uuid(),
  callMediaType: z.enum(["video", "audio"]),
});

export const acceptCallEventSchema = z.object({
  callId: z.string(),
  conversationId: z.uuid(),
  callMediaType: z.enum(["video", "audio"]),
});

export const rejectCallEventSchema = z.object({
  callId: z.uuid(),
  conversationId: z.uuid(),
});

export const callSdpSchema = z.object({
  callId: z.uuid().nullable(),
  conversationId: z.uuid(),
  to: z.uuid(),

  description: z.object({
    type: z.enum(["offer", "answer"]),
    sdp: z.string().min(1),
  }),
});

export const callIceSchema = z.object({
  callId: z.uuid().nullable(),
  conversationId: z.uuid(),
  to: z.uuid(),

  candidate: z.object({
    candidate: z.string(),
    sdpMid: z.string().nullable(),
    sdpMLineIndex: z.number().int().nullable(),
    usernameFragment: z.string().nullable().optional(),
  }),
});

export const inviteCallSchema = z.object({
  callId: z.uuid().nullable(),
  conversationId: z.uuid(),
  callMediaType: z.enum(["video", "audio"]),
  to: z.uuid(),
});

export const connectCallSchema = rejectCallEventSchema;

export type CallSdp = z.infer<typeof callSdpSchema>;
export type CallIce = z.infer<typeof callIceSchema>;
export type IacceptCallEventSchema = z.infer<typeof acceptCallEventSchema>;
