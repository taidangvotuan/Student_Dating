import { prisma } from '../../src/database/prisma.js';

console.log('Seeding interests...');

const interests = [
    "Phát triển phần mềm",
    "Trí tuệ nhân tạo",
    "Gaming",
    "Thiết bị công nghệ",
    "Nhiếp ảnh",
    "Âm nhạc",
    "Phim",
    "Anime & Manga",
    "Văn học",
    "Sáng tạo nội dung",
    "Podcast",
    "Du lịch",
    "Thể thao điện tử",
    "Gym", 
    "Yoga & Thiền", 
    "Chạy bộ", 
    "Sức khỏe tinh thần", 
    "Đạp xe",
    "Nấu ăn", 
    "Làm bánh",
    "Du lịch bụi", 
    "Leo núi (Hiking)", 
    "Cắm trại", 
    "Phượt xe máy/ô tô", 
    "Lặn biển", 
    "Khám phá đô thị",
    "Thiết kế nội thất", 
    "Thời trang bền vững", 
    "Lối sống tối giản", 
    "Trồng cây/Làm vườn", 
    "Chăm sóc da (Skincare)", 
    "Đồ thủ công tự làm (DIY)",
    "Bóng đá", 
    "Bóng rổ", 
    "Tennis", 
    "Đua xe F1", 
    "Võ thuật", 
    "Golf", 
    "Ngoại ngữ", 
    "Lịch sử"
];

const seedInterests = await prisma.interest.createMany({
  data: interests.map((name) => ({ name })),
  skipDuplicates: true,
})

console.log('Seeding interests completed:', seedInterests.count, 'interests added.');