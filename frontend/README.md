# Student Dating Frontend

A React + TypeScript + Vite MVP for a student dating platform for adults aged **18 and over**. The interface is in Vietnamese and includes demo sign-in and registration, profile setup, discovery and filters, mutual matching, conversations, and notifications.

The frontend currently runs entirely in **demo mode**. No backend, Supabase account, database, Redis instance, or environment file is required.

## Prerequisites

- Node.js **22.12 or newer** (verified with Node.js 24.18.0).
- npm, included with Node.js.
- Git and a modern browser.

## Install and run

From your local checkout of this repository:

```sh
cd frontend
npm ci
npm run dev
```

Open **http://127.0.0.1:5173** and select **Trải nghiệm demo** to enter the application.

On Windows PowerShell, use `npm.cmd` if your execution policy blocks `npm.ps1`:

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
```

Stop the server with **Ctrl+C**. If port 5173 is busy, stop the process using it or run `npm run dev -- --port 5174` and open the URL printed by Vite.

The integrated MVP is on the `mvp/student-dating` branch. Install dependencies again with `npm ci` after pulling changes to `package-lock.json`. Commit dependency changes together with the lockfile.

## Build and preview

```sh
npm run build
npm run preview
```

The build is written to `dist/`. Open the preview URL printed in the terminal (normally http://127.0.0.1:4173). Both development and preview servers bind to the local machine by default.

## Demo walkthrough

1. Select **Trải nghiệm demo**. Your fictional demo identity is **Nguyễn Nhật Minh**.
2. Open **Xem hồ sơ** for **Trần Khánh Linh**, then close the details dialog.
3. Like Linh: the app advances to **Lê Hoài An** without creating a match.
4. Like An: An has already liked you, so a mutual match dialog appears.
5. Select **Bắt đầu trò chuyện**, write a message, and send it. Enter sends; Shift+Enter inserts a new line.
6. Open **Thông báo** and select the match notification. It becomes read, updates the badge, and opens An's conversation. Message unread counts and notification read state are independent.
7. Open **Hồ sơ**, edit your information, interests, sample avatar, or preferences, and select **Lưu hồ sơ**. Reload to verify persistence.
8. Continue discovery: Nam has not liked you; Mai has already liked you. Match with Mai to test separate notification links.

**Đặt lại demo** resets demo progress after confirmation. It is available in the desktop sidebar and in the mobile profile screen. Blocking also requires confirmation; **Hủy, giữ hồ sơ** or Escape cancels without changing the profile.

Registration accepts a student email ending in `.edu.vn`, a password of at least eight characters, a name, and a valid date of birth aged 18 or over. Gender, faculty, and cohort are optional. Successful registration creates a local demo profile and opens profile setup.

## Scripts and checks

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local Vite development server |
| `npm run build` | Check TypeScript and create a production bundle |
| `npm run preview` | Serve the built bundle locally |
| `npm run typecheck` | Run TypeScript checks |
| `npm run lint` | Run ESLint |
| `npm test` | Run the domain and storage tests with Vitest |
| `npm run test:e2e` | Run browser acceptance tests at mobile and desktop sizes |
| `npm run format` | Format source code and test configuration |
| `npm run format:check` | Check formatting without modifying files |

Run build, lint, unit tests, and the relevant browser tests before handing off UI changes.

Playwright starts Vite automatically on port 5173 and tests **390 × 844** and **1440 × 1000**. On Windows it defaults to the installed Microsoft Edge browser. On other systems, install Chromium first:

```sh
npx playwright install chromium
npm run test:e2e
```

Override the browser channel with `PLAYWRIGHT_CHANNEL` when needed. PowerShell example:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'msedge'
npm.cmd run test:e2e
```

The suite covers the complete demo journey, persistence, registration validation, block cancellation and focus restoration, filters, empty states, and notification links. Axe checks the main screens for automated accessibility issues. Reports are generated in `playwright-report/`; screenshots and failure traces are in `test-results/`. These generated directories are ignored by Git.

## Source structure

```text
src/
  app/          Router and demo state provider
  components/   Shared controls, navigation, dialogs, and profile cards
  mocks/        Fictional profiles, interests, and seeded reciprocal likes
  pages/        Auth, discovery, profile, chat, and notification screens
  services/     Data models, validation, persistence, and domain operations
  styles/       Shared styles and responsive layouts
public/images/  Local sample portraits
```

Keep fixtures in `src/mocks/` and data operations in `src/services/` rather than embedding them in UI components. Reuse the shared components for forms, buttons, navigation, and dialogs. Desktop typography is enlarged above 800 px; mobile retains its own responsive rules.

## Demo storage and backend boundaries

**Every feature currently uses simulated data. No requests are sent to the backend.** Sign-in validates input format only; it does not authenticate credentials. Registration does not create a real account. Do not enter a real password.

Demo progress uses the versioned localStorage key `student-dating:demo:v1`: profile data, interactions, conversations, messages, notifications, and the demo session. Passwords and authentication tokens are never persisted. Zod strips unknown fields. Invalid stored data falls back to a fresh demo. When browser storage is unavailable, the UI reports that progress lasts only for the current session. Multiple tabs do not synchronize live.

Sample portraits, locations, verification badges, reciprocal likes, and the first incoming chat message are illustrative. Real uploads, OTP verification, location services, online presence, automatic replies, attachments, and push notifications are not implemented.

For future integration, follow the repository contracts:

- [Architecture](../docs/architecture.md)
- [API reference](../docs/API.md)
- [Database schema](../docs/database/DATABASE-SCHEMA.md)
- [Realtime events](../docs/realtime-socket-events.md)

Real authentication belongs to Supabase Auth on the client. Profile and interaction operations use the REST API. Real matching is asynchronous: wait for `matching.match.created`, then refresh conversations through REST rather than deriving a match from the like response. Send messages through REST; Socket.IO delivers updates, with REST refresh after reconnect. The server remains responsible for membership, blocking, and active-match checks.

`.env.example` reserves variables for future integration; the current MVP does not read them. Never put a Supabase service-role key or database credentials in the frontend.

## Design and assets

Figma access was unavailable because of the Starter MCP call limit. The interface follows the supplied fallback palette (`#176B5B`, `#E3F1E8`), light surfaces, rounded cards, and Inter with Vietnamese support. Inter is bundled locally through `@fontsource/inter` under the OFL license.

Portraits are local Unsplash illustrations for fictional characters, not real student identities. Original image IDs:

- Linh: `photo-1534528741775-53994a69daeb`
- An: `photo-1524504388940-b1c1722653e1`
- Minh: `photo-1506794778202-cad84cf45f1d`
- Nam: `photo-1500648767791-00dcc994a43e`
- Mai: `photo-1524250502761-1ac6f2e30d43`

Image source format: `https://images.unsplash.com/<image-id>`. See the [Unsplash License](https://unsplash.com/license).
