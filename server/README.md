# Huddle Backend

A real-time messaging, voice, and video backend that handles conversations, calls, and conference rooms through a clean REST API and Socket.IO gateway.

## Overview

Huddle helps developers add real-time chat and voice or video calling to their products without building complex signaling, presence, and session logic from scratch. It manages authentication, conversation membership, WebRTC call setup, and message delivery, so teams can focus on their frontend. Everything is exposed through a straightforward REST API plus a Socket.IO gateway.

## System Architecture

```mermaid
flowchart LR
  WebClient["Web Client"]
  APIServer["API Server"]
  WSServer["WebSocket Gateway"]
  PostgreSQL[("PostgreSQL")]
  Redis["Redis Cache / Queue"]
  EmailWorker["Email Worker"]

  WebClient --> APIServer
  WebClient --> WSServer
  APIServer --> PostgreSQL
  APIServer --> Redis
  WSServer --> PostgreSQL
  WSServer --> Redis
  APIServer --> EmailWorker

  style WebClient fill:#1e1b4b,stroke:#6366f1,stroke-width:2px,color:#fff
  style APIServer fill:#2e1065,stroke:#8b5cf6,stroke-width:2px,color:#fff
  style WSServer fill:#2e1065,stroke:#8b5cf6,stroke-width:2px,color:#fff
  style PostgreSQL fill:#0f172a,stroke:#3b82f6,stroke-width:2px,color:#fff
  style Redis fill:#4c0519,stroke:#ef4444,stroke-width:2px,color:#fff
  style EmailWorker fill:#451a03,stroke:#f59e0b,stroke-width:2px,color:#fff
```

## Features

- **Real-Time Messaging**: Direct and group chats with text, attachments, replies, mentions, reactions, typing indicators, and read receipts.
- **Audio and Video Calling**: WebRTC signaling for offer, answer, and ICE exchange, with in-memory call state and persistent call logs.
- **Conference Rooms**: Scheduled and instant meeting rooms with participant rosters and mesh WebRTC signaling.
- **Flexible Conversations**: Direct pings, public and private groups, invite links, admin roles, join requests, and member management.
- **Secure Authentication**: Local email and password login, Google OAuth, email verification, password reset, and HttpOnly cookie-based JWT sessions with refresh token rotation.
- **Production Touches**: Redis-backed rate limiting, BullMQ email queue, Helmet CSP, request logging, global error handling, and graceful shutdown.

### Authentication Flow

```mermaid
sequenceDiagram
  actor User
  participant Server
  participant Database

  User->>Server: Submit credentials
  Server->>Database: Verify user
  Database->>Server: User valid
  Server->>Server: Create session + tokens
  Server->>User: Set HttpOnly cookies
```

### Call Signaling Flow

```mermaid
sequenceDiagram
  actor Caller
  participant Server
  actor Callee

  Caller->>Server: Start call
  Server->>Callee: Incoming call alert
  Callee->>Server: Accept call
  Server->>Caller: Call accepted
  Caller->>Server: Send media offer
  Server->>Callee: Forward offer
```

### Message Delivery Flow

```mermaid
sequenceDiagram
  actor Sender
  participant Server
  participant Database
  actor Recipient

  Sender->>Server: Send message
  Server->>Database: Save and validate mentions
  Database->>Server: Message stored
  Server->>Recipient: Deliver in real time
  Recipient->>Server: Mark as read
  Server->>Sender: Read receipt update
```

## Installation

Clone the repository:

```bash
git clone https://github.com/obed-smart/Huddle.git
cd Huddle
```

Install dependencies:

```bash
npm install
```

Set up the database. The project uses Drizzle Kit to manage PostgreSQL schemas:

```bash
npm run db:generate
npm run db:migrate
npm run db:push
```

Copy the rate limiter Lua script to the expected build location:

```bash
mkdir -p dist/config
cp src/config/token-bucket.lua dist/config/token-bucket.lua
```

