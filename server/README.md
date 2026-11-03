# Huddle

Huddle is a real-time communication backend that powers messaging, voice and video calls, and video conferences. It gives developers a ready-to-use foundation for building chat and calling applications with user accounts, conversation management, and live WebRTC signaling.

## Overview

Huddle is a real-time communication platform that allows users to connect and communicate through direct messaging, group conversations, and voice or video calls. It provides a seamless space for sharing messages, staying connected, and collaborating with others.

Built with real-time messaging, online presence, conversation management, and WebRTC-powered calling, Huddle brings everyday communication together in one application.

## System Architecture

```mermaid
flowchart LR
    Client["Web / Mobile Client"]
    API["API Server"]
    Socket["Socket.io Gateway"]
    DB[("PostgreSQL")]
    Cache["Redis"]
    Queue["BullMQ / Email"]

    Client --> API
    Client --> Socket
    API --> DB
    API --> Cache
    API --> Queue
    Socket --> DB
    Socket --> Cache

    style Client fill:#1e1b4b,stroke:#6366f1,stroke-width:2px,color:#fff
    style API fill:#2e1065,stroke:#8b5cf6,stroke-width:2px,color:#fff
    style Socket fill:#2e1065,stroke:#8b5cf6,stroke-width:2px,color:#fff
    style DB fill:#0f172a,stroke:#3b82f6,stroke-width:2px,color:#fff
    style Cache fill:#4c0519,stroke:#ef4444,stroke-width:2px,color:#fff
    style Queue fill:#451a03,stroke:#f59e0b,stroke-width:2px,color:#fff
```

## Features

### Secure Authentication

Huddle supports local registration with email verification, password reset via OTP, and Google OAuth. Sessions are tracked server-side, refresh tokens are rotated, and suspicious reuse triggers a full logout.

```mermaid
sequenceDiagram
    actor User
    participant API
    participant DB as Database

    User->>API: Register or login
    API->>DB: Validate credentials
    API->>API: Create session and tokens
    API->>User: Return access and refresh tokens
```

### Real-Time Messaging

Users can send messages, reactions, and mentions inside direct or group conversations. Typing indicators and read receipts keep conversations feeling responsive.

```mermaid
sequenceDiagram
    actor Sender
    participant Server
    participant DB as Database
    actor Recipient

    Sender->>Server: Send message
    Server->>Server: Validate membership
    Server->>DB: Store message
    Server->>Recipient: Push message
    Recipient->>Server: Send read receipt
```

### Voice and Video Calls

One-on-one and group calls use Socket.io for signaling and WebRTC for media. The server mediates offers, answers, and ICE candidates so peers can connect directly.

```mermaid
sequenceDiagram
    actor Caller
    participant Server
    actor Recipient

    Caller->>Server: Initiate call
    Server->>Recipient: Incoming call
    Recipient->>Server: Accept call
    Caller->>Recipient: Exchange offer and answer
```

### Scheduled Video Conferences

Organizers can create scheduled meets inside a conversation. Members receive invitations and can join a shared conference room with the same real-time signaling used for calls.

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/obed-smart/Huddle.git
cd Huddle
npm install
```

Create a `.env` file in the project root. See the environment variables section below for the full list.

Run the database migrations:

```bash
npm run db:generate
npm run db:migrate
```

Start the development server:

```bash
npm run dev
```

The API will be available at `http://localhost:5000` by default, or whatever port you set in your environment.

## Usage

After starting the server, check that it is running:

```bash
curl http://localhost:5000/health
```

Register a new account:

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securePassword123",
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

Login to receive cookies:

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "identifier": "johndoe",
    "password": "securePassword123"
  }'
