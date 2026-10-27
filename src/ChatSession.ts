// ==========================================
// 1. Data Models & Enums/Types
// ==========================================

export type TrangThaiKetNoi = 'DA_GHEP_DOI' | 'DANG_HOAT_DONG' | 'DA_HUY';
export type TrangThaiCuocTroChuyen = 'HOAT_DONG' | 'KHONG_HOAT_DONG';
export type TrangThaiTinNhan = 'DA_GUI' | 'DA_XOA';

export interface KetNoi {
  maKetNoi: string;
  maNguoiDung1: string;
  maNguoiDung2: string;
  trangThai: TrangThaiKetNoi;
  thoiGianKetNoi: Date;
}

export interface CuocTroChuyen {
  maCuocTroChuyen: string;
  maKetNoi: string;
  trangThai: TrangThaiCuocTroChuyen;
  maTinNhanMoiNhat: string | null;
  thoiGianCapNhatCuoi: Date;
  thoiGianTao: Date;
  soTinNhanChuaDoc: Map<string, number>;
}

export interface TinNhan {
  maTinNhan: string;
  maCuocTroChuyen: string;
  maNguoiGui: string;
  noiDung: string;
  thoiGianGui: Date;
  trangThai: TrangThaiTinNhan;
}

// ==========================================
// 2. Chat Service Implementation (UC-11)
// ==========================================

export class ChatService {
  private ketNoiMap: Map<string, KetNoi> = new Map();
  private cuocTroChuyenMap: Map<string, CuocTroChuyen> = new Map();
  private tinNhanMap: Map<string, TinNhan> = new Map();

  public addKetNoi(ketNoi: KetNoi): void {
    this.ketNoiMap.set(ketNoi.maKetNoi, ketNoi);
  }

  public addCuocTroChuyen(cuocTroChuyen: CuocTroChuyen): void {
    this.cuocTroChuyenMap.set(cuocTroChuyen.maCuocTroChuyen, cuocTroChuyen);
  }

  /**
   * @description 
   * Thực hiện gửi một tin nhắn mới trong cuộc trò chuyện. Hàm tiến hành xác thực 
   * trạng thái cuộc trò chuyện và quyền gửi của người dùng, sau đó khởi tạo tin nhắn, 
   * cập nhật tin nhắn mới nhất và tăng số tin nhắn chưa đọc của đối phương.
   * 
   * @param maCuocTroChuyen - Mã định danh của cuộc trò chuyện cần gửi tin nhắn.
   * @param maNguoiGui - Mã định danh của người dùng thực hiện gửi tin nhắn.
   * @param noiDung - Nội dung văn bản của tin nhắn.
   * 
   * @returns Đối tượng `TinNhan` vừa được tạo thành công.
   */
  public sendMessage(
    maCuocTroChuyen: string,
    maNguoiGui: string,
    noiDung: string
  ): TinNhan {
    const cuocTroChuyen = this.cuocTroChuyenMap.get(maCuocTroChuyen);
    if (!cuocTroChuyen) {
      throw new Error(`Cuộc trò chuyện [${maCuocTroChuyen}] không tồn tại.`);
    }

    if (cuocTroChuyen.trangThai !== 'HOAT_DONG') {
      throw new Error('Cuộc trò chuyện đã bị khóa hoặc không ở trạng thái HOAT_DONG.');
    }

    const ketNoi = this.ketNoiMap.get(cuocTroChuyen.maKetNoi);
    if (!ketNoi || (ketNoi.maNguoiDung1 !== maNguoiGui && ketNoi.maNguoiDung2 !== maNguoiGui)) {
      throw new Error('Người gửi không thuộc kết nối của cuộc trò chuyện này.');
    }

    // Xác định người nhận để tăng số tin nhắn chưa đọc
    const maNguoiNhan = ketNoi.maNguoiDung1 === maNguoiGui ? ketNoi.maNguoiDung2 : ketNoi.maNguoiDung1;

    const now = new Date();
    const newTinNhan: TinNhan = {
      maTinNhan: `MSG_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      maCuocTroChuyen,
      maNguoiGui,
      noiDung,
      thoiGianGui: now,
      trangThai: 'DA_GUI',
    };

    // Lưu tin nhắn vào cơ sở dữ liệu
    this.tinNhanMap.set(newTinNhan.maTinNhan, newTinNhan);

    // Cập nhật thông tin cuộc trò chuyện
    cuocTroChuyen.maTinNhanMoiNhat = newTinNhan.maTinNhan;
    cuocTroChuyen.thoiGianCapNhatCuoi = now;

    // Tăng đếm số tin nhắn chưa đọc cho người nhận
    const unreadCount = cuocTroChuyen.soTinNhanChuaDoc.get(maNguoiNhan) || 0;
    cuocTroChuyen.soTinNhanChuaDoc.set(maNguoiNhan, unreadCount + 1);

    return newTinNhan;
  }

  /**
   * 
   * @description 
   * Truy vấn và lấy danh sách tất cả các tin nhắn hợp lệ (chưa bị xóa) thuộc về một cuộc trò chuyện.
   * Danh sách tin nhắn được sắp xếp theo thứ tự thời gian gửi tăng dần. 
   * Lưu ý: Hàm chỉ thực hiện truy vấn và không làm thay đổi hay reset chỉ số tin nhắn chưa đọc.
   * 
   * @param maCuocTroChuyen - Mã định danh của cuộc trò chuyện cần lấy danh sách tin nhắn.
   * 
   * @returns Mảng các đối tượng `TinNhan` còn tồn tại trong cuộc trò chuyện.
   * 
   */
  public getMessages(maCuocTroChuyen: string): TinNhan[] {
    const cuocTroChuyen = this.cuocTroChuyenMap.get(maCuocTroChuyen);
    if (!cuocTroChuyen) {
      throw new Error(`Cuộc trò chuyện [${maCuocTroChuyen}] không tồn tại.`);
    }

    return Array.from(this.tinNhanMap.values())
      .filter((msg) => msg.maCuocTroChuyen === maCuocTroChuyen && msg.trangThai !== 'DA_XOA')
      .sort((a, b) => a.thoiGianGui.getTime() - b.thoiGianGui.getTime());
  }

  /**
   * 
   * @description 
   * Kết thúc phiên trò chuyện hiện tại. Hàm chuyển trạng thái của cuộc trò chuyện sang 'KHONG_HOAT_DONG',
   * đồng thời cập nhật trạng thái của kết nối tương ứng sang 'DA_HUY' để hoàn tất đóng kết nối giữa hai người dùng.
   * 
   * @param maCuocTroChuyen - Mã định danh của cuộc trò chuyện cần đóng phiên.
   * 
   * @returns Đối tượng `CuocTroChuyen` đã được cập nhật trạng thái.
   * 
   */
  public closeSession(maCuocTroChuyen: string): CuocTroChuyen {
    const cuocTroChuyen = this.cuocTroChuyenMap.get(maCuocTroChuyen);
    if (!cuocTroChuyen) {
      throw new Error(`Cuộc trò chuyện [${maCuocTroChuyen}] không tồn tại.`);
    }

    const now = new Date();

    // Đóng cuộc trò chuyện
    cuocTroChuyen.trangThai = 'KHONG_HOAT_DONG';
    cuocTroChuyen.thoiGianCapNhatCuoi = now;

    // Đóng kết nối liên quan
    const ketNoi = this.ketNoiMap.get(cuocTroChuyen.maKetNoi);
    if (ketNoi) {
      ketNoi.trangThai = 'DA_HUY';
    }

    return cuocTroChuyen;
  }
}