Create a `.env` file in the project root. See the Environment Variables section below for the required keys.

Start the development server:

```bash
npm run dev
```

## Usage

Run the API in development mode with hot reload:

```bash
npm run dev
```

Build and run in production:

```bash
npm run build
npm start
```

Check that the server is healthy:

```bash
curl http://localhost:8080/health
```

Connect to the Socket.IO gateway from a client using the same `FRONTEND_URL` origin and include credentials so the access token cookie is sent.

## Environment Variables

Create a `.env` file and add the following keys:

| Variable | Description | Example |
| --- | --- | --- |
| `PORT` | Port the server listens on | `8080` |
| `NODE_ENV` | Runtime environment | `development` or `production` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/huddle` |
| `FRONTEND_URL` | Allowed frontend origin for CORS and redirects | `http://localhost:3000` |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens | `a-long-random-string` |
| `REFRESH_TOKEN_LIFESPAN_DAYS` | How many days refresh tokens remain valid | `7` |
| `EMAIL_VERIFICATION_LIFESPAN` | Email verification link lifetime in hours | `24` |
| `OTP_SECRET` | Secret used to hash password reset codes | `another-long-random-string` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | |
| `REDIS_URL` | Redis connection string for rate limiting and presence | `redis://localhost:6379` |
| `BULLMQ_REDIS_URL` | Redis connection for the email queue | `redis://localhost:6379` |
| `SMTP_HOST` | SMTP server for outbound email | |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP username | |
| `SMTP_PASS` | SMTP password | |
| `R2_ENDPOINT` | Cloudflare R2 or S3-compatible endpoint for attachments | |
| `R2_ACCESS_KEY_ID` | R2 access key | |
| `R2_SECRET_ACCESS_KEY` | R2 secret key | |
| `R2_BUCKET_NAME` | R2 bucket name | |

## API Documentation

All REST endpoints are prefixed with `/api/v1`.

### Auth Routes

#### POST /api/v1/auth/register

Registers a new user and sends a verification email.

**Request**:

```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response**:

```json
{
  "success": true,
  "data": "If this email can be used, we've sent you a message."
}
```

**Errors**:

- 400: Validation errors
- 409: Username or email conflict

#### POST /api/v1/auth/login

Authenticates a user with email or username and password, then sets HttpOnly cookies.

**Request**:

```json
{
  "identifier": "user@example.com",
  "password": "securepassword123"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "email": "user@example.com",
    "username": "johndoe",
    "avataUrl": null
  }
}
```

**Errors**:

- 401: Invalid credentials
- 429: Too many login attempts

#### POST /api/v1/auth/logout

Revokes the current session and clears cookies.

**Request**: Empty body.

**Response**: `204 No Content`

**Errors**:

- 401: Unauthorized

#### POST /api/v1/auth/logoutAll

Revokes all active sessions for the current user.

**Request**: Empty body.

**Response**: `204 No Content`

**Errors**:

- 401: Unauthorized

#### GET /api/v1/auth/google

Initiates Google OAuth login.

**Response**: Redirects to Google's consent screen.

#### GET /api/v1/auth/google/callback

Completes Google OAuth and redirects to the frontend dashboard.

**Response**: Redirect to `${FRONTEND_URL}/#/dashboard`.

**Errors**:

- 401: Google authentication failed

#### POST /api/v1/auth/refresh

Issues a new access token using the refresh token cookie.

**Request**: Empty body.

**Response**:

```json
{
  "success": true,
  "data": null
}
```

**Errors**:

- 400: Refresh token not found
- 401: Invalid or reused refresh token

#### POST /api/v1/auth/forgot-password

Sends a password reset OTP to the user's email.

**Request**:

```json
{
  "email": "user@example.com"
}
```

**Response**:

```json
{
  "success": true,
  "data": "If an account exists, we've sent a code to that email."
}
```

#### POST /api/v1/auth/reset-password

Resets the password using the OTP.

**Request**:

```json
{
  "email": "user@example.com",
  "otp": "123456",
  "password": "newpassword123",
  "passwordCompare": "newpassword123"
}
```

**Response**:

```json
{
  "success": true,
  "data": "password Reset successfully"
}
```

**Errors**:

- 400: Invalid or expired code

#### POST /api/v1/auth/verify-email

Verifies a user's email using the token from the verification link.

**Request**:

```json
{
  "token": "64-character-hex-token"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "message": "email verification successfull"
  }
}
```

#### POST /api/v1/auth/resend-verification

Resends the verification email.

**Request**:

```json
{
  "email": "user@example.com"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "message": "If this email can be used, we've sent you a message."
  }
}
```

### User Routes

All user routes require authentication.

#### GET /api/v1/user/me

Returns the current user's profile.

**Response**:

```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "email": "user@example.com",
    "username": "johndoe",
    "displayName": "John Doe",
    "avatarUrl": null,
    "bio": null,
    "globalRole": "user",
    "isEmailVerified": false
  }
}
```

#### GET /api/v1/user/search

Searches users by username.

**Request**: `?username=searchterm`

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-string",
      "username": "searchterm",
      "displayName": "Search User",
      "avatarUrl": "url",
      "bio": "Hello"
    }
  ]
}
```

#### GET /api/v1/user/:username

Returns a public profile for the given username.

**Response**:

```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "username": "targetuser",
    "displayName": "Target User",
    "avatarUrl": "url",
    "bio": "Bio content"
  }
}
```

**Errors**:

- 404: User not found

#### GET /api/v1/user/me/pending-invites

Returns pending group invitations for the current user.

**Response**:

```json
{
  "success": true,
  "data": {
    "result": 1,
    "invites": [
      {
        "id": "invite-uuid",
        "kind": "invite",
        "conversationId": "convo-uuid",
        "fromUser": "inviter-uuid",
        "conversationName": "Cool Group",
        "conversationAvatar": null,
        "createdAt": "2023-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### Conversation Routes

All conversation routes require authentication.

#### GET /api/v1/conversation

Lists all conversations the current user participates in.

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": "convo-uuid",
      "type": "direct",
      "name": "Jane Doe",
      "avatar": "url",
      "otherUserId": "jane-uuid",
      "membersCount": null,
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST /api/v1/conversation/ping

Starts a direct conversation request with another user.

**Request**:

```json
{
  "id": "target-user-uuid"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "id": "convo-uuid",
    "type": "direct",
    "visibility": "private",
    "pingStatus": "pending"
  }
}
```

**Errors**:

- 400: Cannot start a conversation with yourself

#### POST /api/v1/conversation/pings/:id/accept

Accepts an incoming direct conversation request.

**Response**:

```json
{
  "success": true,
  "data": {
    "message": "Ping accepted"
  }
}
```

#### POST /api/v1/conversation/pings/:id/decline

Declines an incoming direct conversation request.

**Response**:

```json
{
  "success": true,
  "data": {
    "message": "Ping declined"
  }
}
```

#### POST /api/v1/conversation/groups

Creates a new group conversation.

**Request**:

```json
{
  "name": "Project Team",
  "description": "Discussion for the new project",
  "visibility": "private",
  "participantIds": ["user-uuid-1", "user-uuid-2"]
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "id": "convo-uuid",
    "type": "group",
    "name": "Project Team",
    "visibility": "private"
  }
}
```

**Errors**:

- 400: Less than two valid participants
- 403: Cannot invite yourself

#### PATCH /api/v1/conversation/invites/:requestId

Accepts or declines a group invitation. Called by the invitee.

**Request**:

```json
{
  "decision": "accept"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "status": "accepted",
    "conversationId": "convo-uuid"
  }
}
```

**Errors**:

- 403: Not your invite
- 409: Request already resolved

#### PATCH /api/v1/conversation/:conversationId

Updates group details. Requires admin permissions.

**Request**:

```json
{
  "name": "Updated Team Name",
  "description": "Updated description"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "message": "Conversation updated successfully",
    "updatedConversation": {}
  }
}
```

#### PATCH /api/v1/conversation/join-requests/:requestId

Approves or declines a user's request to join a private group. Requires admin permissions.

**Request**:

```json
{
  "decision": "approve"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "status": "accepted",
    "conversationId": "convo-uuid"
  }
}
```

#### PATCH /api/v1/conversation/:conversationId/invite-code

Generates a new invite code for a group. Requires admin permissions.

**Response**:

```json
{
  "success": true,
  "data": {
    "inviteCode": "generatedcode",
    "invitelink": "https://frontend.com/invite/generatedcode"
  }
}
```

#### GET /api/v1/conversation/invites/:inviteCode

Returns public details for a conversation invite.

**Response**:

```json
{
  "success": true,
  "data": {
    "id": "convo-uuid",
    "name": "Public Group",
    "membersCount": 5
  }
}
```

#### POST /api/v1/conversation/invites/:inviteCode

Joins a group via invite code. Private groups create an admin approval request.

**Response**:

```json
{
  "success": true,
  "data": "Request sent successfully and waiting for admin approval"
}
```

#### POST /api/v1/conversation/invites

Invites a specific user to a group. Requires admin permissions.

**Request**:

```json
{
  "conversationId": "convo-uuid",
  "userId": "target-user-uuid"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "message": "User invited successfully"
  }
}
```

#### GET /api/v1/conversation/:conversationId/requests

Lists pending join requests for a group. Requires admin permissions.

**Response**:

```json
{
  "success": true,
  "data": {
    "result": 1,
    "requests": [
      {
        "id": "request-uuid",
        "kind": "request",
        "userId": "user-uuid",
        "username": "johndoe"
      }
    ]
  }
}
```

#### GET /api/v1/conversation/:conversationId/messages

Returns the message timeline for a conversation.

**Request**: `?limit=50&before=2023-01-01T00:00:00.000Z`

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "type": "message",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "data": {
        "id": "msg-uuid",
        "body": "Hello world"
      }
    }
  ]
}
```

#### PATCH /api/v1/conversation/:conversationId/participants/:userId/role

Promotes or demotes a member to admin. Requires admin permissions.

**Request**:

```json
{
  "role": "admin"
}
```

**Response**:

```json
{
  "success": true,
  "data": "New Admin added successfully"
}
```

#### DELETE /api/v1/conversation/:conversationId/participants/me

Leaves a conversation.

**Response**:

```json
{
  "success": true,
  "data": "User left the group successfully"
}
```

#### DELETE /api/v1/conversation/:conversationId/participants/:userId

Removes a member from a conversation. Requires admin permissions.

**Response**:

```json
{
  "success": true,
  "data": {
    "message": "Member removed successfully"
  }
}
```

#### DELETE /api/v1/conversation/:conversationId

Deletes a conversation entirely. Only the creator can perform this action.

**Response**:

```json
{
  "success": true,
  "data": {
    "message": "Conversation deleted successfully"
  }
}
```

### Message Routes

All message routes require authentication.

#### POST /api/v1/message

Creates a new text message.

**Request**:

```json
{
  "conversationId": "convo-uuid",
  "content": "Hello team!"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "id": "msg-uuid",
    "conversationId": "convo-uuid",
    "senderId": "user-uuid",
    "body": "Hello team!",
    "createdAt": "2023-01-01T00:00:00.000Z"
  }
}
```

#### GET /api/v1/message/conversation/:conversationId

Fetches messages for a conversation.

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": "msg-uuid",
      "body": "Hello team!",
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
  ]
}
```

