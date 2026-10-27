export type TrangThaiXacThucSV =
  | "CHUA_XAC_THUC"
  | "CHO_DUYET"
  | "DA_XAC_THUC"
  | "TU_CHOI";

export type TrangThaiTaiKhoan =
  | "HOAT_DONG"
  | "TAM_KHOA"
  | "KHOA_VINH_VIEN";

export type TrangThaiHoSo =
  | "CON_HOAT_DONG"
  | "BI_AN"
  | "BI_KHOA"
  | "NGUNG_SU_DUNG";

export type LoaiTuongTac = "THICH" | "BO_QUA";

export interface SinhVien {
  maSinhVien: string;
  maSoSinhVien: string;
  trangThaiXacThucSV: TrangThaiXacThucSV;
  trangThaiTaiKhoan: TrangThaiTaiKhoan;
}

export interface SoThich {
  maSoThich: string;
  tenSoThich: string;
  trangThaiHienThi: boolean;
}

export interface HoSoHenHo {
  maHoSo: string;
  maSinhVien: string;
  sinhVien: SinhVien;

  ngaySinh: Date;
  gioiTinh: string | null;
  tieuSuBio?: string | null;

  khoaNganh: string | null;
  khoaHoc: string | null;
  dinhHuongKetNoi: string | null;

  viDoGPS: number | null;
  kinhDoGPS: number | null;

  trangThaiHoSo: TrangThaiHoSo;
  soThich: SoThich[];
}

export interface TieuChiTimKiem {
  doTuoiToiThieu: number;
  doTuoiToiDa: number;
  gioiTinhUuTien: string | null;
  khoaNganhUuTien: string | null;
  khoangCachToiDaKm: number | null;
  chiHienThiDaXacThuc: boolean;
}

export interface LuotThich {
  maHoSoGui: string;
  maHoSoNhan: string;
  loaiTuongTac: LoaiTuongTac;
  thoiGianTuongTac: Date;
}

export interface ChanNguoiDung {
  maHoSoNguoiChan: string;
  maHoSoBiChan: string;
}

export interface TrongSoTuongThich {
  soThich: number;
  khoaNganh: number;
  khoaHoc: number;
  mucTieuKetNoi: number;
}

export interface KetQuaDeXuat {
  ungVien: HoSoHenHo;
  diem: number;
  soSoThichChung: number;
}

export interface MatchingEngineConfig {
  trongSo?: TrongSoTuongThich;
  gioiHanMacDinh?: number;
  /** Ngày hiện tại được inject để kiểm thử ổn định. */
  homNay?: Date;
}

export interface DieuKienLocUngVien {
  nguoiXem: HoSoHenHo;
  ungVien: HoSoHenHo;
  tieuChi: TieuChiTimKiem;
  lichSuTuongTac: readonly LuotThich[];
  danhSachChan: readonly ChanNguoiDung[];
  homNay: Date;
}

export const TRONG_SO_MAC_DINH: Readonly<TrongSoTuongThich> =
  Object.freeze({
    soThich: 0.4,
    khoaNganh: 0.25,
    khoaHoc: 0.15,
    mucTieuKetNoi: 0.2,
  });

export const GIOI_HAN_MAC_DINH = 20;

const SAI_SO_TONG_TRONG_SO = 1e-9;

// ============================================================
// Hàm thuần (Pure Functions)
// ============================================================

/**
 * Tính tuổi theo ngày sinh và ngày hiện tại, không phụ thuộc giờ.
 * @throws RangeError nếu một trong hai ngày không hợp lệ.
 */
export function tinhTuoi(ngaySinh: Date, homNay: Date): number {
  // FR-04: Xác định tuổi theo năm, tháng và ngày sinh.
  if (
    Number.isNaN(ngaySinh.getTime()) ||
    Number.isNaN(homNay.getTime())
  ) {
    throw new RangeError("Ngày sinh hoặc ngày hiện tại không hợp lệ.");
  }

  // Dùng UTC để tránh sai lệch do múi giờ của môi trường chạy.
  let tuoi = homNay.getUTCFullYear() - ngaySinh.getUTCFullYear();

  const chuaDenSinhNhat =
    homNay.getUTCMonth() < ngaySinh.getUTCMonth() ||
    (homNay.getUTCMonth() === ngaySinh.getUTCMonth() &&
      homNay.getUTCDate() < ngaySinh.getUTCDate());

  if (chuaDenSinhNhat) {
    tuoi -= 1;
  }

  return tuoi;
}

