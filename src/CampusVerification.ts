/**
 * @file CampusVerification.ts
 * @description Lớp xác minh tư cách sinh viên (Campus Verification)
 * Phục vụ cho:
 * - UC-01: Đăng ký tài khoản (Xác thực Email sinh viên .edu.vn, gửi & kiểm tra OTP)
 * - UC-02: Xác thực sinh viên (Tải thẻ sinh viên/CCCD, kiểm duyệt viên phê duyệt/từ chối)
 * @author Nhóm phát triển ứng dụng Hẹn hò sinh viên (UIT - VNUHCM)
 */

/**
 * Trạng thái xác thực thẻ sinh viên của người dùng
 */
export enum CardVerificationStatus {
  NOT_SUBMITTED = 'NOT_SUBMITTED', // Chưa nộp thẻ sinh viên
  PENDING = 'PENDING',             // Đã nộp, đang chờ kiểm duyệt viên phê duyệt
  APPROVED = 'APPROVED',           // Đã được duyệt thành công
  REJECTED = 'REJECTED',           // Bị từ chối duyệt (ảnh mờ, sai thông tin,...)
}

/**
 * Thông tin thẻ sinh viên tải lên để xác minh
 */
export interface StudentCardInfo {
  cardImageUrl: string;       // URL hình ảnh thẻ SV / CCCD
  studentId: string;          // Mã số sinh viên (MSSV)
  universityName: string;     // Tên trường đại học
  faculty?: string;           // Khoa / Ngành học
  submittedAt: Date;          // Thời gian tải lên
}

/**
 * Kết quả quyết định kiểm duyệt thẻ sinh viên từ Kiểm duyệt viên
 */
export interface CardReviewDecision {
  reviewerId: string;         // Mã định danh của Kiểm duyệt viên thực hiện duyệt
  isApproved: boolean;        // true: Phê duyệt, false: Từ chối
  rejectionReason?: string;   // Lý do từ chối (bắt buộc nếu isApproved = false)
  reviewedAt: Date;           // Thời điểm kiểm duyệt
}

/**
 * Kết quả trả về của các thao tác xác minh
 */
export interface VerificationResult {
  success: boolean;
  message: string;
  statusCode: 'SUCCESS' | 'INVALID_EMAIL' | 'INVALID_OTP' | 'OTP_EXPIRED' | 'MISSING_DATA' | 'REJECTED' | 'SYSTEM_ERROR';
}

/**
 * Thông tin chi tiết trạng thái xác minh tổng thể của sinh viên
 */
export interface CampusVerificationProfile {
  userId: string;
  email: string | null;
  isEmailVerified: boolean;
  emailVerifiedAt: Date | null;
  cardInfo: StudentCardInfo | null;
  cardStatus: CardVerificationStatus;
  reviewDecision: CardReviewDecision | null;
  isFullyVerified: boolean;
}

/**
 * Lớp CampusVerification - Quản lý và xử lý toàn bộ quy trình xác minh tư cách sinh viên
 */
export class CampusVerification {
  private readonly userId: string;
  private email: string | null = null;
  private isEmailVerified: boolean = false;
  private emailVerifiedAt: Date | null = null;

  // Quản lý OTP xác thực email
  private currentOtp: string | null = null;
  private otpExpiresAt: Date | null = null;
  private otpAttempts: number = 0;
  private readonly MAX_OTP_ATTEMPTS = 5;
  private readonly OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 phút hiệu lực

  // Quản lý hồ sơ thẻ sinh viên
  private cardInfo: StudentCardInfo | null = null;
  private cardStatus: CardVerificationStatus = CardVerificationStatus.NOT_SUBMITTED;
  private reviewDecision: CardReviewDecision | null = null;

  /**
   * Khởi tạo đối tượng xác thực cho một sinh viên cụ thể
   * @param userId Mã sinh viên / Mã tài khoản người dùng
   */
  constructor(userId: string) {
    if (!userId || userId.trim() === '') {
      throw new Error('UserId không được để trống.');
    }
    this.userId = userId.trim();
  }

  // =========================================================================
  // 1. NHÓM PHƯƠNG THỨC XÁC THỰC EMAIL TRƯỜNG (verifySchoolEmail)
  // =========================================================================

