import { request } from "./http";

export type CreateGroupInput = {
  name: string;
  description?: string;
  visibility: "private" | "public";
  participantIds: string[];
};

/**
 * Create a group. The server invites every participant (they receive it in
 * their requests inbox) and requires at least two, none of them the creator.
 */
export function createGroup(input: CreateGroupInput) {
  return request<{ id: string }>("/api/v1/conversation/groups", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
