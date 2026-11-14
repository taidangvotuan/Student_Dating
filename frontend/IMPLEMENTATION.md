# Local MVP implementation

The frontend uses React, TypeScript and Vite in the existing `frontend/` scaffold.
The Figma MCP request for node `2:2` was denied by the Starter plan call limit.
The authorized fallback palette is used: #176B5B, #E3F1E8, light surfaces, local
Inter fonts, rounded cards. Desktop has a sidebar, content area and contextual
discovery panel; mobile has bottom navigation and a list/detail chat transition.

Feature branches are merged into `mvp/student-dating` in this order:
1. `feat/frontend-foundation`: toolchain and shared foundation.
2. `feat/auth-profile`: demo authentication, registration and profile setup.
3. `feat/discovery-matching`: discovery, filters, block confirmation and matching.
4. `feat/chat-notifications`: persisted chat and notification deep links.
5. `test/mvp-acceptance`: browser checks and handoff documentation.

Data stays in a versioned demo-only localStorage record. Passwords never enter
that record. All domain writes go through `src/services/`; fixtures live in
`src/mocks/`. No Supabase, REST or Socket.IO connections are opened by this MVP.
The service models follow docs/API.md; production matching must remain an
asynchronous server responsibility rather than relying on the demo like result.

Verification targets: build, TypeScript, ESLint, domain tests, Chromium browser
acceptance at 390 × 844 and 1440 × 1000, accessibility and empty/error states.
