# Student Dating — React MVP

Bản demo React + TypeScript + Vite chạy độc lập, dành cho sinh viên **từ 18 tuổi**. Không cần backend, Supabase, Redis hoặc `.env`.

## Chạy local

Yêu cầu Node.js **22.12+** (đã kiểm tra với 24.18.0) và npm. Trong PowerShell:

```powershell
cd "C:\Users\XUAN VI\Student_Dating\frontend"
npm.cmd ci
npm.cmd run dev
```

Mở **http://127.0.0.1:5173**. Dùng `npm.cmd` để tránh chính sách chặn `npm.ps1` của Windows; macOS/Linux dùng `npm` thông thường. Nếu cổng bận, chạy `npm.cmd run dev -- --port 5174`.

Nhánh bàn giao: `mvp/student-dating`. Các nhánh chức năng và commit tiếng Anh giữ riêng; xem [IMPLEMENTATION.md](IMPLEMENTATION.md). `main` chưa bị sửa hoặc merge tự động.

## Luồng demo

1. Bấm **Trải nghiệm demo** để vào vai **Nguyễn Nhật Minh**.
2. Mở **Xem hồ sơ** của **Trần Khánh Linh** rồi đóng.
3. **Thích** Linh: chỉ chuyển sang **Lê Hoài An**, chưa ghép đôi.
4. **Thích** An: hai bên đã thích nhau, xuất hiện hộp thoại ghép đôi.
5. Chọn **Bắt đầu trò chuyện**, soạn tin và gửi bằng nút gửi hoặc Enter (Shift+Enter xuống dòng).
6. Mở **Thông báo**: thông báo ghép đôi dẫn về đúng hội thoại An, đánh dấu đã đọc và giảm badge. Đọc tin nhắn và đọc thông báo là hai trạng thái riêng.
7. Mở **Hồ sơ**, sửa giới thiệu/sở thích/ảnh mẫu/tiêu chí và **Lưu hồ sơ**. Tải lại để kiểm tra dữ liệu được giữ.
8. Tiếp tục khám phá: Nam chưa thích bạn; Mai đã thích bạn. Có thể tạo hai ghép đôi để thử deep link độc lập.

**Đặt lại demo** có xác nhận và khôi phục toàn bộ dữ liệu mẫu. Chặn cũng cần xác nhận; **Hủy, giữ hồ sơ** hoặc Escape giữ nguyên hồ sơ.

## Màn hình

- Đăng nhập/đăng ký demo: email `.edu.vn`, mật khẩu tối thiểu 8 ký tự, họ tên, ngày sinh đủ 18; giới tính/khoa/khóa tùy chọn theo API. Lỗi tại trường. Đăng ký dẫn tới thiết lập hồ sơ.
- Hồ sơ: ảnh mẫu, thông tin cơ bản, giới thiệu, sở thích, mục tiêu, tiêu chí tìm kiếm, tiến độ và phản hồi lưu.
- Khám phá: xem chi tiết, thích, bỏ qua, xác nhận chặn; lọc tuổi/giới tính/khoa/xác thực; trạng thái hết gợi ý.
- Ghép đôi: mở chat hoặc tiếp tục khám phá.
- Chat: danh sách, tin gần nhất, thời gian, số chưa đọc, tìm tên, gửi tin. Desktop hai cột; mobile danh sách/chi tiết có nút quay lại. Có trạng thái rỗng và hội thoại không tồn tại.
- Thông báo: đã/chưa đọc, lọc, đọc tất cả, ẩn từng mục và rỗng; dẫn đúng hội thoại.

## Những phần đang mô phỏng

**Toàn bộ MVP là demo, không có lời gọi backend thật.** Form đăng nhập chỉ kiểm tra định dạng rồi mở demo, không xác thực hay tạo tài khoản thật. Không dùng mật khẩu thật. Chưa có OTP, upload ảnh, vị trí thật, presence, chat tự trả lời hoặc xác minh sinh viên thật. Tin chào đầu hội thoại là dữ liệu mẫu.

