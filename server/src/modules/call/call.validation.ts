import z from "zod";

export const initiateCallEventSchema = z.object({
  conversationId: z.uuid(),
  callMediaType: z.enum(["video", "audio", "meet"]),
});

export const acceptCallEventSchema = z.object({
  callId: z.string(),
  conversationId: z.uuid(),
  callMediaType: z.enum(["video", "audio", "meet"]),
  rejoin: z.boolean().optional().default(false),
});

export const rejectCallEventSchema = z.object({
  callId: z.uuid(),
  conversationId: z.uuid(),
});

export const sdpPayloadSchema = z.object({
  conversationId: z.uuid(),
  to: z.uuid(),

  description: z.object({
    type: z.enum(["offer", "answer"]),
    sdp: z.string().min(1),
  }),
});

export const icePayloadSchema = z.object({
  conversationId: z.uuid(),
  to: z.uuid(),

  candidate: z.object({
    candidate: z.string(),
    sdpMid: z.string().nullable(),
    sdpMLineIndex: z.number().int().nullable(),
    usernameFragment: z.string().nullable().optional(),
  }),
});

export const callSdpSchema = sdpPayloadSchema.extend({
  callId: z.uuid().nullable(),
});

export const callIceSchema = icePayloadSchema.extend({
  callId: z.uuid().nullable(),
});

export const inviteCallSchema = z.object({
  callId: z.uuid(),
  conversationId: z.uuid(),
  callMediaType: z.enum(["video", "audio"]),
  to: z.uuid(),
});

export const activeCallSummarySchema = z.object({
  callId: z.string(),
  conversationId: z.uuid(),
  callMediaType: z.enum(["video", "audio", "meet"]),
  conversationType: z.enum(["direct", "group"]),
  directTypeLenght: z.union([z.string(), z.number()]),
  name: z.string().nullable(),
});

// CLOUDFLARE REALTIME SFU

export const trackKindSchema = z.enum(["mic", "cam", "screen"]);

const sdpSchema = z.string().min(1).max(65_536);

// export const publishDescriptionSchema = z.object({
//   type: z.literal("offer"),
//   sdp: sdpSchema,
// });

// export const answerDescriptionSchema = z.object({
//   type: z.literal("answer"),
//   sdp: sdpSchema,
// });

export const publishSchema = z.object({
  callId: z.string().min(1),
  description: z.object({
    type: z.literal("offer"),
    sdp: sdpSchema,
  }),
  tracks: z
    .array(
      z.object({
        mid: z.string().min(1).max(32),
        kind: trackKindSchema,
      }),
    )
    .min(1)
    .max(3)
    .refine(
      (tracks) => new Set(tracks.map((t) => t.kind)).size === tracks.length,
      { message: "Duplicate track kind" },
    ),
});

export const subscribeSchema = z.object({
  callId: z.string().min(1),
  targets: z
    .array(
      z.object({
        userId: z.string().min(1),
        // omit to subscribe to everything that user is publishing
        kinds: z.array(trackKindSchema).min(1).max(3),
      }),
    )
    .min(1)
    .max(50),
});

export const renegotiateSchema = z.object({
  callId: z.string().min(1),
  description: z.object({
    type: z.literal("answer"),
    sdp: sdpSchema,
  }),
});



export const connectCallSchema = rejectCallEventSchema;
export const rejoinSchema = rejectCallEventSchema;

export type CallSdp = z.infer<typeof callSdpSchema>;
export type CallIce = z.infer<typeof callIceSchema>;
export type IacceptCallEventSchema = z.infer<typeof acceptCallEventSchema>;
export type ActiveCallSummary = z.infer<typeof activeCallSummarySchema>;
