import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Heart,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Brand, Button, Field, SelectField } from "../../components/ui";
import { useDemo } from "../../app/DemoProvider";
import { createInitialState, faculties } from "../../mocks/data";
import {
  validateAuth,
  type AuthErrors,
  type AuthValues,
} from "../../services/auth";

export default function AuthPage({ signup = false }: { signup?: boolean }) {
  const { update, notice, storageWarning } = useDemo();
  const navigate = useNavigate();
  const [values, setValues] = useState<AuthValues>({
    email: "",
    password: "",
    fullName: "",
    birthDate: "",
    accepted: false,
  });
  const [gender, setGender] = useState("");
  const [faculty, setFaculty] = useState("");
  const [cohort, setCohort] = useState("");
  const [errors, setErrors] = useState<AuthErrors>({});
  const [visible, setVisible] = useState(false);
  function set(name: keyof AuthValues, value: string | boolean) {
    setValues((old) => ({ ...old, [name]: value }));
    setErrors((old) => ({ ...old, [name]: undefined }));
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    const next = validateAuth(values, signup);
    setErrors(next);
    if (Object.keys(next).length) return;
    if (signup)
      update(() => {
        const fresh = createInitialState();
        return {
          ...fresh,
          session: true,
          profile: {
            ...fresh.profile,
            fullName: values.fullName.trim(),
            email: values.email.trim(),
            birthDate: values.birthDate,
            gender,
            faculty,
            cohort,
            bio: "",
            interests: [],
          },
        };
      });
    else update((state) => ({ ...state, session: true }));
    navigate(signup ? "/profile?setup=1" : "/discover");
  }
  return (
    <div className="auth-page">
      <section className="auth-story">
        <Link to="/login" className="brand-link">
          <Brand />
        </Link>
        <div className="story-copy">
          <span className="eyebrow">THỜI SINH VIÊN, THÊM MỘT NGƯỜI THƯƠNG</span>
          <h1>
            Cùng một nhịp.
            <br />
            Thêm một <em>kết nối.</em>
          </h1>
          <p>
            Giữa những giờ lên lớp và bao điều bận rộn,
            <br className="desktop-only" /> biết đâu có một người đang chờ gặp
            bạn.
          </p>
          <div className="story-portraits">
            <img
              className="portrait-one"
              src="/images/linh.jpg"
              alt="Ảnh minh họa một sinh viên"
            />
            <span className="portrait-heart">
              <Heart fill="currentColor" size={32} />
            </span>
            <img
              className="portrait-two"
              src="/images/minh.jpg"
              alt="Ảnh minh họa một sinh viên"
            />
            <span className="floating-note">
              <Sparkles size={16} /> Bắt đầu bằng một lời chào
            </span>
          </div>
          <div className="story-trust">
            <ShieldCheck size={19} />
            <span>Dành cho sinh viên · Từ 18 tuổi trở lên</span>
          </div>
        </div>
        <span className="story-bottom">
          Mỗi kết nối đều có câu chuyện của riêng mình.
        </span>
      </section>
      <main className="auth-form-panel">
        <div className="auth-mobile-logo">
          <Brand />
        </div>
        <div className="auth-form-wrap">
          <span className="eyebrow">CHÀO BẠN, RẤT VUI ĐƯỢC GẶP</span>
          <h2>
            {signup ? "Bắt đầu câu chuyện của bạn" : "Chào mừng bạn trở lại"}
          </h2>
          <p className="muted">
            {signup
              ? "Một vài thông tin để chúng mình hiểu bạn hơn."
              : "Đăng nhập để tiếp tục những kết nối còn dang dở."}
          </p>
          <div className="auth-tabs">
            <Link to="/login" className={!signup ? "selected" : ""}>
              Đăng nhập
            </Link>
            <Link to="/register" className={signup ? "selected" : ""}>
              Đăng ký
            </Link>
          </div>
          <form noValidate onSubmit={submit}>
            {signup && (
              <Field
                label="Họ và tên"
                autoComplete="name"
                value={values.fullName}
                error={errors.fullName}
                maxLength={80}
                onChange={(e) => set("fullName", e.target.value)}
                required
              />
            )}
            <Field
              label="Email sinh viên"
              type="email"
              autoComplete="email"
              placeholder="24520001@gm.uit.edu.vn"
              value={values.email}
              error={errors.email}
              hint="Email do trường cấp, kết thúc bằng .edu.vn"
              onChange={(e) => set("email", e.target.value)}
              required
            />
            <div className="password-field">
              <Field
                label="Mật khẩu"
                type={visible ? "text" : "password"}
                autoComplete={signup ? "new-password" : "current-password"}
                placeholder="Ít nhất 8 ký tự"
                value={values.password}
                error={errors.password}
                onChange={(e) => set("password", e.target.value)}
                required
              />
              <Button
                variant="ghost"
                aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                onClick={() => setVisible(!visible)}
              >
                {visible ? <EyeOff size={19} /> : <Eye size={19} />}
              </Button>
            </div>
            {signup && (
              <>
                <div className="form-grid">
                  <Field
                    label="Ngày sinh"
                    type="date"
                    value={values.birthDate}
                    error={errors.birthDate}
                    onChange={(e) => set("birthDate", e.target.value)}
                    required
                  />
                  <SelectField
                    label="Giới tính (tùy chọn)"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="">Chưa chia sẻ</option>
                    <option>Nam</option>
                    <option>Nữ</option>
                    <option>Khác</option>
                  </SelectField>
                </div>
                <div className="form-grid">
                  <SelectField
                    label="Khoa (tùy chọn)"
                    value={faculty}
                    onChange={(e) => setFaculty(e.target.value)}
                  >
                    <option value="">Chọn khoa</option>
                    {faculties.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </SelectField>
                  <Field
                    label="Khóa học (tùy chọn)"
                    placeholder="2024"
                    value={cohort}
                    inputMode="numeric"
                    maxLength={4}
                    onChange={(e) =>
                      setCohort(e.target.value.replace(/\D/g, ""))
                    }
                  />
                </div>
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={values.accepted}
                    onChange={(e) => set("accepted", e.target.checked)}
                    aria-describedby={
                      errors.accepted ? "consent-error" : undefined
                    }
                  />
                  Tôi đủ 18 tuổi và đồng ý trải nghiệm với dữ liệu demo.
                </label>
                {errors.accepted && (
                  <p className="error" id="consent-error">
                    {errors.accepted}
                  </p>
                )}
              </>
            )}
            <Button type="submit" className="full-width">
              {signup ? "Tạo hồ sơ demo" : "Đăng nhập demo"}{" "}
              <ArrowRight size={18} />
            </Button>
          </form>
          <div className="or-divider">
            <span>hoặc làm quen trước</span>
          </div>
          <Button
            variant="secondary"
            className="full-width"
            onClick={() => {
              update((s) => ({ ...s, session: true }));
              navigate("/discover");
            }}
          >
            <Sparkles size={18} /> Trải nghiệm demo
          </Button>
          <p className="auth-disclaimer">
            Đây là bản mô phỏng. Form không xác thực tài khoản thật.
            <br />
            Không dùng mật khẩu thật; mật khẩu không được lưu.
          </p>
          {(notice || storageWarning) && (
            <p role="status">{notice || storageWarning}</p>
          )}
        </div>
        <span className="auth-footer">
          Một không gian nhỏ, cho những kết nối thật lòng.
        </span>
      </main>
    </div>
  );
}
