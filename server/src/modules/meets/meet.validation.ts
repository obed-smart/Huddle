import z from "zod";
import { icePayloadSchema, sdpPayloadSchema } from "../call/call.validation";

export const createMeetSchema = z.object({
  conversationId: z.uuid(),

  title: z.string().optional(),

  scheduledFor: z.coerce.date().optional(),
});

export const joinMeetSchema = z.object({
  conversationId: z.uuid(),
  meetId: z.uuid(),
});

export const meetSdpSchema = sdpPayloadSchema.extend({
  meetId: z.uuid(),
});

export const meetIceSchema = icePayloadSchema.extend({
  meetId: z.uuid(),
});

export const inviteMeetSchema = z.object({
  meetId: z.uuid(),
  conversationId: z.uuid(),
  targetUserId: z.uuid(),
});
