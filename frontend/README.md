# Student Dating Frontend

Directory scaffold for the Student Dating web UI prototype, maintained separately from `backend/`.

## Status

This directory currently contains only the folder structure and sample configuration. No framework, dependencies, or development/build scripts have been configured. `package.json` contains package metadata only; running `npm install` is not required yet.

## Structure

```text
frontend/
├── public/                 # Static files served directly
├── src/
│   ├── app/                # Application setup, router, and providers
│   ├── pages/
│   │   ├── auth/           # Sign-in and sign-up
│   │   ├── discovery/      # Profile discovery, likes, and skips
│   │   ├── profile/        # Profile, interests, and search preferences
│   │   ├── chat/           # Conversations and messages
│   │   └── notifications/  # Notification inbox
│   ├── components/
│   │   ├── ui/             # Shared buttons, inputs, modals, and other UI components
│   │   └── layout/         # Navigation, header, and page layout
│   ├── services/           # Data access and API calls
│   ├── mocks/              # Mock data for demos
│   ├── assets/             # Images and icons imported by source files
│   └── styles/             # Global CSS, colors, and typography
├── .env.example
├── package.json
└── README.md
```

The `.gitkeep` files allow Git to track empty directories. Remove them when the directories contain actual source files.

## Implementation Steps

1. Configure the framework and build tools in this directory. The proposed structure is intended for React and TypeScript.
2. Implement the sign-in → discovery → like → match → chat flow using data from `src/mocks/`.
3. Keep data access in `src/services/` to make switching from mock data to the API straightforward.
4. Add profile editing and notifications as required by the prototype scope.

## Backend Integration

- See the [API reference](../docs/API.md), [architecture](../docs/architecture.md), and [realtime events](../docs/realtime-socket-events.md).
- The backend defaults to `http://localhost:3000`. Check the documentation against the actual routers and schemas before integration.
- Sign-in and sign-up use Supabase Auth on the client. Protected API requests send the access token through `Authorization: Bearer ...`.
- When using Vite, copy `.env.example` to `.env` and fill in the Supabase URL and publishable key. No code currently reads these variables.
- Never include `SUPABASE_SERVICE_ROLE_KEY` or database credentials in the frontend.
- Chat writes use REST, while live updates are delivered through Socket.IO.
