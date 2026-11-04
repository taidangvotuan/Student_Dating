# Student Dating — Database Architecture & Schema

## 1. Overview & technology selection

- **Engine:** PostgreSQL managed by Supabase. The supplied host identifies the intended project; no credentials are stored here.
- **Authentication:** Supabase Auth (`auth.users`) owns email, password and email OTP. Do not add a second password or OTP table.
- **Query layer:** The backend uses the Prisma singleton in [`src/database/prisma.ts`](../../src/database/prisma.ts). The profile module reads and updates profiles, interests and search preferences through Prisma. See [`DATABASE-INSTRUCTION.md`](DATABASE-INSTRUCTION.md) for query examples and connection setup.
- **Migrations:** [`20261031000000_initial_student_dating.sql`](../../supabase/migrations/20261031000000_initial_student_dating.sql) defines the initial tables and access policies. [`20261102000000_auth_profile_triggers.sql`](../../supabase/migrations/20261102000000_auth_profile_triggers.sql) adds signup validation and provisioning triggers. [`20261105000000_move_verifications_to_public.sql`](../../supabase/migrations/20261105000000_move_verifications_to_public.sql) moves verification records to `public` to match Prisma and the signup trigger. Check the remaining schema differences below before applying migrations to an existing database.
- **Names:** plural `snake_case` tables/columns, UUID keys aligned with `auth.users.id`, `timestamptz` for instants.

The schema covers student verification, dating profiles, discovery preferences, interactions, matches and chat.

## 2. Entity-relationship diagram

```mermaid
erDiagram
    AUTH_USERS ||--|| STUDENTS : account
    STUDENTS ||--o| VERIFICATIONS : proves_identity
    STUDENTS ||--o| PROFILES : owns
    PROFILES ||--o| PROFILE_LOCATIONS : locates_privately
    PROFILES ||--o| SEARCH_PREFERENCES : filters
    PROFILES ||--o{ PROFILE_INTERESTS : has
    INTERESTS ||--o{ PROFILE_INTERESTS : selected
    PROFILES ||--o{ INTERACTIONS : initiates
    PROFILES ||--o{ BLOCKS : blocks
    PROFILES ||--o{ MATCHES : participates
    MATCHES ||--o| CONVERSATIONS : opens
    CONVERSATIONS ||--o{ MESSAGES : contains
    CONVERSATIONS ||--o{ CONVERSATION_READS : tracks

    STUDENTS {
        uuid id PK
        text account_status
    }
    VERIFICATIONS {
        uuid student_id PK, FK
        text student_number
        text card_storage_path
        text status
    }
    PROFILES {
        uuid student_id PK, FK
        text full_name
        date birth_date
        text visibility
    }
    PROFILE_LOCATIONS {
        uuid student_id PK, FK
        double latitude
        double longitude
    }
    INTERESTS {
        uuid id PK
        text name
    }
    PROFILE_INTERESTS {
        uuid student_id PK, FK
        uuid interest_id PK, FK
    }
    SEARCH_PREFERENCES {
        uuid student_id PK, FK
        smallint min_age
        smallint max_age
    }
    INTERACTIONS {
        uuid actor_id PK, FK
        uuid target_id PK, FK
        text kind
    }
    BLOCKS {
        uuid blocker_id PK, FK
        uuid blocked_id PK, FK
    }
    MATCHES {
        uuid id PK
        uuid student_a_id FK
        uuid student_b_id FK
        text status
    }
    CONVERSATIONS {
        uuid id PK
        uuid match_id FK, UK
    }
    MESSAGES {
        uuid id PK
        uuid conversation_id FK
        uuid sender_id FK
    }
    CONVERSATION_READS {
        uuid conversation_id PK, FK
        uuid student_id PK, FK
    }
```

`AUTH_USERS` is Supabase managed. After applying the migrations in order, `VERIFICATIONS` and `STUDENTS` are in `public`; only `PROFILE_LOCATIONS` remains in `student_private`. `STUDENTS` has been in `public` since the initial migration. A table's schema name does not grant client access: verification records remain restricted to the backend.