```

Connect to the real-time gateway from a client using Socket.io. The connection requires the `accessToken` cookie set during login or refresh.

## Technologies Used

| Technology | Description |
|---|---|
| [TypeScript](https://www.typescriptlang.org/) | Typed JavaScript for safer, maintainable code |
| [Express](https://expressjs.com/) | Web framework for routing and middleware |
| [Drizzle ORM](https://orm.drizzle.team/) | Type-safe database access and migrations |
| [PostgreSQL](https://www.postgresql.org/) | Primary relational database |
| [Redis](https://redis.io/) | Caching, session tracking, and rate limiting |
| [Socket.io](https://socket.io/) | Real-time bidirectional event transport |
| [BullMQ](https://bullmq.io/) | Background job processing for emails |
| [Passport](https://www.passportjs.org/) | Authentication strategies including Google OAuth |
| [Zod](https://zod.dev/) | Runtime request validation |
| [Pino](https://getpino.io/) | Structured logging |

## API Documentation

All API responses share this envelope:

```json
{
  "success": true,
  "data": {},
  "message": null
}
```

Protected endpoints require the access token cookie. Most POST and PATCH bodies expect JSON.

### Authentication

#### POST /api/v1/auth/register
**Description**: Create a new account with email, username, and password.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response**:
```json
{
  "success": true,
  "data": "If this email can be used, we've sent you a message.",
  "message": null
}
```

**Errors**:
- 400: Validation error
- 409: Email or username already taken

#### POST /api/v1/auth/login
**Description**: Authenticate with email or username and password.

**Request**:
```json
{
  "identifier": "johndoe",
  "password": "securePassword123"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "avataUrl": null
  },
  "message": null
}
```

**Errors**:
- 400: Validation error
- 401: Invalid credentials
- 429: Too many attempts

#### POST /api/v1/auth/logout
**Description**: Log out the current session.

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": null,
  "message": null
}
```

**Errors**:
- 401: Unauthorized

#### POST /api/v1/auth/logoutAll
**Description**: Log out all sessions for the current user.

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": null,
  "message": null
}
```

**Errors**:
- 401: Unauthorized

#### GET /api/v1/auth/google
**Description**: Start Google OAuth flow.

#### GET /api/v1/auth/google/callback
**Description**: Callback for Google OAuth. On success, sets cookies and redirects to the frontend dashboard.

#### POST /api/v1/auth/refresh
**Description**: Rotate the access and refresh tokens using the refresh token cookie.

**Response**:
```json
{
  "success": true,
  "data": null,
  "message": null
}
```

**Errors**:
- 400: Refresh token not found
- 401: Invalid or reused token

#### POST /api/v1/auth/forgot-password
**Description**: Request a password reset OTP.

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
  "data": "If an account exists, we've sent a code to that email.",
  "message": null
}
```

**Errors**:
- 400: Validation error

#### POST /api/v1/auth/reset-password
**Description**: Reset the password using the OTP sent by email.

**Request**:
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "password": "newSecurePassword123",
  "passwordCompare": "newSecurePassword123"
}
```

**Response**:
```json
{
  "success": true,
  "data": "password Reset successfully",
  "message": null
}
```

**Errors**:
- 400: Invalid or expired code
- 401: Too many attempts

#### POST /api/v1/auth/verify-email
**Description**: Verify an email address using the token from the verification link.

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
  "data": { "message": "email verification successfull" },
  "message": null
}
```

**Errors**:
- 400: Invalid or expired token

#### POST /api/v1/auth/resend-verification
**Description**: Resend the verification email.

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
  "data": { "message": "If this email can be used, we've sent you a message." },
  "message": null
}
```

### Users

#### GET /api/v1/user/me
**Description**: Get the current authenticated user's profile.

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "displayName": "John Doe",
    "avatarUrl": null,
    "bio": null,
    "globalRole": "user",
    "isEmailVerified": true
  },
  "message": null
}
```

**Errors**:
- 401: Unauthorized

#### GET /api/v1/user/search?username=john
**Description**: Search users by username.

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "username": "johndoe",
      "displayName": "John Doe",
      "avatarUrl": null,
      "bio": null
    }
  ],
  "message": null
}
```

#### GET /api/v1/user/:username
**Description**: Get a public profile by username.

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "johndoe",
    "displayName": "John Doe",
    "avatarUrl": null,
    "bio": null
  },
  "message": null
}
```

