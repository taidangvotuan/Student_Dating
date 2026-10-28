export class StudentAccountManager {
    private studentId: string;
    private fullName: string;
    private email: string;
    private isActive: boolean;
    private updatedAt: Date;

    constructor(studentId: string, fullName: string, email: string, isActive: boolean = true) {
        this.studentId = studentId;
        this.fullName = fullName;
        this.email = email;
        this.isActive = isActive;
        this.updatedAt = new Date();
    }

    /**
     * Cập nhật email mới cho tài khoản sinh viên
     */
    public updateEmail(newEmail: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(newEmail)) {
            throw new Error("Địa chỉ email không đúng định dạng.");
        }

        if (!this.isActive) {
            throw new Error("Không thể cập nhật email khi tài khoản đang bị vô hiệu hóa.");
        }

        this.email = newEmail.trim().toLowerCase();
        this.updatedAt = new Date();
        return true;
    }

    /**
     * Kích hoạt tài khoản
     */
    public activateAccount(): void {
        this.isActive = true;
        this.updatedAt = new Date();
    }

    /**
     * Vô hiệu hóa tài khoản
     */
    public deactivateAccount(): void {
        this.isActive = false;
        this.updatedAt = new Date();
    }

    /**
     * Lấy thông tin tài khoản hiện tại
     */
    public getAccountInfo() {
        return {
            studentId: this.studentId,
            fullName: this.fullName,
            email: this.email,
            isActive: this.isActive,
            updatedAt: this.updatedAt,
        };
    }
}