## 3. Physical schema and domain mapping

The SQL migrations define the physical DDL documented here. The current [`prisma/schema.prisma`](../../prisma/schema.prisma) maps the same application table and column names, but two differences need reconciliation:

- `Verification` and the signup trigger both target `public.verifications`; migration `20261105000000` brings the SQL layout into alignment. `ProfileLocation` still targets `public`, while SQL creates `student_private.profile_locations`; this remaining difference needs reconciliation separately.
- SQL status columns are `text` with `CHECK` constraints; Prisma declares native enum types. Do not assume that a Prisma enum is already present in the deployed database.

These are differences between repository files; the current live database layout has not been verified for this documentation update.

The original domain classes, now kept in `gg/`, map to tables as follows. The current profile API uses Prisma models instead of those in-memory classes.

| Code | Database | Note |
| --- | --- | --- |
| `StudentAccountManager` | `auth.users`, `students`, `profiles` | `email` stays in Auth; `fullName` is `profiles.full_name`. |
| `CampusVerification` | `auth.users`, `public.verifications` | Supabase Auth handles email OTP; card/CCCD path and review decision require backend access. |
| `SinhVien`, `HoSoHenHo` | `students`, `profiles`, `student_private.profile_locations` | Exact GPS coordinates are never exposed through the Data API. |
| `SoThich`, `TieuChiTimKiem` | `interests`, `profile_interests`, `search_preferences` | Many-to-many interests use an explicit join table. |
| `LuotThich`, `ChanNguoiDung` | `interactions`, `blocks` | One interaction per ordered pair; blocking is directional. |
| `KetNoi`, `CuocTroChuyen`, `TinNhan` | `matches`, `conversations`, `messages`, `conversation_reads` | One conversation per match; read state is per participant. |

`matches.student_a_id < student_b_id` stores each pair in one canonical order. A match is created by the trusted server only after two `THICH` interactions, with no block in either direction and both accounts eligible. Creating a block must cancel any active match/conversation for that pair in the same transaction. Chat sends must be checked by the server for active match, active conversation, sender membership and block state. These cross-table rules are **not** enforced by the DDL alone.

### 3.1. Table and column descriptions

Mô tả dưới đây gồm đủ 13 bảng ứng dụng sau khi áp dụng các migration theo thứ tự. Tên cột và kiểu dữ liệu lấy từ migration ban đầu; vị trí `verifications` được cập nhật theo migration `20261105000000`. `auth.users` do Supabase Auth quản lý riêng: các bảng ứng dụng tham chiếu `auth.users.id`, còn email và thông tin xác thực không được lưu lặp trong `profiles`.

Ký hiệu: **PK** = khóa chính, **FK** = khóa ngoại, **NULL: Có** = cột cho phép để trống. Khóa chính ghép được ghi dưới bảng tương ứng. Kiểu dữ liệu ở đây là kiểu PostgreSQL, không phải tên kiểu TypeScript/Prisma.

| Kiểu | Ý nghĩa |
| --- | --- |
| `uuid` | Mã định danh UUID. |
| `text` | Chuỗi văn bản; trạng thái được giới hạn bằng `CHECK` trong SQL. |
| `date` | Ngày, không chứa giờ. |
| `timestamptz` | Thời điểm có thông tin múi giờ. |
| `boolean` | Giá trị `true` hoặc `false`. |
| `smallint`, `integer` | Số nguyên. |
| `double precision` | Số thực, dùng cho tọa độ. |

#### public.students

Lưu trạng thái tài khoản sinh viên, liên kết một-một với tài khoản Supabase Auth.

| Cột | Kiểu PostgreSQL | NULL | Ý nghĩa / ràng buộc |
| --- | --- | --- | --- |
| `id` | `uuid` | Không | PK, FK → `auth.users.id`; dùng chung UUID với tài khoản Auth. |
| `account_status` | `text` | Không | `HOAT_DONG`, `TAM_KHOA`, `KHOA_VINH_VIEN`; mặc định `HOAT_DONG`. |
| `created_at` | `timestamptz` | Không | Thời điểm tạo; mặc định `now()`. |
| `updated_at` | `timestamptz` | Không | Lần cập nhật gần nhất; mặc định `now()`. |