  /**
   * Kiểm tra định dạng email xem có phải email trường hợp lệ hay không (phải kết thúc bằng .edu.vn)
   * Yêu cầu đặc biệt của UC-01: Hệ thống chỉ chấp nhận định dạng đuôi email là .edu.vn
   * @param email Địa chỉ email cần kiểm tra
   */
  public isValidSchoolEmail(email: string): boolean {
    if (!email || typeof email !== 'string') return false;
    const trimmed = email.trim().toLowerCase();
    // Regex kiểm tra email chuẩn và có domain kết thúc bằng .edu.vn
    const emailEduVnRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.edu\.vn$/;
    return emailEduVnRegex.test(trimmed);
  }

  /**
   * Tạo mã OTP xác thực email và gửi tới hộp thư sinh viên (mô phỏng tương tác ST-05)
   * @param email Địa chỉ email trường (.edu.vn)
   * @returns Mã OTP được sinh (để phục vụ thông báo hoặc gửi email)
   */
  public generateAndSendEmailOtp(email: string): { success: boolean; message: string; otp?: string } {
    if (!this.isValidSchoolEmail(email)) {
      return {
        success: false,
        message: 'Email không hợp lệ. Hệ thống chỉ chấp nhận email có đuôi .edu.vn.',
      };
    }

    const cleanEmail = email.trim().toLowerCase();
    this.email = cleanEmail;

    // Sinh mã ngẫu nhiên 6 chữ số
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.currentOtp = otp;
    this.otpExpiresAt = new Date(Date.now() + this.OTP_EXPIRY_MS);
    this.otpAttempts = 0;

    // Trong môi trường thực tế, gọi dịch vụ ST-05 để gửi email.
    return {
      success: true,
      message: `Đã gửi mã OTP xác thực đến email ${cleanEmail}. Mã có hiệu lực trong 5 phút.`,
      otp, // Trả về để tiện test hoặc logging
    };
  }

  /**
   * Phương thức verifySchoolEmail()
   * Xác minh địa chỉ email trường và mã OTP do sinh viên cung cấp (UC-01)
   *
   * @param email Địa chỉ email trường của sinh viên
   * @param otp Mã xác thực OTP sinh viên nhận được qua email
   * @returns VerificationResult Kết quả xác minh
   */
  public verifySchoolEmail(email: string, otp: string): VerificationResult {
    // 1. Kiểm tra định dạng email
    if (!this.isValidSchoolEmail(email)) {
      return {
        success: false,
        statusCode: 'INVALID_EMAIL',
        message: 'Định dạng email không hợp lệ hoặc không thuộc tên miền .edu.vn.',
      };
    }

    const cleanEmail = email.trim().toLowerCase();

    // 2. Kiểm tra nếu chưa từng phát hành OTP hoặc email không khớp với phiên gửi OTP
    if (!this.currentOtp || !this.otpExpiresAt || this.email !== cleanEmail) {
      return {
        success: false,
        statusCode: 'INVALID_OTP',
        message: 'Chưa có yêu cầu gửi mã OTP hợp lệ cho email này. Vui lòng bấm gửi lại mã OTP.',
      };
    }

    // 3. Kiểm tra số lần nhập sai liên tiếp (chống tấn công Brute-force theo UC-01/UC-03)
    if (this.otpAttempts >= this.MAX_OTP_ATTEMPTS) {
      return {
        success: false,
        statusCode: 'INVALID_OTP',
        message: 'Bạn đã nhập sai OTP quá 5 lần. Vui lòng yêu cầu mã OTP mới.',
      };
    }

    // 4. Kiểm tra thời gian hết hạn OTP (5 phút)
    if (new Date() > this.otpExpiresAt) {
      return {
        success: false,
        statusCode: 'OTP_EXPIRED',
        message: 'Mã OTP đã hết hạn. Vui lòng yêu cầu mã xác nhận mới.',
      };
    }

    // 5. Kiểm tra mã OTP
    if (this.currentOtp !== otp.trim()) {
      this.otpAttempts += 1;
      const remainingAttempts = this.MAX_OTP_ATTEMPTS - this.otpAttempts;
      return {
        success: false,
        statusCode: 'INVALID_OTP',
        message: `Mã OTP không chính xác. Bạn còn ${remainingAttempts} lần thử.`,
      };
    }

    // 6. Xác minh thành công
    this.isEmailVerified = true;
    this.emailVerifiedAt = new Date();
    this.currentOtp = null; // Vô hiệu hóa OTP sau khi dùng xong
    this.otpExpiresAt = null;

    return {
      success: true,
      statusCode: 'SUCCESS',
      message: 'Xác minh email trường thành công. Tài khoản đã hoàn thành bước 1.',
    };
  }

