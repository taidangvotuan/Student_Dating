import type {
  Candidate,
  DemoState,
  Preferences,
  Profile,
} from "../services/models";

export const interests = [
  "Cà phê",
  "Nhiếp ảnh",
  "Âm nhạc",
  "Du lịch",
  "Đọc sách",
  "Chạy bộ",
  "Điện ảnh",
  "Thiết kế",
  "Nấu ăn",
  "Công nghệ",
];
export const faculties = [
  "Khoa học máy tính",
  "Kinh tế",
  "Truyền thông",
  "Thiết kế",
  "Ngoại ngữ",
];
export const defaultPreferences: Preferences = {
  minAge: 18,
  maxAge: 26,
  preferredGender: "",
  preferredFaculty: "",
  verifiedOnly: false,
};
export const avatars = [
  "/images/minh.jpg",
  "/images/linh.jpg",
  "/images/an.jpg",
  "/images/nam.jpg",
];
export const defaultProfile: Profile = {
  id: "demo-me",
  fullName: "Nguyễn Nhật Minh",
  email: "24520001@gm.uit.edu.vn",
  birthDate: "2004-08-19",
  gender: "Nam",
  faculty: "Khoa học máy tính",
  cohort: "2023",
  avatar: avatars[0],
  bio: "Một chút hướng nội, một chút mê cà phê. Mong tìm người cùng khám phá những điều nhỏ xinh sau giờ học.",
  interests: ["Cà phê", "Âm nhạc", "Nhiếp ảnh"],
  connectionGoal: "Mối quan hệ nghiêm túc",
  preferences: defaultPreferences,
};
export const candidates: Candidate[] = [
  {
    ...defaultProfile,
    id: "linh",
    fullName: "Trần Khánh Linh",
    birthDate: "2005-03-12",
    gender: "Nữ",
    faculty: "Truyền thông",
    cohort: "2024",
    avatar: avatars[1],
    bio: "Thích những buổi chiều có nắng, một ly cà phê ngon và những câu chuyện không có hồi kết. Cùng mình đi tìm quán cà phê mới nhé?",
    interests: ["Cà phê", "Nhiếp ảnh", "Du lịch"],
    verified: true,
    distanceKm: 2,
    likedMe: false,
  },
  {
    ...defaultProfile,
    id: "an",
    fullName: "Lê Hoài An",
    birthDate: "2004-06-21",
    gender: "Nữ",
    faculty: "Thiết kế",
    cohort: "2023",
    avatar: avatars[2],
    bio: "Mình vẽ những điều bình thường và nghe nhạc indie trên đường đến lớp. Đang tìm một người cùng đi triển lãm cuối tuần.",
    interests: ["Thiết kế", "Âm nhạc", "Cà phê"],
    verified: true,
    distanceKm: 3,
    likedMe: true,
  },
  {
    ...defaultProfile,
    id: "nam",
    fullName: "Phạm Hải Nam",
    birthDate: "2003-11-23",
    faculty: "Kinh tế",
    cohort: "2022",
    avatar: avatars[3],
    bio: "Chạy bộ buổi sáng, đọc sách buổi tối. Cuối tuần mình thường đi bộ quanh thành phố để chụp vài tấm ảnh.",
    interests: ["Chạy bộ", "Đọc sách", "Nhiếp ảnh"],
    verified: true,
    distanceKm: 4,
    likedMe: false,
  },
  {
    ...defaultProfile,
    id: "mai",
    fullName: "Vũ Ngọc Mai",
    birthDate: "2005-10-09",
    gender: "Nữ",
    faculty: "Ngoại ngữ",
    cohort: "2024",
    avatar: "/images/mai.jpg",
    bio: "Một người yêu điện ảnh và những món ăn tự nấu. Có bộ phim nào bạn muốn giới thiệu cho mình không?",
    interests: ["Điện ảnh", "Nấu ăn", "Du lịch"],
    verified: false,
    distanceKm: 6,
    likedMe: true,
  },
];
export function createInitialState(): DemoState {
  return {
    version: 1,
    session: false,
    profile: structuredClone(defaultProfile),
    interactions: {},
    conversations: [],
    notifications: [],
  };
}
export function candidateById(id: string): Candidate | undefined {
  return candidates.find((item) => item.id === id);
}