#### public.verifications

Lưu hồ sơ xác minh sinh viên và kết quả xét duyệt. `card_storage_path` là đường dẫn đối tượng Storage, không phải nội dung ảnh hay URL công khai. Bảng nằm ở `public` để backend dùng Prisma và trigger đăng ký; `anon` và `authenticated` không được truy cập trực tiếp.

| Cột | Kiểu PostgreSQL | NULL | Ý nghĩa / ràng buộc |
| --- | --- | --- | --- |
| `student_id` | `uuid` | Không | PK, FK → `public.students.id`; mỗi sinh viên có tối đa một hồ sơ xác minh. |
| `student_number` | `text` | Có | Mã số sinh viên. |
| `university_name` | `text` | Có | Tên trường đại học. |
| `card_storage_path` | `text` | Có | Đường dẫn ảnh giấy tờ trong Storage riêng tư. |
| `status` | `text` | Không | `CHUA_XAC_THUC`, `CHO_DUYET`, `DA_XAC_THUC`, `TU_CHOI`; mặc định `CHUA_XAC_THUC`. |
| `reviewer_id` | `uuid` | Có | FK → `auth.users.id`; tài khoản người xét duyệt. |
| `rejection_reason` | `text` | Có | Lý do từ chối hồ sơ. |
| `submitted_at` | `timestamptz` | Có | Thời điểm nộp hồ sơ. |
| `reviewed_at` | `timestamptz` | Có | Thời điểm xét duyệt. |
| `created_at` | `timestamptz` | Không | Thời điểm tạo; mặc định `now()`. |
| `updated_at` | `timestamptz` | Không | Lần cập nhật gần nhất; mặc định `now()`. |

Cặp `(university_name, student_number)` là duy nhất khi cả hai có giá trị. Khi trạng thái khác `CHUA_XAC_THUC`, phải có mã sinh viên, tên trường, đường dẫn ảnh và thời điểm nộp. Trạng thái đã duyệt/từ chối cần người duyệt và thời điểm duyệt; `TU_CHOI` cần thêm lý do không rỗng.

#### public.profiles

Lưu hồ sơ hẹn hò của sinh viên: thông tin cá nhân hiển thị, giới thiệu, thông tin học tập và trạng thái hiển thị.

| Cột | Kiểu PostgreSQL | NULL | Ý nghĩa / ràng buộc |
| --- | --- | --- | --- |
| `student_id` | `uuid` | Không | PK, FK → `public.students.id`; mỗi sinh viên có tối đa một hồ sơ. |
| `full_name` | `text` | Không | Họ tên; không được rỗng hoặc chỉ có khoảng trắng. |
| `birth_date` | `date` | Không | Ngày sinh, dùng để tính tuổi. |
| `gender` | `text` | Có | Giới tính; SQL chưa giới hạn tập giá trị. |
| `bio` | `text` | Có | Giới thiệu bản thân, tối đa 2.000 ký tự. |
| `faculty` | `text` | Có | Khoa/ngành học. |
| `cohort` | `text` | Có | Khóa học. |
| `connection_goal` | `text` | Có | Mục tiêu kết nối/hẹn hò. |
| `visibility` | `text` | Không | `CON_HOAT_DONG`, `BI_AN`, `BI_KHOA`, `NGUNG_SU_DUNG`; mặc định `BI_AN`. |
| `created_at` | `timestamptz` | Không | Thời điểm tạo; mặc định `now()`. |
| `updated_at` | `timestamptz` | Không | Lần cập nhật gần nhất; mặc định `now()`. |

#### student_private.profile_locations

Lưu tọa độ chính xác gần nhất của hồ sơ để backend tính khoảng cách. Dữ liệu này nằm trong schema riêng tư theo migration ban đầu.

