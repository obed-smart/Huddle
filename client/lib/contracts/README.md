# Contracts

Every backend-derived type the client uses lives in `index.ts` in this folder.
Nothing else in the client hand-declares these shapes — it all imports from
`@/lib/contracts`. To align a shape with the server, replace its block in
`index.ts` with your generated Drizzle/Zod type. The rest of the client picks up
the change automatically.

These are the types I need from you. For each one: the backend source, and the
exact fields the UI reads.

| Type in `index.ts` | Backend source | Fields the UI uses |
| --- | --- | --- |
| `AuthUser` | `users` table (the signed-in user, `GET /user/me`) | `id`, `email`, `username`, `displayName?`, `avatarUrl?`, `bio?`, `isEmailVerified?` |
| `SearchedUser` | `GET /user/search` (public columns) | `id`, `username`, `displayName?`, `avatarUrl?`, `bio?` |
| `Conversation` | `GET /conversation` list projection | `id`, `type` (`direct`\|`group`), `name`, `avatar?`, `otherUserId?`, `membersCount?`, `updatedAt?` |
| `MessageType` / `MESSAGE_TYPES` | `message_type` enum | the enum values; `MESSAGE_TYPES` is also used as runtime values |
| `Attachment` | message `attachments` rows + presign/signed URLs | `id`, `type`, `name`, `size`, `mimeType`, `url`, `remoteUrl`, `durationSeconds`, `localOnly` |
| `MessageSender` | message sender projection | `id`, `username`, `displayName`, `avatar` |
| `Reaction` | message reactions (if returned) | `emoji`, `count`, `mine?` |
| `Message` | normalized timeline row + socket payloads | the full shape (see `index.ts`) |
| `MediaKind` | media policy enum | `voice`\|`image`\|`video`\|`file` |
| `PresignInput` / `Presign` | `POST /media/presigned` req/res | req `{kind,mime,size}`; res `{uploadUrl,objectKey,expiresIn}` |
| `GroupRole` | `conversation_role` enum | `super_admin`\|`admin`\|`member` |
| `GroupMember` | group participant projection | `id`, `username`, `displayName?`, `avatarUrl?`, `role` |
| `GroupDetails` | `GET /conversation/:id` **+ participants + myRole (to add)** | `id`, `name`, `description?`, `avatarUrl?`, `visibility?`, `membersCount`, `inviteCode?`, `myRole`, `participants[]` |
| `JoinRequest` | `GET /conversation/:id/requests` | `id`, `userId`, `username`, `avatarUrl?` |
| `GroupInvite` | `GET /user/me/pending-invites` | `id`, `conversationId`, `conversationName`, `conversationAvatar`, `fromUser`, `createdAt?` |
| `PingRequest` | socket `ping:new` payload | `conversationId`, `requester{id,username,avatarUrl?}` |

## How to swap in your generated types

Edit only `index.ts`. For example:

```ts
import type { InferSelectModel } from "drizzle-orm";
import type { users } from "@your/db/schema";

export type AuthUser = Pick<
  InferSelectModel<typeof users>,
  "id" | "email" | "username" | "displayName" | "avatarUrl" | "bio" | "isEmailVerified"
>;
```

Keep the **field names** the table above lists (or adjust the few call sites the
compiler then flags). `GroupDetails` is the one shape whose endpoint still needs
`participants` and `myRole` added server-side; until then the group-info screen
shows its loading state.