/**
 * Tính Jaccard trên tập sở thích đang được hiển thị.
 * Hai tập rỗng hoặc không có giao nhau đều cho kết quả 0.
 */
export function tinhJaccardSoThich(
  a: readonly SoThich[],
  b: readonly SoThich[],
): number {
  // FR-05: Chỉ xét sở thích có trangThaiHienThi = true.
  const tapA = new Set(
    a
      .filter((item) => item.trangThaiHienThi)
      .map((item) => item.maSoThich),
  );

  const tapB = new Set(
    b
      .filter((item) => item.trangThaiHienThi)
      .map((item) => item.maSoThich),
  );

  // Không chia cho 0 khi người xem không có sở thích hiển thị.
  if (tapA.size === 0 || tapB.size === 0) {
    return 0;
  }

  // Đếm giao của hai tập mã sở thích.
  let giao = 0;
  for (const maSoThich of tapA) {
    if (tapB.has(maSoThich)) {
      giao += 1;
    }
  }

  // Jaccard = |A ∩ B| / |A ∪ B|.
  const hop = tapA.size + tapB.size - giao;
  return hop === 0 ? 0 : giao / hop;
}

/**
 * Tính khoảng cách địa lý giữa hai tọa độ bằng công thức Haversine.
 * @returns Khoảng cách theo km.
 */
export function khoangCachKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  // FR-04: Kiểm tra tọa độ trước khi tính khoảng cách.
  const toaDoHopLe = [lat1, lon1, lat2, lon2].every(
    (value) => Number.isFinite(value),
  );

  if (
    !toaDoHopLe ||
    Math.abs(lat1) > 90 ||
    Math.abs(lat2) > 90 ||
    Math.abs(lon1) > 180 ||
    Math.abs(lon2) > 180
  ) {
    throw new RangeError("Tọa độ GPS không hợp lệ.");
  }

  const radian = (soDo: number): number => (soDo * Math.PI) / 180;
  const banKinhTraiDatKm = 6371;

  const deltaLat = radian(lat2 - lat1);
  const deltaLon = radian(lon2 - lon1);
  const rLat1 = radian(lat1);
  const rLat2 = radian(lat2);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(rLat1) *
      Math.cos(rLat2) *
      Math.sin(deltaLon / 2) ** 2;

  // Chặn sai số số thực để đối số của asin luôn trong miền hợp lệ.
  const aAnToan = Math.min(1, Math.max(0, a));
  const goc = 2 * Math.asin(Math.sqrt(aAnToan));

  return banKinhTraiDatKm * goc;
}

/**
 * Kiểm tra một ứng viên có vượt qua tất cả bộ lọc loại trừ không.
 */