  // =========================================================================
  // 2. NHÓM PHƯƠNG THỨC XÁC THỰC THẺ SINH VIÊN (verifyStudentCard)
  // =========================================================================

  /**
   * Sinh viên tải lên ảnh thẻ sinh viên hoặc CCCD để đưa vào hàng đợi chờ duyệt (UC-02 - Bước 1-3)
   * @param cardInfo Thông tin thẻ sinh viên do người dùng cung cấp
   */
  public submitStudentCard(cardInfo: Omit<StudentCardInfo, 'submittedAt'>): VerificationResult {
    if (!this.isEmailVerified) {
      return {
        success: false,
        statusCode: 'MISSING_DATA',
        message: 'Bạn cần xác minh email trường trước khi gửi yêu cầu duyệt thẻ sinh viên.',
      };
    }

    if (!cardInfo.cardImageUrl || cardInfo.cardImageUrl.trim() === '') {
      return {
        success: false,
        statusCode: 'MISSING_DATA',
        message: 'Hình ảnh thẻ sinh viên không được để trống.',
      };
    }

    if (!cardInfo.studentId || cardInfo.studentId.trim() === '') {
      return {
        success: false,
        statusCode: 'MISSING_DATA',
        message: 'Mã số sinh viên (MSSV) không được để trống.',
      };
    }

    if (!cardInfo.universityName || cardInfo.universityName.trim() === '') {
      return {
        success: false,
        statusCode: 'MISSING_DATA',
        message: 'Tên trường đại học không được để trống.',
      };
    }

    // Cập nhật thông tin thẻ và chuyển trạng thái sang Chờ duyệt (PENDING)
    const newCardInfo: StudentCardInfo = {
      cardImageUrl: cardInfo.cardImageUrl.trim(),
      studentId: cardInfo.studentId.trim(),
      universityName: cardInfo.universityName.trim(),
      submittedAt: new Date(),
    };
    if (cardInfo.faculty && cardInfo.faculty.trim() !== '') {
      newCardInfo.faculty = cardInfo.faculty.trim();
    }
    this.cardInfo = newCardInfo;
    this.cardStatus = CardVerificationStatus.PENDING;
    this.reviewDecision = null;

    return {
      success: true,
      statusCode: 'SUCCESS',
      message: 'Tải thẻ sinh viên lên thành công. Hồ sơ đang được chuyển đến hàng đợi của Kiểm duyệt viên.',
    };
  }