| Cột | Kiểu PostgreSQL | NULL | Ý nghĩa / ràng buộc |
| --- | --- | --- | --- |
| `student_id` | `uuid` | Không | PK, FK → `public.profiles.student_id`. |
| `latitude` | `double precision` | Không | Vĩ độ, từ -90 đến 90. |
| `longitude` | `double precision` | Không | Kinh độ, từ -180 đến 180. |
| `updated_at` | `timestamptz` | Không | Thời điểm cập nhật vị trí; mặc định `now()`. |

#### public.interests

Danh mục sở thích dùng chung để sinh viên lựa chọn cho hồ sơ.

| Cột | Kiểu PostgreSQL | NULL | Ý nghĩa / ràng buộc |
| --- | --- | --- | --- |
| `id` | `uuid` | Không | PK; mặc định sinh UUID bằng `gen_random_uuid()`. |
| `name` | `text` | Không | Tên sở thích; duy nhất và không rỗng. |
| `is_active` | `boolean` | Không | Sở thích còn được sử dụng trong danh mục; mặc định `true`. |
| `created_at` | `timestamptz` | Không | Thời điểm tạo; mặc định `now()`. |
| `updated_at` | `timestamptz` | Không | Lần cập nhật gần nhất; mặc định `now()`. |

#### public.profile_interests

Bảng nối nhiều-nhiều giữa hồ sơ và sở thích; mỗi dòng là một sở thích đã được sinh viên chọn.

| Cột | Kiểu PostgreSQL | NULL | Ý nghĩa / ràng buộc |
| --- | --- | --- | --- |
| `student_id` | `uuid` | Không | Thành phần PK, FK → `public.profiles.student_id`. |
| `interest_id` | `uuid` | Không | Thành phần PK, FK → `public.interests.id`. |
| `is_visible` | `boolean` | Không | Cho phép hiển thị sở thích này trên hồ sơ; mặc định `true`. |
| `created_at` | `timestamptz` | Không | Thời điểm chọn; mặc định `now()`. |

PK ghép `(student_id, interest_id)` ngăn một hồ sơ chọn trùng cùng sở thích.

#### public.search_preferences

Lưu bộ lọc tìm kiếm/đề xuất của từng hồ sơ: độ tuổi, giới tính, khoa, khoảng cách và yêu cầu xác minh.

| Cột | Kiểu PostgreSQL | NULL | Ý nghĩa / ràng buộc |
| --- | --- | --- | --- |
| `student_id` | `uuid` | Không | PK, FK → `public.profiles.student_id`. |
| `min_age` | `smallint` | Không | Tuổi tối thiểu, từ 18 đến 100; mặc định 18. |
| `max_age` | `smallint` | Không | Tuổi tối đa, từ 18 đến 100; mặc định 100. |
| `preferred_gender` | `text` | Có | Giới tính mong muốn. |
| `preferred_faculty` | `text` | Có | Khoa/ngành mong muốn. |
| `max_distance_km` | `integer` | Có | Khoảng cách tối đa tính bằng km, từ 1 đến 1.000. |
| `verified_only` | `boolean` | Không | Chỉ đề xuất hồ sơ đã xác minh; mặc định `true`. |
| `created_at` | `timestamptz` | Không | Thời điểm tạo; mặc định `now()`. |
| `updated_at` | `timestamptz` | Không | Lần cập nhật gần nhất; mặc định `now()`. |

SQL yêu cầu `min_age <= max_age`; backend áp dụng các bộ lọc này khi tìm hồ sơ.

#### public.interactions

Lưu lựa chọn thích hoặc bỏ qua từ một hồ sơ tới hồ sơ khác, có phân biệt chiều tương tác.

| Cột | Kiểu PostgreSQL | NULL | Ý nghĩa / ràng buộc |
| --- | --- | --- | --- |
| `actor_id` | `uuid` | Không | Thành phần PK, FK → `public.profiles.student_id`; người thực hiện. |
| `target_id` | `uuid` | Không | Thành phần PK, FK → `public.profiles.student_id`; người được tương tác. |
| `kind` | `text` | Không | `THICH` hoặc `BO_QUA`. |
| `created_at` | `timestamptz` | Không | Thời điểm tạo tương tác; mặc định `now()`. |