export function laUngVienDuDieuKien(
  dieuKien: DieuKienLocUngVien,
): boolean {
  // FR-05 / UC-08: Không ghép đôi với chính mình.
  const { nguoiXem, ungVien, tieuChi, lichSuTuongTac, danhSachChan, homNay } =
    dieuKien;

  if (ungVien.maSinhVien === nguoiXem.maSinhVien) {
    return false;
  }

  // FR-01 / GL-08: Chỉ sinh viên đã xác thực mới đủ điều kiện.
  if (ungVien.sinhVien.trangThaiXacThucSV !== "DA_XAC_THUC") {
    return false;
  }

  // FR-01: Tài khoản phải đang hoạt động.
  if (ungVien.sinhVien.trangThaiTaiKhoan !== "HOAT_DONG") {
    return false;
  }

  // UC-08: Loại hồ sơ ẩn, khóa hoặc ngừng sử dụng.
  if (ungVien.trangThaiHoSo !== "CON_HOAT_DONG") {
    return false;
  }

  // P3A_01 / P4: Dữ liệu hồ sơ phải liên kết đúng sinh viên.
  if (
    !ungVien.maHoSo ||
    !ungVien.maSinhVien ||
    ungVien.sinhVien.maSinhVien !== ungVien.maSinhVien
  ) {
    return false;
  }

  // UC-08: Đã tương tác theo bất kỳ chiều nào đều không đề xuất lại.
  const daTuongTac = lichSuTuongTac.some(
    (luot) =>
      (luot.maHoSoGui === nguoiXem.maHoSo &&
        luot.maHoSoNhan === ungVien.maHoSo) ||
      (luot.maHoSoGui === ungVien.maHoSo &&
        luot.maHoSoNhan === nguoiXem.maHoSo),
  );

  if (daTuongTac) {
    return false;
  }

  // UC-08: Quan hệ chặn theo cả hai chiều đều loại ứng viên.
  const coQuanHeChan = danhSachChan.some(
    (quanHe) =>
      (quanHe.maHoSoNguoiChan === nguoiXem.maHoSo &&
        quanHe.maHoSoBiChan === ungVien.maHoSo) ||
      (quanHe.maHoSoNguoiChan === ungVien.maHoSo &&
        quanHe.maHoSoBiChan === nguoiXem.maHoSo),
  );

  if (coQuanHeChan) {
    return false;
  }

  // FR-04: Tuổi phải nằm trong khoảng tìm kiếm.
  const tuoi = tinhTuoi(ungVien.ngaySinh, homNay);
  if (tuoi < tieuChi.doTuoiToiThieu || tuoi > tieuChi.doTuoiToiDa) {
    return false;
  }

  // FR-04: Chỉ lọc giới tính khi người xem đã đặt ưu tiên.
  if (
    tieuChi.gioiTinhUuTien !== null &&
    tieuChi.gioiTinhUuTien !== undefined &&
    ungVien.gioiTinh !== tieuChi.gioiTinhUuTien
  ) {
    return false;
  }

  // FR-04: Chỉ lọc khoa/ngành khi có ưu tiên.
  if (
    tieuChi.khoaNganhUuTien !== null &&
    tieuChi.khoaNganhUuTien !== undefined &&
    ungVien.khoaNganh !== tieuChi.khoaNganhUuTien
  ) {
    return false;
  }

  // FR-01 / GL-08: Giữ điều kiện này để thể hiện rõ tiêu chí tìm kiếm.
  if (
    tieuChi.chiHienThiDaXacThuc &&
    ungVien.sinhVien.trangThaiXacThucSV !== "DA_XAC_THUC"
  ) {
    return false;
  }

  // FR-04: Chỉ áp dụng lọc khoảng cách khi có ngưỡng và đủ cả hai tọa độ.
  const khoangCachToiDa = tieuChi.khoangCachToiDaKm;

  if (khoangCachToiDa !== null && khoangCachToiDa !== undefined) {
    if (!Number.isFinite(khoangCachToiDa) || khoangCachToiDa <= 0) {
      throw new RangeError("Khoảng cách tối đa phải lớn hơn 0.");
    }

    const coDuGPS =
      nguoiXem.viDoGPS !== null &&
      nguoiXem.viDoGPS !== undefined &&
      nguoiXem.kinhDoGPS !== null &&
      nguoiXem.kinhDoGPS !== undefined &&
      ungVien.viDoGPS !== null &&
      ungVien.viDoGPS !== undefined &&
      ungVien.kinhDoGPS !== null &&
      ungVien.kinhDoGPS !== undefined;

    if (coDuGPS) {
      const distance = khoangCachKm(
        nguoiXem.viDoGPS!,
        nguoiXem.kinhDoGPS!,
        ungVien.viDoGPS!,
        ungVien.kinhDoGPS!,
      );

      if (distance > khoangCachToiDa) {
        return false;
      }
    }
    // Nếu thiếu GPS, bỏ qua điều kiện khoảng cách.
    // Vì hàm này thuần, tầng gọi chịu trách nhiệm ghi log cảnh báo thiếu GPS.
  }

  return true;
}

// ============================================================
// MatchingEngine — DD-07, FR-05, UC-08
// ============================================================

export class MatchingEngine {
  private readonly trongSo: Readonly<TrongSoTuongThich>;
  private readonly gioiHanMacDinh: number;
  private readonly homNay: Date;

