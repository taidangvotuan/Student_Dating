# Student_Dating
## Để bắt đầu code thì mọi người nhớ dùng 3 câu lệnh này để cài trước:
```
npm init -y
npm install --save-dev typescript tsx @types/node
```
## Rồi sau đó mọi người mở thư mục src rồi thêm file code của mình vào thư mục đó rồi push lên

## Kết nối Supabase PostgreSQL (phía server)

1. Chạy `npm install`, rồi sao chép `.env.example` thành `.env`.
2. Trong `.env`, điền `DB_PASSWORD` và thay `DB_SSL_ROOT_CERT` bằng đường dẫn tuyệt đối tới chứng chỉ CA tải từ Supabase Dashboard → Database settings. Nhập mật khẩu trực tiếp, không cần percent-encode; nếu có `#` hoặc khoảng trắng, đặt giá trị trong dấu nháy. Các mục host, port, tên DB và user có thể sửa riêng khi đổi cách kết nối.
3. Chạy `npm run db:check`. Lệnh này chỉ thử `SELECT 1` và không sửa dữ liệu.

Mẫu dùng **Session pooler** (IPv4) tại cổng 5432. Nếu máy chạy có IPv6 hoặc Supabase IPv4 add-on, có thể dùng **Direct** bằng cách đổi `DB_HOST` và `DB_USER` theo Supabase → Connect. Kết nối luôn xác minh TLS bằng chứng chỉ CA. Không đưa `.env` lên Git hoặc dùng thông tin kết nối PostgreSQL trong frontend. `src/database.ts` cung cấp pool cho backend; các lớp nghiệp vụ hiện tại chưa gọi DB và vẫn lưu dữ liệu trong bộ nhớ.