#### GET /api/v1/message/:messageId

Fetches a single message.

**Response**:

```json
{
  "success": true,
  "data": {
    "id": "msg-uuid",
    "body": "Hello team!"
  }
}
```

#### PUT /api/v1/message/:messageId

Edits a message. Only the sender can edit it.

**Request**:

```json
{
  "content": "Edited message content"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "id": "msg-uuid",
    "body": "Edited message content",
    "editedAt": "2023-01-01T00:05:00.000Z"
  }
}
```

#### DELETE /api/v1/message/:messageId

Deletes a message.

**Response**: `204 No Content`

### Call Routes

All call routes require authentication.

#### GET /api/v1/call

Returns the current user's paginated call history.

**Request**: `?cursor=base64cursor`

**Response**:

```json
{
  "success": true,
  "data": {
    "callLOg": [],
    "nextCursor": "base64cursor-or-null"
  }
}
```

#### GET /api/v1/call/active

Returns active calls the user is eligible to join.

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "callId": "call-uuid",
      "conversationId": "convo-uuid",
      "callMediaType": "video",
      "conversationType": "group",
      "directTypeLenght": "group",
      "name": "Team Call"
    }
  ]
}
```

### Meet Routes

All meet routes require authentication.

#### POST /api/v1/meet

Creates a new conference room in a conversation.

**Request**:

```json
{
  "conversationId": "convo-uuid",
  "title": "Weekly Standup",
  "scheduledFor": "2023-01-01T10:00:00.000Z"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "meetId": "meet-uuid",
    "conversationId": "convo-uuid",
    "title": "Weekly Standup",
    "scheduledFor": "2023-01-01T10:00:00.000Z"
  }
}
```

#### GET /api/v1/meet/active

Returns active conference rooms the user can join.

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "meetId": "meet-uuid",
      "conversationId": "convo-uuid",
      "title": "Weekly Standup",
      "scheduledFor": "2023-01-01T10:00:00.000Z"
    }
  ]
}
```