  constructor(config: MatchingEngineConfig = {}) {
    // DD-07: Cho phép cấu hình trọng số nhưng bảo đảm tổng bằng 1.
    const trongSo = config.trongSo ?? { ...TRONG_SO_MAC_DINH };

    const cacTrongSo = [
      trongSo.soThich,
      trongSo.khoaNganh,
      trongSo.khoaHoc,
      trongSo.mucTieuKetNoi,
    ];

    if (
      !cacTrongSo.every(
        (value) => Number.isFinite(value) && value >= 0,
      )
    ) {
      throw new RangeError("Các trọng số phải là số hữu hạn không âm.");
    }

    const tongTrongSo = cacTrongSo.reduce((sum, value) => sum + value, 0);
    if (Math.abs(tongTrongSo - 1) > SAI_SO_TONG_TRONG_SO) {
      throw new RangeError("Tổng trọng số tương thích phải bằng 1.0.");
    }

    // Kiểm tra giới hạn kết quả mặc định.
    const gioiHan = config.gioiHanMacDinh ?? GIOI_HAN_MAC_DINH;
    if (!Number.isInteger(gioiHan) || gioiHan <= 0) {
      throw new RangeError("Giới hạn mặc định phải là số nguyên lớn hơn 0.");
    }

    // Sao chép cấu hình để tránh thay đổi từ đối tượng bên ngoài.
    this.trongSo = Object.freeze({ ...trongSo });
    this.gioiHanMacDinh = gioiHan;
    this.homNay = new Date(
      (config.homNay ?? new Date()).getTime(),
    );

    if (Number.isNaN(this.homNay.getTime())) {
      throw new RangeError("Ngày hiện tại không hợp lệ.");
    }
  }

  /**
   * [DD-07][FR-05] Tính điểm tương thích từ bốn tín hiệu nghiệp vụ.
   * Trả về số từ 0 đến 100, làm tròn 2 chữ số thập phân.
   */
  public calculateScore(
    nguoiXem: HoSoHenHo,
    ungVien: HoSoHenHo,
    trongSo?: TrongSoTuongThich,
  ): number {
    // DD-07: Dùng trọng số truyền vào hoặc cấu hình mặc định.
    const weights = trongSo ?? this.trongSo;

    const values = [
      weights.soThich,
      weights.khoaNganh,
      weights.khoaHoc,
      weights.mucTieuKetNoi,
    ];

    if (
      !values.every((value) => Number.isFinite(value) && value >= 0) ||
      Math.abs(values.reduce((sum, value) => sum + value, 0) - 1) >
        SAI_SO_TONG_TRONG_SO
    ) {
      throw new RangeError("Trọng số phải không âm và có tổng bằng 1.0.");
    }

    // FR-05: Tính Jaccard chỉ từ sở thích đang hiển thị.
    const scoreSoThich = tinhJaccardSoThich(
      nguoiXem.soThich ?? [],
      ungVien.soThich ?? [],
    );

    // FR-05: Thiếu dữ liệu so sánh được xem là không tương đồng.
    const scoreKhoaNganh =
      nguoiXem.khoaNganh != null &&
      ungVien.khoaNganh != null &&
      nguoiXem.khoaNganh === ungVien.khoaNganh
        ? 1
        : 0;

    const scoreKhoaHoc =
      nguoiXem.khoaHoc != null &&
      ungVien.khoaHoc != null &&
      nguoiXem.khoaHoc === ungVien.khoaHoc
        ? 1
        : 0;

    const scoreMucTieu =
      nguoiXem.dinhHuongKetNoi != null &&
      ungVien.dinhHuongKetNoi != null &&
      nguoiXem.dinhHuongKetNoi === ungVien.dinhHuongKetNoi
        ? 1
        : 0;

    // DD-07: Tổng hợp bốn tín hiệu theo trọng số cấu hình.
    const rawScore =
      scoreSoThich * weights.soThich +
      scoreKhoaNganh * weights.khoaNganh +
      scoreKhoaHoc * weights.khoaHoc +
      scoreMucTieu * weights.mucTieuKetNoi;

    // Bảo đảm kết quả nằm trong [0, 100] và làm tròn hai chữ số.
    const boundedScore = Math.min(1, Math.max(0, rawScore)) * 100;
    return Math.round((boundedScore + Number.EPSILON) * 100) / 100;
  }

  /**
   * [FR-01][FR-04][FR-05][UC-08] Lọc ứng viên đủ điều kiện.
   * Mặc định trả hồ sơ chưa xếp hạng; daXepHang=true trả kết quả đã xếp hạng.
   */
  public findMatches(
    nguoiXem: HoSoHenHo,
    danhSachUngVien: readonly HoSoHenHo[],
    tieuChi: TieuChiTimKiem,
    lichSuTuongTac: readonly LuotThich[],
    danhSachChan: readonly ChanNguoiDung[],
    daXepHang: false,
  ): HoSoHenHo[];