- `src/mocks/data.ts`: các nhân vật hư cấu, sở thích và lượt thích có sẵn.
- `src/services/`: kiểu dữ liệu, validation, discovery/matching, chat và storage; thay lớp adapter này khi nối API.
- `src/app/`: context demo và router bảo vệ các màn hình.
- `src/components/`: nút, trường nhập, modal native (focus trap/Escape), navigation, thẻ hồ sơ.
- `src/pages/`: các màn hình theo module của scaffold hiện có.

localStorage chỉ lưu record `student-dating:demo:v1`: hồ sơ demo, tương tác, tin nhắn, phiên demo và thông báo. Zod loại trường ngoài schema, bao gồm mật khẩu. Không lưu password/token. Dữ liệu hỏng/khác phiên bản được khởi tạo lại; storage bị chặn có thông báo và chỉ giữ tiến độ trong phiên. Chưa đồng bộ nhiều tab.

## Hướng tích hợp backend

| Chức năng | Hợp đồng |
| --- | --- |
| Đăng nhập/đăng ký | Supabase Auth client; metadata `fullname`, `birthday`, `gender`, `faculty`, `cohort` |
| Hồ sơ | `GET/PATCH /api/profile`, `PUT /api/profile/interests`, `PUT /api/profile/preferences` |
| Tiêu chí | `GET/PUT /api/discovery/criteria` |
| Tương tác | `POST /api/interactions/:targetId/like`, `/skip`, `/block` |
| Chat | `GET /api/chat`, `GET/POST /api/chat/:conversationId/messages`, `PUT /api/chat/:conversationId/read` |
| Thông báo | API Notification với các khóa `matchId`, `conversationId`, `actorId` theo tài liệu |

Ghép đôi thật là bất đồng bộ: chờ `matching.match.created` rồi tải lại REST, không suy ra match từ response like. Gửi tin qua REST; Socket.IO chỉ nhận sự kiện, tải lại REST sau reconnect. Backend phải kiểm tra quyền thành viên, block và trạng thái match. MVP áp dụng tuổi tối thiểu 18, chặt hơn một số schema backend.

Đã tham khảo [architecture](../docs/architecture.md), [API](../docs/API.md), [database](../docs/database/DATABASE-SCHEMA.md), [realtime](../docs/realtime-socket-events.md). `.env.example` dành cho bước tích hợp sau; chưa có code đọc các biến này. Không đưa service-role key hoặc credentials DB vào frontend.

## Kiểm tra

```powershell
npm.cmd run build
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run test:e2e
```

Playwright tự chạy Vite ở cổng 5173, mặc định dùng Microsoft Edge trên Windows. Trên hệ khác dùng Chromium (`npx playwright install chromium`). Có thể chọn qua `PLAYWRIGHT_CHANNEL`; PowerShell: `$env:PLAYWRIGHT_CHANNEL = 'msedge'`.

Kiểm thử tại **390 × 844** và **1440 × 1000**: luồng xuyên suốt, persistence, hủy chặn/focus/Escape, bộ lọc, trạng thái rỗng, tuổi đăng ký, loại mật khẩu khỏi storage và nhiều deep link. Axe kiểm tra tự động các màn hình chính, không thay thế kiểm thử thủ công với screen reader. Báo cáo HTML ở `playwright-report/`, ảnh/trace ở `test-results/` (không commit). Kết quả thực tế: [VALIDATION.md](VALIDATION.md).

## Thiết kế và tài nguyên

Figma MCP bị chặn bởi hạn mức Starter. Giao diện dùng hướng dự phòng được yêu cầu: `#176B5B`, `#E3F1E8`, nền sáng, thẻ bo góc, Inter tiếng Việt. Chưa đối chiếu pixel với Figma. Font Inter đóng gói bằng `@fontsource/inter` (OFL); font và ảnh phục vụ local.

Ảnh minh họa từ Unsplash nằm trong `public/images/`, không đại diện cho nhân vật hay trường thật. Các nguồn tải:

- Linh: `https://images.unsplash.com/photo-1534528741775-53994a69daeb`
- An: `https://images.unsplash.com/photo-1524504388940-b1c1722653e1`
- Minh: `https://images.unsplash.com/photo-1506794778202-cad84cf45f1d`
- Nam: `https://images.unsplash.com/photo-1500648767791-00dcc994a43e`
- Mai: `https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43`

Tham khảo [Unsplash License](https://unsplash.com/license).