  /**
   * Phương thức verifyStudentCard()
   * Dành cho Kiểm duyệt viên (SH-02) hoặc tiến trình kiểm duyệt thẩm tra hồ sơ thẻ sinh viên (UC-02 - Bước 4-7)
   *
   * @param reviewerId Mã định danh Kiểm duyệt viên thực hiện duyệt
   * @param isApproved Quyết định duyệt (true: Phê duyệt, false: Từ chối)
   * @param rejectionReason Lý do từ chối (bắt buộc nếu isApproved = false)
   * @returns VerificationResult Kết quả xử lý kiểm duyệt
   */
  public verifyStudentCard(
    reviewerId: string,
    isApproved: boolean,
    rejectionReason?: string
  ): VerificationResult {
    if (!reviewerId || reviewerId.trim() === '') {
      return {
        success: false,
        statusCode: 'MISSING_DATA',
        message: 'Thiếu thông tin người kiểm duyệt (reviewerId).',
      };
    }

    if (this.cardStatus !== CardVerificationStatus.PENDING || !this.cardInfo) {
      return {
        success: false,
        statusCode: 'MISSING_DATA',
        message: 'Không tìm thấy hồ sơ thẻ sinh viên đang ở trạng thái chờ duyệt.',
      };
    }

    // Trường hợp từ chối duyệt: bắt buộc phải có lý do cụ thể theo UC-02 (Bước 6a)
    if (!isApproved) {
      if (!rejectionReason || rejectionReason.trim() === '') {
        return {
          success: false,
          statusCode: 'MISSING_DATA',
          message: 'Cần cung cấp lý do từ chối xác thực thẻ sinh viên (ảnh mờ, sai thông tin,...).',
        };
      }

      this.cardStatus = CardVerificationStatus.REJECTED;
      this.reviewDecision = {
        reviewerId: reviewerId.trim(),
        isApproved: false,
        rejectionReason: rejectionReason.trim(),
        reviewedAt: new Date(),
      };

      return {
        success: false,
        statusCode: 'REJECTED',
        message: `Đã từ chối xác thực thẻ sinh viên. Lý do: ${rejectionReason.trim()}`,
      };
    }

    // Trường hợp phê duyệt thành công
    this.cardStatus = CardVerificationStatus.APPROVED;
    this.reviewDecision = {
      reviewerId: reviewerId.trim(),
      isApproved: true,
      reviewedAt: new Date(),
    };

    return {
      success: true,
      statusCode: 'SUCCESS',
      message: 'Phê duyệt thẻ sinh viên thành công. Tài khoản sinh viên đã được kích hoạt chính thức.',
    };
  }

  // =========================================================================
  // 3. PHƯƠNG THỨC KIỂM TRA TRẠNG THÁI XÁC MINH HOÀN TẤT (isVerified)
  // =========================================================================

  /**
   * Phương thức isVerified()
   * Kiểm tra xem sinh viên đã được xác minh toàn diện tư cách sinh viên hay chưa.
   * Theo UC-01 & UC-02:
   * Tài khoản chỉ được coi là "Đã xác thực" (Verified) khi:
   * 1. Email trường (.edu.vn) đã được xác minh thành công.
   * 2. Thẻ sinh viên đã được Kiểm duyệt viên phê duyệt (APPROVED).
   *
   * @returns boolean true nếu sinh viên đã được xác thực đầy đủ, false nếu chưa.
   */
  public isVerified(): boolean {
    return this.isEmailVerified && this.cardStatus === CardVerificationStatus.APPROVED;
  }

  // =========================================================================
  // 4. CÁC HÀM TIỆN ÍCH TRUY XUẤT THÔNG TIN (Getters)
  // =========================================================================

  /**
   * Lấy mã tài khoản sinh viên
   */
  public getUserId(): string {
    return this.userId;
  }

  /**
   * Lấy email trường đã xác minh
   */
  public getEmail(): string | null {
    return this.email;
  }

  /**
   * Kiểm tra xem email đã được xác minh chưa
   */
  public isEmailVerifiedStatus(): boolean {
    return this.isEmailVerified;
  }

  /**
   * Lấy trạng thái hiện tại của thẻ sinh viên
   */
  public getCardStatus(): CardVerificationStatus {
    return this.cardStatus;
  }

  /**
   * Lấy thông tin thẻ sinh viên đã gửi
   */
  public getCardInfo(): Readonly<StudentCardInfo> | null {
    return this.cardInfo ? { ...this.cardInfo } : null;
  }

  /**
   * Lấy chi tiết quyết định kiểm duyệt
   */
  public getReviewDecision(): Readonly<CardReviewDecision> | null {
    return this.reviewDecision ? { ...this.reviewDecision } : null;
  }

  /**
   * Lấy toàn bộ hồ sơ xác minh tư cách sinh viên
   */
  public getProfile(): CampusVerificationProfile {
    return {
      userId: this.userId,
      email: this.email,
      isEmailVerified: this.isEmailVerified,
      emailVerifiedAt: this.emailVerifiedAt,
      cardInfo: this.getCardInfo(),
      cardStatus: this.cardStatus,
      reviewDecision: this.getReviewDecision(),
      isFullyVerified: this.isVerified(),
    };
  }
}