  public findMatches(
    nguoiXem: HoSoHenHo,
    danhSachUngVien: readonly HoSoHenHo[],
    tieuChi: TieuChiTimKiem,
    lichSuTuongTac: readonly LuotThich[],
    danhSachChan: readonly ChanNguoiDung[],
    daXepHang: true,
  ): KetQuaDeXuat[];

  public findMatches(
    nguoiXem: HoSoHenHo,
    danhSachUngVien: readonly HoSoHenHo[],
    tieuChi: TieuChiTimKiem,
    lichSuTuongTac: readonly LuotThich[],
    danhSachChan: readonly ChanNguoiDung[],
    daXepHang = false,
  ): HoSoHenHo[] | KetQuaDeXuat[] {
    // FR-04: Kiểm tra tính hợp lệ của tiêu chí trước khi lọc.
    if (
      !Number.isFinite(tieuChi.doTuoiToiThieu) ||
      !Number.isFinite(tieuChi.doTuoiToiDa) ||
      tieuChi.doTuoiToiThieu < 0 ||
      tieuChi.doTuoiToiThieu > tieuChi.doTuoiToiDa
    ) {
      throw new RangeError("Khoảng tuổi không hợp lệ.");
    }

    if (
      tieuChi.khoangCachToiDaKm !== null &&
      tieuChi.khoangCachToiDaKm !== undefined &&
      (!Number.isFinite(tieuChi.khoangCachToiDaKm) ||
        tieuChi.khoangCachToiDaKm <= 0)
    ) {
      throw new RangeError("Khoảng cách tối đa phải lớn hơn 0.");
    }

    // UC-08: Loại ứng viên vi phạm bất kỳ điều kiện loại trừ nào.
    const danhSachDaLoc = danhSachUngVien.filter((ungVien) =>
      laUngVienDuDieuKien({
        nguoiXem,
        ungVien,
        tieuChi,
        lichSuTuongTac,
        danhSachChan,
        homNay: this.homNay,
      }),
    );

    // Tùy chọn trả về hồ sơ thuần hoặc kết quả có điểm xếp hạng.
    if (daXepHang) {
      return this.rankMatches(danhSachDaLoc, nguoiXem);
    }

    return [...danhSachDaLoc];
  }

  /**
   * [DD-07][FR-05] Xếp hạng giảm dần, dùng tie-breaker tất định.
   * gioiHan mặc định theo cấu hình và phải là số nguyên dương.
   */
  public rankMatches(
    danhSachDaLoc: readonly HoSoHenHo[],
    nguoiXem: HoSoHenHo,
    gioiHan: number = this.gioiHanMacDinh,
  ): KetQuaDeXuat[] {
    // Kiểm tra giới hạn để tránh trả kết quả không hợp lệ.
    if (!Number.isInteger(gioiHan) || gioiHan <= 0) {
      throw new RangeError("gioiHan phải là số nguyên lớn hơn 0.");
    }

    // DD-07: Tính điểm và số sở thích chung cho từng ứng viên.
    const ketQua: KetQuaDeXuat[] = danhSachDaLoc.map((ungVien) => {
      const tapA = new Set(
        (nguoiXem.soThich ?? [])
          .filter((item) => item.trangThaiHienThi)
          .map((item) => item.maSoThich),
      );

      const tapB = new Set(
        (ungVien.soThich ?? [])
          .filter((item) => item.trangThaiHienThi)
          .map((item) => item.maSoThich),
      );

      const soSoThichChung = [...tapA].filter((id) => tapB.has(id)).length;

      return {
        ungVien,
        diem: this.calculateScore(nguoiXem, ungVien),
        soSoThichChung,
      };
    });

    // DD-07: Điểm giảm dần, sau đó sở thích chung giảm dần,
    // cuối cùng mã hồ sơ tăng dần để thứ tự luôn xác định.
    ketQua.sort(
      (a, b) =>
        b.diem - a.diem ||
        b.soSoThichChung - a.soSoThichChung ||
        a.ungVien.maHoSo.localeCompare(b.ungVien.maHoSo),
    );

    // Không thay đổi danh sách đầu vào; chỉ trả tối đa gioiHan kết quả.
    return ketQua.slice(0, gioiHan);
  }
}