**Errors**:
- 401: Unauthorized
- 404: User not found

#### GET /api/v1/user/me/pending-invites
**Description**: List pending group invites for the current user.

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "kind": "invite",
      "conversationId": "uuid",
      "fromUser": "uuid",
      "conversationName": "Team Huddle",
      "conversationAvatar": null,
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "message": null
}
```

### Conversations

All conversation endpoints require authentication.

#### GET /api/v1/conversation
**Description**: List all conversations for the current user.

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "direct",
      "name": "Jane Doe",
      "avatar": null,
      "otherUserId": "uuid",
      "membersCount": null,
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "message": null
}
```

#### GET /api/v1/conversation/:conversationId
**Description**: Get detailed information about a group conversation, including participants.

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Team Huddle",
    "description": "Daily standup group",
    "avatarUrl": null,
    "visibility": "private",
    "inviteCode": null,
    "membersCount": 5,
    "myRole": "admin",
    "participants": []
  },
  "message": null
}
```

**Errors**:
- 400: Invalid conversation ID
- 404: Conversation not found

#### POST /api/v1/conversation/ping
**Description**: Start or request a direct conversation with another user.

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
  "data": { "conversation object" },
  "message": null
}
```

#### POST /api/v1/conversation/pings/:id/accept
**Description**: Accept a pending direct conversation request.

**Response**:
```json
{
  "success": true,
  "data": { "message": "Ping accepted" },
  "message": null
}
```

#### POST /api/v1/conversation/pings/:id/decline
**Description**: Decline a pending direct conversation request.

**Response**:
```json
{
  "success": true,
  "data": { "message": "Ping declined" },
  "message": null
}
```

#### POST /api/v1/conversation/groups
**Description**: Create a new group conversation.

**Request**:
```json
{
  "name": "Team Huddle",
  "description": "Daily standup group",
  "visibility": "private",
  "participantIds": ["uuid-1", "uuid-2"]
}
```

**Response**:
```json
{
  "success": true,
  "data": { "conversation object" },
  "message": null
}
```

**Errors**:
- 400: Validation error
- 403: Cannot invite yourself

#### PATCH /api/v1/conversation/invites/:requestId
**Description**: Accept or decline a group invitation as the invitee.

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
  "data": { "status": "accepted", "conversationId": "uuid" },
  "message": null
}
```

**Errors**:
- 403: Not your invite
- 409: Already resolved

#### PATCH /api/v1/conversation/join-requests/:requestId
**Description**: Approve or decline a pending group join request as an admin.

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
  "data": { "status": "accepted", "conversationId": "uuid" },
  "message": null
}
```

**Errors**:
- 403: Not authorized

#### PATCH /api/v1/conversation/:conversationId
**Description**: Update a group conversation's name, description, avatar, or visibility.

**Authentication**: Required, group admin only

**Request**:
```json
{
  "name": "New Name",
  "description": "Updated description"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "message": "Conversation updated successfully",
    "updatedConversation": { }
  },
  "message": null
}
```

**Errors**:
- 403: Not authorized
- 409: Another admin is currently modifying this conversation

#### PATCH /api/v1/conversation/:conversationId/invite-code
**Description**: Generate or regenerate a group invite code.

**Authentication**: Required, group admin only

**Response**:
```json
{
  "success": true,
  "data": {
    "inviteCode": "abc123",
    "invitelink": "http://localhost:3000/invite/abc123"
  },
  "message": null
}
```

#### GET /api/v1/conversation/invites/:inviteCode
**Description**: Preview a conversation by its invite code.

**Response**:
```json
{
  "success": true,
  "data": { "conversation preview" },
  "message": null
}
```

**Errors**:
- 404: Conversation not found

#### POST /api/v1/conversation/invites/:inviteCode
**Description**: Join a group using an invite code. For private groups, a join request may be created instead.