PK ghép `(actor_id, target_id)` giới hạn một dòng cho mỗi cặp có hướng; `actor_id` phải khác `target_id`.

#### public.blocks

Lưu danh sách chặn có hướng: một sinh viên chặn sinh viên khác.

| Cột | Kiểu PostgreSQL | NULL | Ý nghĩa / ràng buộc |
| --- | --- | --- | --- |
| `blocker_id` | `uuid` | Không | Thành phần PK, FK → `public.profiles.student_id`; người chặn. |
| `blocked_id` | `uuid` | Không | Thành phần PK, FK → `public.profiles.student_id`; người bị chặn. |
| `created_at` | `timestamptz` | Không | Thời điểm chặn; mặc định `now()`. |

PK ghép `(blocker_id, blocked_id)` ngăn chặn trùng; hai ID phải khác nhau.

#### public.matches

Lưu cặp hồ sơ đã ghép đôi và trạng thái kết nối giữa hai sinh viên.

| Cột | Kiểu PostgreSQL | NULL | Ý nghĩa / ràng buộc |
| --- | --- | --- | --- |
| `id` | `uuid` | Không | PK; mặc định `gen_random_uuid()`. |
| `student_a_id` | `uuid` | Không | FK → `public.profiles.student_id`; UUID nhỏ hơn trong cặp. |
| `student_b_id` | `uuid` | Không | FK → `public.profiles.student_id`; UUID lớn hơn trong cặp. |
| `status` | `text` | Không | `DA_GHEP_DOI`, `DANG_HOAT_DONG`, `DA_HUY`; mặc định `DA_GHEP_DOI`. |
| `created_at` | `timestamptz` | Không | Thời điểm ghép đôi; mặc định `now()`. |
| `updated_at` | `timestamptz` | Không | Lần cập nhật gần nhất; mặc định `now()`. |

Cặp `(student_a_id, student_b_id)` là duy nhất, với `student_a_id < student_b_id`, nên không lưu trùng cặp theo chiều ngược lại.

#### public.conversations

Lưu cuộc trò chuyện của một cặp đã ghép đôi; mỗi match có tối đa một cuộc trò chuyện.

| Cột | Kiểu PostgreSQL | NULL | Ý nghĩa / ràng buộc |
| --- | --- | --- | --- |
| `id` | `uuid` | Không | PK; mặc định `gen_random_uuid()`. |
| `match_id` | `uuid` | Không | FK → `public.matches.id`; duy nhất. |
| `status` | `text` | Không | `HOAT_DONG` hoặc `KHONG_HOAT_DONG`; mặc định `HOAT_DONG`. |
| `created_at` | `timestamptz` | Không | Thời điểm tạo; mặc định `now()`. |
| `updated_at` | `timestamptz` | Không | Lần cập nhật gần nhất; mặc định `now()`. |

#### public.messages

Lưu tin nhắn trong cuộc trò chuyện, người gửi và trạng thái xóa mềm.

| Cột | Kiểu PostgreSQL | NULL | Ý nghĩa / ràng buộc |
| --- | --- | --- | --- |
| `id` | `uuid` | Không | PK; mặc định `gen_random_uuid()`. |
| `conversation_id` | `uuid` | Không | FK → `public.conversations.id`; cuộc trò chuyện chứa tin nhắn. |
| `sender_id` | `uuid` | Không | FK → `public.profiles.student_id`; người gửi. |
| `body` | `text` | Có | Nội dung; phải có khi `DA_GUI`, phải là `NULL` khi `DA_XOA`. |
| `status` | `text` | Không | `DA_GUI` hoặc `DA_XOA`; mặc định `DA_GUI`. |
| `sent_at` | `timestamptz` | Không | Thời điểm gửi; mặc định `now()`. |
| `deleted_at` | `timestamptz` | Có | Thời điểm xóa mềm. |

