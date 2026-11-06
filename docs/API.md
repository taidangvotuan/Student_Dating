# API Reference — Student Dating Backend

> **Base URL:** `http://localhost:3000`  
> **Content-Type:** `application/json` for all request/response bodies.

---

## Table of Contents

1. [Authentication](#authentication)
2. [Error Format](#error-format)
3. [Utility Endpoints](#utility-endpoints)
4. [Profile Endpoints](#profile-endpoints)
5. [Chat Endpoints](#chat-endpoints)
6. [User Endpoints](#user-endpoints)
7. [Enum Reference](#enum-reference)

---

## Authentication

The backend **never** handles signup or login. All user authentication is managed by **Supabase Auth** directly on the client.

### Frontend Signup Flow

Call `supabase.auth.signUp()` on the frontend with required metadata in the `data` field:

```js
const { data, error } = await supabase.auth.signUp({
  email: "24520001@gm.uit.edu.vn",   // must end with .edu.vn
  password: "securepassword",
  options: {
    data: {
      fullname: "Nguyen Van A",         // required, non-empty string
      birthday: "2006-01-15",           // required, YYYY-MM-DD, must be in the past
      gender: "Nam",                    // optional
      faculty: "Khoa học máy tính",    // optional
      cohort: "2024"                    // optional
    }
  }
});
```

> **Email rules:** Must end with `.edu.vn`. The first 8 characters of the email local-part become the student ID (e.g. `24520001@gm.uit.edu.vn` → student ID `24520001`).

A PostgreSQL BEFORE INSERT trigger validates the email, `fullname`, and `birthday`. If validation fails, the entire signup is rejected. On success, an AFTER INSERT trigger automatically creates rows in `students`, `profiles`, and `verifications`.

### Authenticating API Requests

Every protected endpoint requires a valid Supabase JWT in the `Authorization` header:

```
Authorization: Bearer <supabase_access_token>
```

Obtain the token from `supabase.auth.getSession()` or any `supabase.auth.signIn*()` call on the frontend.

---

## Error Format

All errors return a consistent JSON body:

```json
{
  "status": "error",
  "message": "Human-readable description"
}
```

| HTTP Status | Cause |
|-------------|-------|
| `400` | Bad request / business logic error |
| `401` | Missing, invalid, or expired JWT |
| `403` | Authenticated but not authorized |
| `404` | Resource not found |
| `422` | Zod validation failure (request body schema error) |
| `500` | Internal server error |

**Zod 422 errors** include a `details` array:

```json
{
  "status": "error",
  "message": "Validation failed",
  "details": [
    {
      "path": ["birthDate"],
      "message": "Invalid date format, expected YYYY-MM-DD"
    }
  ]
}
```

---

## Utility Endpoints

### `GET /`

Welcome message. No authentication required.

**Response `200`:**
```json
{ "message": "Student Dating API" }
```

---

### `GET /health`

Configuration health check — no network calls made.

**Response `200`:**
```json
{
  "status": "ok",
  "environment": "development",
  "port": 3000,
  "supabaseConfigured": true,
  "databaseConfigured": true
}
```

---

### `GET /api/supabase/status`

Live connectivity check against Supabase Auth. No authentication required.

**Response `200`:**
```json
{ "status": "ok", "supabase": "connected" }
```

**Response `503`:**
```json
{ "status": "error", "supabase": "unreachable", "message": "..." }
```

---

### `GET /api/prisma/status`

Live connectivity check against PostgreSQL via Prisma. No authentication required.

**Response `200`:**
```json
{ "status": "ok", "database": "connected" }
```

**Response `503`:**
```json
{ "status": "error", "database": "unreachable", "message": "..." }
```

---

## Profile Endpoints

All `/api/profile` endpoints require `Authorization: Bearer <token>`.

---

### `GET /api/profile`

Retrieve the authenticated user's full profile including interests, preferences, and verification status.

**Response `200`:**
```json
{
  "status": "success",
  "data": {
    "profile": {
      "id": "uuid",
      "studentId": "24520001",
      "fullName": "Nguyen Van A",
      "birthDate": "2006-01-15",
      "gender": "Nam",
      "bio": "Hello!",
      "faculty": "Khoa học máy tính",
      "cohort": "2024",
      "connectionGoal": "Bạn bè",
      "visibility": "CON_HOAT_DONG",
      "createdAt": "2024-11-02T10:00:00.000Z",
      "updatedAt": "2024-11-02T10:00:00.000Z"
    },
    "student": {
      "studentId": "24520001",
      "email": "24520001@gm.uit.edu.vn",
      "accountStatus": "HOAT_DONG"
    },
    "verification": {
      "status": "CHUA_XAC_THUC",
      "updatedAt": "2024-11-02T10:00:00.000Z"
    },
    "interests": [
      { "id": "uuid", "name": "Gaming", "category": "Entertainment" }
    ],
    "preferences": {
      "minAge": 18,
      "maxAge": 25,
      "preferredGender": "Nữ",
      "preferredFaculty": null,
      "maxDistanceKm": 10,
      "verifiedOnly": false
    }
  }
}
```

---

### `PATCH /api/profile`

Update the authenticated user's own profile. All fields are optional.

**Request Body:**
```json
{
  "fullName": "Nguyen Van A",
  "birthDate": "2006-01-15",
  "gender": "Nam",
  "bio": "Hello world",
  "faculty": "Khoa học máy tính",
  "cohort": "2024",
  "connectionGoal": "Bạn bè",
  "visibility": "CON_HOAT_DONG"
}
```

**`visibility` values users may set:**

| Value | Meaning |
|-------|---------|
| `CON_HOAT_DONG` | Visible / active in discovery |
| `BI_AN` | Hidden from discovery |

> `BI_KHOA` and `NGUNG_SU_DUNG` are backend/admin-only and will be rejected if submitted by a user.

**Response `200`:**
```json
{
  "status": "success",
  "data": { "profile": { "...updated fields..." } }
}
```

---

### `PUT /api/profile/interests`

Replace the authenticated user's interest selections. Submit an empty array to clear all interests.

**Request Body:**
```json
{
  "interestIds": [
    "550e8400-e29b-41d4-a716-446655440000",
    "6ba7b810-9dad-11d1-80b4-00c04fd430c8"
  ]
}
```

**Response `200`:**
```json
{
  "status": "success",
  "data": {
    "interests": [
      { "id": "uuid", "name": "Gaming", "category": "Entertainment" }
    ]
  }
}
```

**Response `400`:** One or more IDs are invalid or inactive.

---

### `PUT /api/profile/preferences`

Upsert the authenticated user's search preferences.

**Request Body:**

| Field | Type | Constraints |
|-------|------|-------------|
| `minAge` | `number` | ≥ 16, ≤ `maxAge` |
| `maxAge` | `number` | ≤ 100 |
| `preferredGender` | `string \| null` | Free text or null |
| `preferredFaculty` | `string \| null` | Free text or null |
| `maxDistanceKm` | `number` | ≥ 1, ≤ 500 |
| `verifiedOnly` | `boolean` | — |

```json
{
  "minAge": 18,
  "maxAge": 25,
  "preferredGender": "Nữ",
  "preferredFaculty": null,
  "maxDistanceKm": 10,
  "verifiedOnly": false
}
```

**Response `200`:**
```json
{
  "status": "success",
  "data": { "preferences": { "...upserted fields..." } }
}
```

---

### `GET /api/discovery/criteria`

Get the authenticated user's discovery search criteria. If no criteria have
been saved yet, defaults are returned (`minAge: 18`, `maxAge: 100`,
`maxDistanceKm: null`, `verifiedOnly: true`).

### `PUT /api/discovery/criteria`

Update one or more discovery criteria. Omitted fields remain unchanged; nullable
filters (`preferredGender`, `preferredFaculty`, and `maxDistanceKm`) can be
cleared by sending `null`. The effective minimum age cannot exceed the maximum
age.

**Request Body:**
```json
{
  "minAge": 18,
  "maxAge": 25,
  "preferredGender": "Nữ",
  "preferredFaculty": null,
  "maxDistanceKm": 10,
  "verifiedOnly": false
}
```

Both endpoints return `{ "status": "success", "data": { ...criteria } }`.

---

### `POST /api/interactions/:targetId/like`
### `POST /api/interactions/:targetId/skip`
### `POST /api/interactions/:targetId/block`

Like, skip, or block an active profile. The authenticated user's ID is used as
the actor; `targetId` in the URL must identify another active profile. These
endpoints do not require a request body.

Repeating an action is safe; like/skip updates the current interaction. A
successful like emits an internal event for asynchronous matching; the
response confirms the like was saved and does not report whether a match was
created. A block removes interactions in both directions, cancels an existing
match, and disables its conversation. A blocked pair cannot like or skip each
other.

**Response `200`:**
```json
{
  "status": "success",
  "data": {
    "action": "THICH"
  }
}
```

---

### `GET /api/profile/interests`

List all globally available, active interest tags.

**Response `200`:**
```json
{
  "status": "success",
  "data": {
    "interests": [
      { "id": "uuid", "name": "Gaming", "category": "Entertainment" },
      { "id": "uuid", "name": "Hiking", "category": "Sports" }
    ]
  }
}
```

---

## Chat Endpoints

All endpoints require a valid Supabase access token. Realtime delivery, typing
indicators, presence, attachments, and push notifications are not included in
this REST API.

### Conversation lifecycle and access

- A successful match causes the Chat module to create or reactivate its unique
  conversation. Clients do not create conversations directly; an existing
  match reactivates the existing conversation rather than duplicating it.
- Only the two students in the matched pair may read or write the conversation.
  The backend derives the caller ID from the JWT and never accepts a sender ID
  from the request body.
- A conversation deactivated after a block remains available to its participants
  for reading history, but no new messages can be sent. This matches the
  existing soft-deactivation model; blocked participants cannot interact again.
- Chat rows are written through the trusted backend, not directly through the
  Supabase Data API.

### `GET /api/chat`

List the authenticated user's conversations, ordered by latest activity
timestamp descending and conversation ID descending as a stable tie-breaker.
The activity timestamp is the conversation's latest update: match creation,
reactivation or deactivation, message send, or message deletion. Both active and
deactivated conversations are included.

**Query parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `limit` | integer | `20` | Page size, from 1 to 50. |
| `cursor` | string | — | Opaque snapshot cursor returned by the previous page. Omit for the first page. |

Each item includes the conversation ID and status, match ID, the other
participant's public profile summary, latest non-deleted message preview (or
`null`), unread message count for the caller, and creation/activity timestamps. The activity
timestamp is refreshed when a message is sent. Unread count is the number of
non-deleted messages from the other participant newer than the caller's
`lastReadAt`.

**Response `200`:**
```json
{
  "status": "success",
  "data": {
    "conversations": [
      {
        "id": "conversation-uuid",
        "matchId": "match-uuid",
        "status": "HOAT_DONG",
        "participant": {
          "id": "student-uuid",
          "fullName": "Nguyen Van A"
        },
        "latestMessage": {
          "id": "message-uuid",
          "senderId": "student-uuid",
          "body": "Hello!",
          "sentAt": "2026-11-05T08:30:00.000Z"
        },
        "unreadCount": 2,
        "createdAt": "2026-11-05T08:00:00.000Z",
        "activityAt": "2026-11-05T08:30:00.000Z"
      }
    ],
    "nextCursor": "opaque-cursor-or-null"
  }
}
```

### `GET /api/chat/:conversationId`

Get one conversation's status, match ID, both participant summaries, the
caller's read timestamp, latest message preview, and unread count. Deactivated
conversations can be retrieved by their participants so they can read history.

Returns `404` when the conversation does not exist or the caller is not a
participant.

### `GET /api/chat/:conversationId/messages`

List a conversation's messages in reverse chronological order using the stable
`sentAt DESC, id DESC` ordering. Pages are cursor-based; the opaque cursor
identifies the last item from the previous page. The API returns at most 100
messages per page (default 30). Deleted messages remain in the history as
tombstones with `status: "DA_XOA"`, `body: null`, and `deletedAt` set.

**Query parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `limit` | integer | `30` | Page size, from 1 to 100. |
| `cursor` | string | — | Opaque cursor returned by the previous page. Omit for the newest page. |

**Response `200`:**
```json
{
  "status": "success",
  "data": {
    "messages": [
      {
        "id": "message-uuid",
        "conversationId": "conversation-uuid",
        "senderId": "student-uuid",
        "body": "Hello!",
        "status": "DA_GUI",
        "sentAt": "2026-11-05T08:30:00.000Z",
        "deletedAt": null
      }
    ],
    "nextCursor": "opaque-cursor-or-null"
  }
}
```

Returns `404` when the conversation does not exist or the caller is not a
participant.

### `POST /api/chat/:conversationId/messages`

Send a text message to an active conversation. The sender is taken from the
authenticated JWT. The body must contain non-whitespace text of at most 5,000
characters, matching the database constraint.

**Request:**
```json
{ "body": "Hello!" }
```

**Response `201`:**
```json
{
  "status": "success",
  "data": {
    "id": "message-uuid",
    "conversationId": "conversation-uuid",
    "senderId": "authenticated-student-uuid",
    "body": "Hello!",
    "status": "DA_GUI",
    "sentAt": "2026-11-05T08:30:00.000Z",
    "deletedAt": null
  }
}
```

Returns `404` when the conversation does not exist or the caller is not a
participant, `409` when the conversation is deactivated, and `422` for an empty
or overlong message body.

### `DELETE /api/chat/:conversationId/messages/:messageId`

Soft-delete a message authored by the authenticated user. Deletion clears the
stored body, sets `status` to `DA_XOA`, and records `deletedAt`; it does not
remove the message row, preserving history order for both participants.

**Response `200`:**
```json
{
  "status": "success",
  "data": {
    "id": "message-uuid",
    "conversationId": "conversation-uuid",
    "senderId": "authenticated-student-uuid",
    "body": null,
    "status": "DA_XOA",
    "sentAt": "2026-11-05T08:30:00.000Z",
    "deletedAt": "2026-11-05T08:35:00.000Z"
  }
}
```

Returns `404` if the message or conversation is not found or the caller is not
a participant, and `403` if the caller is not the message author. Repeating a
delete for an already deleted message returns its existing tombstone.

### `PUT /api/chat/:conversationId/read`

Mark all messages received before the request as read for the authenticated
participant. The server upserts the caller's `ConversationRead` record and sets
`lastReadAt` using server time. This endpoint does not accept a student ID or
timestamp from the client.

**Response `200`:**
```json
{
  "status": "success",
  "data": {
    "conversationId": "conversation-uuid",
    "studentId": "authenticated-student-uuid",
    "lastReadAt": "2026-11-05T08:35:00.000Z"
  }
}
```

Returns `404` when the conversation does not exist or the caller is not a
participant. Calling it repeatedly is safe.

Conversation list cursors preserve the activity timestamp and stable
conversation-ID tie-breaker. If any conversation activity changes after the
first page, the API returns `409` and the client should restart pagination to
avoid silently omitting or duplicating conversations. Unread counts are
calculated when each page is read.

For all endpoints, malformed UUIDs or invalid query/body values return `422`;
unauthenticated requests return `401`. Error responses use the standard format
documented above.

---

## User Endpoints

These endpoints require a valid Supabase access token. Each endpoint lists its required role.

### `PUT /api/users/:userId/role`

Requires the `ADMIN` role. Assign or promote an existing user to `MODERATOR` or `ADMIN`. `userId` must be a UUID.

**Request:**
```json
{ "role": "MODERATOR" }
```

**Response `200`:**
```json
{
  "status": "success",
  "data": {
    "userId": "uuid",
    "role": "MODERATOR",
    "updatedAt": "2026-11-05T00:00:00.000Z"
  }
}
```

Returns `404` if the user does not exist, `409` if the change would downgrade an existing `ADMIN`, or `422` for an invalid UUID or role. This endpoint does not revoke roles. A changed role is included in the user's JWT the next time Supabase issues an access token after the Custom Access Token Hook runs.

### `PUT /api/users/:userId/verification/approve`

Requires the `MODERATOR` or `ADMIN` role. Approves a pending verification.

No request body is required.

### `PUT /api/users/:userId/verification/reject`

Requires the `MODERATOR` or `ADMIN` role. Rejects a pending verification.

**Request:**
```json
{ "rejectionReason": "Document is unclear." }
```

Rejection reason is required and cannot be blank. Both responses include the new status, reviewer ID, review time, and rejection reason. The reason is also returned to the user in `GET /api/profile`. Returns `404` if no verification exists, `409` if it is not pending, or `422` for an invalid UUID or rejection reason.

---

## Enum Reference

| Enum | Values |
|------|--------|
| `AccountStatus` | `HOAT_DONG`, `TAM_KHOA`, `KHOA_VINH_VIEN` |
| `ProfileVisibility` | `CON_HOAT_DONG`, `BI_AN`, `BI_KHOA`, `NGUNG_SU_DUNG` |
| `VerificationStatus` | `CHUA_XAC_THUC`, `CHO_DUYET`, `DA_XAC_THUC`, `TU_CHOI` |
| `InteractionKind` | `THICH`, `BO_QUA` |
| `MatchStatus` | `DA_GHEP_DOI`, `DANG_HOAT_DONG`, `DA_HUY` |
| `ConversationStatus` | `HOAT_DONG`, `KHONG_HOAT_DONG` |
| `MessageStatus` | `DA_GUI`, `DA_XOA` |
| `UserRole` | `USER`, `MODERATOR`, `ADMIN` |