**Response**:
```json
{
  "success": true,
  "data": { "participant record" },
  "message": null
}
```

#### POST /api/v1/conversation/invites
**Description**: Invite a user to a group as an admin.

**Request**:
```json
{
  "conversationId": "uuid",
  "userId": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "data": { "message": "User invited successfully" },
  "message": null
}
```

**Errors**:
- 403: Not authorized
- 400: User is already a member

#### GET /api/v1/conversation/:conversationId/requests
**Description**: List pending join requests for a group.

**Authentication**: Required, group admin only

**Response**:
```json
{
  "success": true,
  "data": {
    "result": 1,
    "requests": []
  },
  "message": null
}
```

#### GET /api/v1/conversation/:conversationId/messages
**Description**: Get the message timeline for a conversation.

**Query Parameters**:
- `limit`: number of items
- `before`: ISO date cursor

**Response**:
```json
{
  "success": true,
  "data": [],
  "message": null
}
```

#### PATCH /api/v1/conversation/:conversationId/participants/:userId/role
**Description**: Promote or demote a member to admin or member.

**Authentication**: Required, group admin only

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
  "data": "New Admin added successfully",
  "message": null
}
```

#### DELETE /api/v1/conversation/:conversationId/participants/me
**Description**: Leave a group conversation.

**Response**:
```json
{
  "success": true,
  "data": "User left the group successfully",
  "message": null
}
```

#### DELETE /api/v1/conversation/:conversationId/participants/:userId
**Description**: Remove a member from a group.

**Authentication**: Required, group admin only

**Response**:
```json
{
  "success": true,
  "data": { "message": "Member removed successfully" },
  "message": null
}
```

#### DELETE /api/v1/conversation/:conversationId
**Description**: Delete a group conversation.

**Authentication**: Required, conversation creator only

**Response**:
```json
{
  "success": true,
  "data": { "message": "Conversation deleted successfully" },
  "message": null
}
```

### Calls

#### GET /api/v1/call
**Description**: Get paginated call history for the current user.

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": {
    "callLOg": [],
    "nextCursor": null
  },
  "message": null
}
```

#### GET /api/v1/call/active
**Description**: Get active calls the user is authorized to join.

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": [],
  "message": null
}
```

### Meets

#### POST /api/v1/meet
**Description**: Create a new meet inside a conversation.

**Authentication**: Required

**Request**:
```json
{
  "conversationId": "uuid",
  "title": "Team Standup",
  "scheduledFor": "2025-12-31T10:00:00.000Z"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "meetId": "uuid",
    "conversationId": "uuid",
    "title": "Team Standup",
    "scheduledFor": "2025-12-31T10:00:00.000Z"
  },
  "message": null
}
```

**Errors**:
- 400: Validation error
- 409: Active instant meet already exists

#### GET /api/v1/meet/active
**Description**: Get active meets for the current user.

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": [],
  "message": null
}
```

### Environment Variables

Create a `.env` file with the following variables:

```bash
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/huddle

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_ACCESS_SECRET=your_access_secret
REFRESH_TOKEN_LIFESPAN_DAYS=7
EMAIL_VERIFICATION_LIFESPAN=24

# OTP
OTP_SECRET=your_otp_secret

# Email (SMTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=you@example.com
SMTP_PASS=your_smtp_password

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Object Storage (R2 / S3)
STORAGE_ENDPOINT=...
STORAGE_BUCKET=...
STORAGE_ACCESS_KEY=...
STORAGE_SECRET_KEY=...
```

## Contributing

Contributions are welcome. To get started, fork the repository, create a branch for your changes, and open a pull request. Please keep the code style consistent with the existing modules and add tests where possible.

## Author

- LinkedIn: https://linkedin.com/in/obed-smart
- X (Twitter): https://x.com/eberechukwuobed

## Badges

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)

[![Readme was generated by Dokugen](https://img.shields.io/badge/Readme%20was%20generated%20by-Dokugen-brightgreen)](https://dokugen.samueltuoyo.com)