Tin `DA_GUI` phải có nội dung không rỗng, tối đa 5.000 ký tự và chưa có `deleted_at`. Tin `DA_XOA` phải xóa nội dung về `NULL` và có `deleted_at`.

#### public.conversation_reads

Lưu mốc đọc gần nhất của từng sinh viên trong từng cuộc trò chuyện để tính tin chưa đọc.

| Cột | Kiểu PostgreSQL | NULL | Ý nghĩa / ràng buộc |
| --- | --- | --- | --- |
| `conversation_id` | `uuid` | Không | Thành phần PK, FK → `public.conversations.id`. |
| `student_id` | `uuid` | Không | Thành phần PK, FK → `public.profiles.student_id`; người đọc. |
| `last_read_at` | `timestamptz` | Không | Mốc đọc gần nhất; mặc định `now()`. |

PK ghép `(conversation_id, student_id)` giữ một mốc đọc cho mỗi người trong một cuộc trò chuyện. Backend phải kiểm tra người đọc là thành viên của cuộc trò chuyện.

## 4. Security and access

- Every application table has RLS enabled. `student_private.profile_locations` remains inaccessible to API roles. Migration `20261105000000` preserves RLS on `public.verifications` and revokes all table privileges from `PUBLIC`, `anon` and `authenticated`; moving the table does not expose verification documents or review details through the Data API.
- A signed-in user can read their own account, profile, preferences, interactions and blocks; matched users can read each other's visible profile and chat history. `anon` has no table grants.
- Clients can edit their own profile, interest selections and search preferences. They cannot write verification decisions, interactions, blocks, matches or chat records directly. The trusted backend must implement these commands, verify the caller, and use a privileged PostgreSQL connection for `student_private` data.
- `students.account_status` and `profiles.visibility` are distinct. Only the backend may lock an account or set `BI_KHOA`/`NGUNG_SU_DUNG`.
- Profile discovery is a backend query because unmatched profiles are not readable through the Data API. That backend must filter verification status, age, visibility, blocks, prior interactions and location criteria. Do not expose exact coordinates or card image URLs.
- Store card/CCCD files in a private Supabase Storage bucket with separate Storage policies; the database keeps only an object path. The migration does not create that bucket.

## 5. Indexing and migration strategy

Foreign keys not covered by a leading primary/unique key have indexes. `matches` has partial indexes for active pair lookups; `messages` has a conversation/time index for chronological paging. Check query plans after real data exists before adding more indexes.

This is an initial schema: no rollback script or data backfill is included because the repository has no prior database schema. If this project already has tables or users, review and adapt the migration before applying it. Future breaking changes should use the repository's expand/backfill/switch/contract workflow.

Migration `20261105000000` uses `ALTER TABLE ... SET SCHEMA` in a transaction, retaining verification rows, indexes and constraints. It also accepts an already-moved table. If both schemas contain a `verifications` table, or neither does, it stops without merging or dropping data. Inspect and reconcile duplicate tables before retrying. The migration has been checked locally; it has not been applied to the live Supabase project as part of this review fix.

**Deployment record (2026-10-31):** Applied migration `20261031000000` to Supabase project `qsnwyxjqrpskochuvtod` with Supabase CLI 2.122.0. A read-only check afterward found 13 application tables, RLS enabled on all 13, 19 policies and a matching migration-history entry. The private schema was inaccessible to `anon` and `authenticated` in the privilege check.

## 6. Integration work still required

The profile API now persists data through Prisma, and signup provisioning is implemented in the auth trigger migration. Apply the verification schema migration and reconcile the remaining `ProfileLocation` schema and status-type differences listed in section 3 before relying on them together. Matching, blocking and chat commands must enforce the authorization and transaction rules described above; private Storage policies and integration tests for RLS using two distinct user identities are also required. Prisma's `@updatedAt` updates timestamps for Prisma writes; raw SQL writes must set `updated_at` explicitly because the SQL migrations do not define an automatic timestamp trigger.
