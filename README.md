# Student_Dating
## Để bắt đầu code thì mọi người nhớ dùng 3 câu lệnh này để cài trước:
```
npm init -y
npm install --save-dev typescript tsx @types/node
```
## Rồi sau đó mọi người mở thư mục src rồi thêm file code của mình vào thư mục đó rồi push lên

## Kết nối Supabase PostgreSQL (phía server)

1. Chạy `npm install`, rồi sao chép `.env.example` thành `.env`.
2. Trong `.env`, thay `YOUR_PERCENT_ENCODED_PASSWORD` bằng mật khẩu database đã mã hóa URL nếu có ký tự đặc biệt. Thay `sslrootcert` bằng đường dẫn tuyệt đối tới chứng chỉ CA tải từ Supabase Dashboard → Database settings.
3. Chạy `npm run db:check`. Lệnh này chỉ thử `SELECT 1` và không sửa dữ liệu.

Mẫu dùng **Session pooler** (IPv4) tại cổng 5432. Nếu máy chạy có IPv6 hoặc Supabase IPv4 add-on, có thể thay bằng URL **Direct** từ Supabase → Connect, giữ `sslmode=verify-full` và `sslrootcert`. Không đưa `.env` lên Git hoặc dùng chuỗi kết nối PostgreSQL trong frontend. `src/database.ts` cung cấp pool cho backend; các lớp nghiệp vụ hiện tại chưa gọi DB và vẫn lưu dữ liệu trong bộ nhớ.
