# Kết quả kiểm tra MVP

Ngày kiểm tra: **14/11/2026**. Môi trường: Windows, Node.js 24.18.0, npm 11.16.0.

| Kiểm tra | Kết quả |
| --- | --- |
| `npm.cmd run build` | Đạt: TypeScript + Vite, tạo `dist/` |
| `npm.cmd run typecheck` | Đạt |
| `npm.cmd run lint` | Đạt, không có lỗi/cảnh báo ESLint |
| `npm.cmd run format:check` | Đạt |
| `npm.cmd test` | 13/13 kiểm tra logic đạt, 4 tệp |
| `npm.cmd run test:e2e` | 10/10 kịch bản đạt trên Microsoft Edge/Chromium engine |
| `git diff --check` | Đạt; Git báo chuyển LF/CRLF theo cấu hình Windows |
| `npm.cmd audit --omit=dev` | Không có lỗ hổng dependency runtime được báo |

## Trình duyệt và tiêu chí nghiệm thu

Đã mở và thao tác bằng Playwright trong trình duyệt thực ở cả **390 × 844** và **1440 × 1000**, mỗi kích thước chạy 5 kịch bản:

1. Trải nghiệm demo → Khám phá → Xem hồ sơ → thích Linh chưa ghép đôi → thích An tạo ghép đôi → mở chat → gửi tin → reload giữ tin → mở thông báo chưa đọc → đúng hội thoại → badge giảm và thông báo đã đọc → sửa/lưu hồ sơ → reload giữ giới thiệu và sở thích. Mobile kiểm tra thêm quay về danh sách rồi mở lại hội thoại.
2. Hủy xác nhận chặn bằng nút và Escape; focus trả về nút kích hoạt, hồ sơ không đổi. Thử bộ lọc tuổi không hợp lệ và bộ lọc không có kết quả; khôi phục mặc định; xác nhận chặn rồi reload, hồ sơ bị loại.
3. Chat rỗng, thông báo rỗng, tiếp tục khám phá khi ghép đôi, đánh dấu tất cả đã đọc, lọc chưa đọc và ẩn thông báo cuối cùng.
4. Đăng ký: thiếu dữ liệu, email sinh viên, từ chối dưới 18 tuổi, chấp nhận ngày nhuận hợp lệ, dẫn đúng trang thiết lập hồ sơ. Kiểm tra localStorage không chứa mật khẩu hoặc giá trị mật khẩu đã nhập.
5. Tạo hai ghép đôi An/Mai; mở từng thông báo dẫn đúng hội thoại, giữ trạng thái chưa đọc độc lập.

Axe chạy với các nhóm WCAG 2 A/AA và 2.1 AA trên đăng nhập, khám phá, chat, thông báo và hồ sơ ở cả hai viewport, cộng hồ sơ sau đăng ký: **không có vi phạm tự động được báo**. Không có tràn ngang, ảnh lỗi, page error hoặc console error trong kịch bản xuyên suốt. Đã xem ảnh chụp desktop/mobile, điều chỉnh độ tương phản của chữ phụ và sửa lỗi điều hướng sau đăng ký phát hiện trong lần chạy đầu.

Ảnh chụp: `test-results/mvp-full-demo-acceptance-accessibility-and-persistence-{desktop,mobile}/` gồm `login.png`, `discovery.png`, `match.png`, `chat.png`, `notifications.png`, `profile.png`. Báo cáo HTML ở `playwright-report/index.html`. Các tệp sinh ra được bỏ qua bởi Git, tái tạo bằng `npm.cmd run test:e2e`.

## Giới hạn và phần chưa kiểm chứng

- Figma MCP trả lỗi vượt hạn mức Starter; chưa so khớp trực tiếp các frame/prototype. Đã dùng palette và phong cách dự phòng trong yêu cầu.
- Chromium tải từ Playwright không khởi chạy được trên máy này (`spawn UNKNOWN`); đổi sang Microsoft Edge có sẵn và chạy thành công toàn bộ kịch bản. Config mặc định dùng Edge trên Windows, cho phép thay qua `PLAYWRIGHT_CHANNEL`.
- Chưa kiểm tra Firefox, Safari, thiết bị di động vật lý, bàn phím ảo hoặc screen reader thủ công. Kiểm tra accessibility tự động không phải chứng nhận WCAG đầy đủ.
- Toàn bộ xác thực, xác minh, hồ sơ, khoảng cách, like/match, chat và thông báo là **mô phỏng**. Chưa kiểm thử Supabase/REST/Socket.IO hay luồng nhiều người dùng; backend không bị thay đổi và không chạy suite backend.
- Bảo vệ dữ liệu hỏng, bỏ trường mật khẩu và storage bị từ chối có kiểm tra logic trong `storage.test.ts`; chưa có kịch bản trình duyệt riêng cho storage bị chặn.
- `npm audit` đầy đủ báo **7 mục mức moderate** trong nhánh dev dependency `typescript-eslint`/`minimatch` (GHSA-g3hv-75wg-m249); runtime audit sạch. Không dùng `audit fix --force` hoặc override phiên bản major ngoài hợp đồng của thư viện. Cần rà lại công cụ lint khi upstream cập nhật.
- Hai tab không đồng bộ trực tiếp; dùng một tab để thử demo. Chưa có API upload ảnh, gửi file, trạng thái online/đang nhập, tự trả lời hay push notification.