### Socket.IO Events

The gateway requires the access token cookie and joins rooms automatically. Key events include:

- `message:send` / `message:new`: send and receive messages
- `typing:start` / `typing:update`: typing and recording indicators
- `message:read` / `read:update`: read receipts
- `reactions:add` / `reactions:remove` / `reactions:update`: message reactions
- `conversation:join` / `conversation:leave`: join or leave a conversation room
- `call:initiate` / `call:incoming` / `call:accept` / `call:offer` / `call:answer` / `call:ice-candidate`: WebRTC call signaling
- `meet:join` / `meet:offer` / `meet:answer` / `meet:ice-candidate`: conference room signaling

## Technologies Used

| Category | Technologies |
| --- | --- |
| Languages | [TypeScript](https://www.typescriptlang.org/), [Node.js](https://nodejs.org/) |
| Backend | [Express](https://expressjs.com/), [Socket.io](https://socket.io/) |
| Database | [PostgreSQL](https://www.postgresql.org/), [Drizzle](https://orm.drizzle.team/), [Redis](https://redis.io/) |
| Auth & Validation | [Passport](https://www.passportjs.org/), [Zod](https://zod.dev/) |
| Queue | [BullMQ](https://bullmq.io/) |

## Contributing

Pull requests are welcome. If you want to add a feature or fix a bug, fork the repo, create a branch, and open a PR. Please keep code formatted consistently and add tests for new behavior when possible.

## Author Info

- LinkedIn: https://linkedin.com/in/obed-smart
- X (Twitter): https://x.com/eberechukwuobed

## Badges

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Drizzle](https://img.shields.io/badge/Drizzle-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![BullMQ](https://img.shields.io/badge/BullMQ-8B0000?style=for-the-badge&logo=bullmq&logoColor=white)](https://bullmq.io/)
[![Passport](https://img.shields.io/badge/Passport-34E27A?style=for-the-badge&logo=passport&logoColor=white)](https://www.passportjs.org/)
[![Zod](https://img.shields.io/badge/Zod-3068B7?style=for-the-badge&logo=zod&logoColor=white)](https://zod.dev/)

[![Readme was generated by Dokugen](https://img.shields.io/badge/Readme%20was%20generated%20by-Dokugen-brightgreen)](https://dokugen.samueltuoyo.com)