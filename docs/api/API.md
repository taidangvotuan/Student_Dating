# API Reference — Student Dating Backend

> **Base URL:** `http://localhost:3000`  
> **Content-Type:** `application/json` for all request/response bodies.

---

## Table of Contents

1. [Authentication](#authentication)
2. [Error Format](#error-format)
3. [Utility Endpoints](#utility-endpoints)
4. [Profile Endpoints](#profile-endpoints)
5. [Enum Reference](#enum-reference)

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
