import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  CampusVerification,
  CardVerificationStatus,
} from '../src/CampusVerification.js';

describe('CampusVerification - Xác minh tư cách sinh viên', () => {
  const userId = 'user_24520477';

  describe('Khởi tạo đối tượng', () => {
    it('Khởi tạo thành công với userId hợp lệ', () => {
      const cv = new CampusVerification(userId);
      assert.strictEqual(cv.getUserId(), userId);
      assert.strictEqual(cv.isVerified(), false);
      assert.strictEqual(cv.isEmailVerifiedStatus(), false);
      assert.strictEqual(cv.getCardStatus(), CardVerificationStatus.NOT_SUBMITTED);
    });

    it('Ném lỗi nếu userId rỗng hoặc không hợp lệ', () => {
      assert.throws(() => new CampusVerification(''), /UserId không được để trống/);
      assert.throws(() => new CampusVerification('   '), /UserId không được để trống/);
    });
  });

  describe('verifySchoolEmail() - Xác thực email trường (.edu.vn) & OTP (UC-01)', () => {
    it('Từ chối các email không phải tên miền .edu.vn', () => {
      const cv = new CampusVerification(userId);
      const invalidEmails = [
        'student@gmail.com',
        'user@yahoo.com',
        'test@uit.edu',
        'invalid-email-format',
      ];

      for (const email of invalidEmails) {
        assert.strictEqual(cv.isValidSchoolEmail(email), false);
        const sendResult = cv.generateAndSendEmailOtp(email);
        assert.strictEqual(sendResult.success, false);
      }
    });

    it('Chấp nhận các email sinh viên có đuôi .edu.vn hợp lệ', () => {
      const cv = new CampusVerification(userId);
      const validEmails = [
        '24520477@gm.uit.edu.vn',
        'thaibinh@hcmus.edu.vn',
        'student@vnuhcm.edu.vn',
      ];

      for (const email of validEmails) {
        assert.strictEqual(cv.isValidSchoolEmail(email), true);
      }
    });

    it('Yêu cầu OTP trước khi gọi verifySchoolEmail', () => {
      const cv = new CampusVerification(userId);
      const result = cv.verifySchoolEmail('24520477@gm.uit.edu.vn', '123456');
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.statusCode, 'INVALID_OTP');
    });

    it('Xác thực thất bại khi nhập sai OTP và đếm số lần thử', () => {
      const cv = new CampusVerification(userId);
      const email = '24520477@gm.uit.edu.vn';
      cv.generateAndSendEmailOtp(email);

      const res = cv.verifySchoolEmail(email, '000000');
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.statusCode, 'INVALID_OTP');
      assert.strictEqual(cv.isEmailVerifiedStatus(), false);
    });

    it('Xác thực thành công khi nhập đúng OTP', () => {
      const cv = new CampusVerification(userId);
      const email = '24520477@gm.uit.edu.vn';
      const sendRes = cv.generateAndSendEmailOtp(email);
      assert.strictEqual(sendRes.success, true);
      assert.ok(sendRes.otp);

      const verifyRes = cv.verifySchoolEmail(email, sendRes.otp!);
      assert.strictEqual(verifyRes.success, true);
      assert.strictEqual(verifyRes.statusCode, 'SUCCESS');
      assert.strictEqual(cv.isEmailVerifiedStatus(), true);
      assert.strictEqual(cv.getEmail(), email.toLowerCase());
    });
  });

  describe('verifyStudentCard() - Xác thực thẻ sinh viên / CCCD (UC-02)', () => {
    it('Không cho phép nộp thẻ sinh viên nếu chưa xác minh email', () => {
      const cv = new CampusVerification(userId);
      const submitRes = cv.submitStudentCard({
        cardImageUrl: 'https://storage.dating.edu.vn/cards/24520477.jpg',
        studentId: '24520477',
        universityName: 'Trường Đại học Công nghệ Thông tin - ĐHQG-HCM',
      });

      assert.strictEqual(submitRes.success, false);
      assert.strictEqual(submitRes.statusCode, 'MISSING_DATA');
    });

    it('Nộp thẻ SV thành công sau khi xác minh email và chuyển trạng thái sang PENDING', () => {
      const cv = new CampusVerification(userId);
      const email = '24520477@gm.uit.edu.vn';
      const sendRes = cv.generateAndSendEmailOtp(email);
      cv.verifySchoolEmail(email, sendRes.otp!);

      const submitRes = cv.submitStudentCard({
        cardImageUrl: 'https://storage.dating.edu.vn/cards/24520477.jpg',
        studentId: '24520477',
        universityName: 'Trường Đại học Công nghệ Thông tin - ĐHQG-HCM',
        faculty: 'Khoa Kỹ thuật Phần mềm',
      });

      assert.strictEqual(submitRes.success, true);
      assert.strictEqual(cv.getCardStatus(), CardVerificationStatus.PENDING);
      assert.strictEqual(cv.getCardInfo()?.studentId, '24520477');
    });

    it('Từ chối thẻ nếu Kiểm duyệt viên từ chối kèm lý do', () => {
      const cv = new CampusVerification(userId);
      const email = '24520477@gm.uit.edu.vn';
      const sendRes = cv.generateAndSendEmailOtp(email);
      cv.verifySchoolEmail(email, sendRes.otp!);

      cv.submitStudentCard({
        cardImageUrl: 'https://storage.dating.edu.vn/cards/24520477.jpg',
        studentId: '24520477',
        universityName: 'UIT',
      });

      // Kiểm duyệt viên từ chối duyệt vì ảnh bị mờ
      const reviewRes = cv.verifyStudentCard('mod_01', false, 'Hình ảnh mờ, không rõ mã sinh viên');
      assert.strictEqual(reviewRes.success, false);
      assert.strictEqual(reviewRes.statusCode, 'REJECTED');
      assert.strictEqual(cv.getCardStatus(), CardVerificationStatus.REJECTED);
      assert.strictEqual(cv.getReviewDecision()?.rejectionReason, 'Hình ảnh mờ, không rõ mã sinh viên');
      assert.strictEqual(cv.isVerified(), false);
    });

    it('Phê duyệt thẻ sinh viên thành công', () => {
      const cv = new CampusVerification(userId);
      const email = '24520477@gm.uit.edu.vn';
      const sendRes = cv.generateAndSendEmailOtp(email);
      cv.verifySchoolEmail(email, sendRes.otp!);

      cv.submitStudentCard({
        cardImageUrl: 'https://storage.dating.edu.vn/cards/24520477.jpg',
        studentId: '24520477',
        universityName: 'Trường Đại học Công nghệ Thông tin - ĐHQG-HCM',
      });

      const reviewRes = cv.verifyStudentCard('mod_01', true);
      assert.strictEqual(reviewRes.success, true);
      assert.strictEqual(reviewRes.statusCode, 'SUCCESS');
      assert.strictEqual(cv.getCardStatus(), CardVerificationStatus.APPROVED);
    });
  });

  describe('isVerified() - Kiểm tra tư cách sinh viên hoàn tất', () => {
    it('Trả về false khi mới đăng ký tài khoản (chưa làm gì)', () => {
      const cv = new CampusVerification(userId);
      assert.strictEqual(cv.isVerified(), false);
    });

    it('Trả về false khi chỉ mới xác thực email trường', () => {
      const cv = new CampusVerification(userId);
      const email = '24520477@gm.uit.edu.vn';
      const sendRes = cv.generateAndSendEmailOtp(email);
      cv.verifySchoolEmail(email, sendRes.otp!);

      assert.strictEqual(cv.isEmailVerifiedStatus(), true);
      assert.strictEqual(cv.isVerified(), false);
    });

    it('Trả về false khi thẻ sinh viên đang chờ duyệt (PENDING)', () => {
      const cv = new CampusVerification(userId);
      const email = '24520477@gm.uit.edu.vn';
      const sendRes = cv.generateAndSendEmailOtp(email);
      cv.verifySchoolEmail(email, sendRes.otp!);

      cv.submitStudentCard({
        cardImageUrl: 'https://storage.dating.edu.vn/cards/24520477.jpg',
        studentId: '24520477',
        universityName: 'UIT',
      });

      assert.strictEqual(cv.isVerified(), false);
    });

    it('Trả về true khi cả email và thẻ sinh viên đều đã được phê duyệt', () => {
      const cv = new CampusVerification(userId);
      const email = '24520477@gm.uit.edu.vn';
      const sendRes = cv.generateAndSendEmailOtp(email);
      cv.verifySchoolEmail(email, sendRes.otp!);

      cv.submitStudentCard({
        cardImageUrl: 'https://storage.dating.edu.vn/cards/24520477.jpg',
        studentId: '24520477',
        universityName: 'Trường Đại học Công nghệ Thông tin - ĐHQG-HCM',
      });

      cv.verifyStudentCard('mod_01', true);

      // Bây giờ cả 2 điều kiện đều thỏa mãn
      assert.strictEqual(cv.isVerified(), true);

      const profile = cv.getProfile();
      assert.strictEqual(profile.isFullyVerified, true);
      assert.strictEqual(profile.cardStatus, CardVerificationStatus.APPROVED);
    });
  });
});
