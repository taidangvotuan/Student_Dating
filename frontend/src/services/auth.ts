import { ageAt } from './models';

export interface AuthValues { email: string; password: string; fullName: string; birthDate: string; accepted: boolean; }
export type AuthErrors = Partial<Record<keyof AuthValues, string>>;
export function birthDateError(value: string): string | undefined {
  const date = new Date(`${value}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return 'Vui lòng nhập ngày sinh hợp lệ.';
  if (ageAt(value) < 18 || ageAt(value) > 100) return 'Student Dating dành cho sinh viên từ 18 đến 100 tuổi.';
}
export function validateAuth(values: AuthValues, signup: boolean): AuthErrors {
  const errors: AuthErrors = {};
  if (!/^[^\s@]+@[^\s@]+\.edu\.vn$/i.test(values.email.trim())) errors.email = 'Sử dụng email sinh viên có đuôi .edu.vn.';
  if (values.password.length < 8) errors.password = 'Mật khẩu cần ít nhất 8 ký tự.';
  if (signup) {
    if (values.fullName.trim().length < 2 || values.fullName.trim().length > 80) errors.fullName = 'Họ tên cần từ 2 đến 80 ký tự.';
    const birthdayError = birthDateError(values.birthDate);
    if (birthdayError) errors.birthDate = birthdayError;
    if (!values.accepted) errors.accepted = 'Vui lòng xác nhận bạn đủ 18 tuổi và đồng ý trải nghiệm demo.';
  }
  return errors;
}
