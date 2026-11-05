# Database Instructions — Prisma Client & Migrations

> Source files: [`prisma/schema.prisma`](../../prisma/schema.prisma) · [`src/database/prisma.ts`](../../src/database/prisma.ts)

Tra cứu mục đích của từng bảng, danh sách cột, kiểu PostgreSQL và ràng buộc tại [mô tả bảng và cột](DATABASE-SCHEMA.md#31-table-and-column-descriptions). Tài liệu schema cũng ghi các khác biệt hiện có giữa migration SQL và Prisma cần đối chiếu trước khi thay đổi database.

---

## 1. Using the Prisma Client in Code

### Import

Always import the singleton proxy. Never instantiate `PrismaClient` directly in feature code.

```typescript
import { prisma } from './database/prisma.js';

// Enums are also re-exported from the same module
import { AccountStatus, MatchStatus, InteractionKind } from './database/prisma.js';
```

The `prisma` export is a lazy proxy — the real client is only initialised on first access, so import order does not matter.

---

### Enum values

```typescript
// AccountStatus
'HOAT_DONG'      // active
'TAM_KHOA'       // temporarily locked
'KHOA_VINH_VIEN' // permanently locked

// VerificationStatus
'CHUA_XAC_THUC'  // unverified (default)
'CHO_DUYET'      // pending review
'DA_XAC_THUC'    // approved
'TU_CHOI'        // rejected

// ProfileVisibility
'CON_HOAT_DONG'  // discoverable
'BI_AN'          // hidden (default on creation)
'BI_KHOA'        // locked by admin
'NGUNG_SU_DUNG'  // deactivated

// InteractionKind
'THICH'          // like
'BO_QUA'         // skip

// MatchStatus
'DA_GHEP_DOI'    // matched
'DANG_HOAT_DONG' // active
'DA_HUY'         // cancelled

// ConversationStatus
'HOAT_DONG'      // open
'KHONG_HOAT_DONG'// closed

// MessageStatus
'DA_GUI'         // sent
'DA_XOA'         // soft-deleted
```

---

### Common query patterns

**Find a student with their profile:**
```typescript
const student = await prisma.student.findUnique({
  where: { id: studentId },
  include: { profile: true },
});
```

**Find active interests:**
```typescript
const interests = await prisma.interest.findMany({
  where: { isActive: true },
  orderBy: { name: 'asc' },
});
```

**Upsert search preferences:**
```typescript
await prisma.searchPreference.upsert({
  where: { studentId },
  create: { studentId, minAge: 18, maxAge: 30, verifiedOnly: true },
  update: { minAge: 18, maxAge: 30 },
});
```

**Record a like interaction:**
```typescript
await prisma.interaction.create({
  data: { actorId, targetId, kind: 'THICH' },
});
```

**Create a match, then let Chat create or reactivate its conversation:**

> [!IMPORTANT]
> `studentAId` must be lexicographically less than `studentBId`. Sort both UUIDs before calling this.

```typescript
const [a, b] = [studentId1, studentId2].sort();

const match = await prisma.match.upsert({
  where: { studentAId_studentBId: { studentAId: a, studentBId: b } },
  create: { studentAId: a, studentBId: b },
  update: { status: 'DA_GHEP_DOI' },
});
await chatService.activateConversation(match.id);
```

**Cancel a match, then let Chat deactivate its conversation:**
```typescript
const [a, b] = [studentId1, studentId2].sort();
const matches = await prisma.match.updateManyAndReturn({
  where: { studentAId: a, studentBId: b },
  data: { status: 'DA_HUY' },
  select: { id: true },
});
await chatService.deactivateConversations(matches.map(({ id }) => id));
```

**Paginate messages in a conversation (newest first):**
```typescript
const messages = await prisma.message.findMany({
  where: { conversationId, status: 'DA_GUI' },
  orderBy: [{ sentAt: 'desc' }, { id: 'desc' }],
  take: 30,
  cursor: lastMessageId ? { id: lastMessageId } : undefined,
  skip: lastMessageId ? 1 : 0,
});
```

**Soft-delete a message:**
```typescript
await prisma.message.update({
  where: { id: messageId },
  data: { status: 'DA_XOA', body: null, deletedAt: new Date() },
});
```

**Update last-read timestamp:**
```typescript
await prisma.conversationRead.upsert({
  where: { conversationId_studentId: { conversationId, studentId } },
  create: { conversationId, studentId, lastReadAt: new Date() },
  update: { lastReadAt: new Date() },
});
```

---

### Connection lifecycle helpers

```typescript
import {
  prisma,
  disconnectPrisma,
  verifyPrismaConnection,
} from './database/prisma.js';

// Startup health check
await verifyPrismaConnection(); // throws on failure

// Graceful shutdown
process.on('SIGTERM', async () => {
  await disconnectPrisma();
  process.exit(0);
});
```

---

## 2. Migrations

### Kiểm tra migration chuyển bảng xác minh

Sau khi áp dụng các migration trên PostgreSQL kiểm thử, chạy bài kiểm tra SQL bằng `psql`:

```bash
psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/verifications_public.sql
```

Bài kiểm tra xác nhận `students` và `verifications` ở `public`, vị trí chính xác vẫn ở `student_private`, khóa ngoại còn nguyên, RLS bật và các vai trò API không có quyền truy cập trực tiếp hồ sơ xác minh. Bài kiểm tra không sửa dữ liệu ứng dụng.

### Scripts

| Script | Command | When to use |
|---|---|---|
| `prisma:validate` | `npm run prisma:validate` | Check `schema.prisma` syntax before committing |
| `prisma:generate` | `npm run prisma:generate` | Regenerate TS client after any model change |
| `prisma:migrate` | `npm run prisma:migrate` | Create + apply a migration file in development |
| `db:push` | `npm run db:push` | Rapid prototype — pushes schema without a migration file (dev only) |
| `prisma:studio` | `npm run prisma:studio` | Open Prisma Studio GUI to browse data |
| `db:check` | `npm run db:check` | Verify the live Prisma connection |

---

### Workflow after changing `schema.prisma`

```bash
# 1. Validate the schema
npm run prisma:validate

# 2. Create a migration file and apply it (development)
npm run prisma:migrate
# When prompted, enter a descriptive name, e.g. "add_avatar_url_to_profiles"

# 3. Regenerate the TypeScript client
npm run prisma:generate

# 4. Rebuild
npm run build
```

A new file is written to `prisma/migrations/<timestamp>_<name>/migration.sql`. Commit this file together with the updated `schema.prisma`.

---

### Adding a column safely (Expand-and-Contract)

> [!WARNING]
> **Never rename or drop a column in a single deployment** — it breaks any running instance still reading the old name. Always use the four-phase pattern.

**Phase 1 — Add the column as nullable:**
```bash
npm run prisma:migrate
# migration.sql will contain:
# ALTER TABLE "profiles" ADD COLUMN "avatar_url" TEXT;
```

**Phase 2 — Dual-write in application code** (write both old and new fields), then backfill existing rows:
```typescript
// Backfill in chunks to avoid row locks
await prisma.$executeRaw`
  UPDATE profiles
  SET avatar_url = legacy_avatar_path
  WHERE avatar_url IS NULL AND legacy_avatar_path IS NOT NULL
  LIMIT 1000
`;
```

**Phase 3 — Switch reads** to the new column. Deploy and monitor.

**Phase 4 — Drop the old column** once no code references it:
```bash
# Remove old field from schema.prisma, then:
npm run prisma:migrate
# migration.sql will contain:
# ALTER TABLE "profiles" DROP COLUMN "legacy_avatar_path";
```

---

### Adding an index on a large table

Prisma does not use `CONCURRENTLY` by default. Write the index migration manually to avoid locking:

```sql
-- In supabase/migrations/<timestamp>_add_profiles_faculty_idx.sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS profiles_faculty_idx ON public.profiles (faculty);
```

Apply via the Supabase CLI:
```bash
supabase db push
```
