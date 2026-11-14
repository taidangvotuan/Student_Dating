import { test, expect, type Page, type TestInfo } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function demo(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Trải nghiệm demo" }).click();
  await expect(
    page.getByRole("heading", { name: /Gặp một người cùng nhịp/ }),
  ).toBeVisible();
}
async function nav(page: Page, name: string) {
  await page
    .getByRole("navigation", { name: "Điều hướng chính" })
    .getByRole("link", { name: new RegExp(`^${name}`) })
    .click();
}
async function audit(page: Page) {
  await expect(page.locator("main")).toBeVisible();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    results.violations.map((item) => ({
      id: item.id,
      nodes: item.nodes.map((node) => ({
        target: node.target,
        reason: node.failureSummary,
      })),
    })),
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(
    await page
      .locator("img")
      .evaluateAll((images) =>
        images.every((img) => img.complete && img.naturalWidth > 0),
      ),
  ).toBe(true);
}
async function shot(page: Page, info: TestInfo, name: string) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: info.outputPath(`${name}.png`),
    fullPage: true,
  });
}

test("full demo acceptance, accessibility and persistence", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/login");
  await audit(page);
  await shot(page, info, "login");
  await page.getByRole("button", { name: "Trải nghiệm demo" }).click();
  await audit(page);
  await shot(page, info, "discovery");
  await page.getByRole("button", { name: "Xem hồ sơ", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Trần Khánh Linh");
  await page.getByRole("button", { name: "Đóng hộp thoại" }).click();
  await page
    .getByRole("button", { name: "Thích Trần Khánh Linh", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: /Lê Hoài An/ })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Thích Lê Hoài An", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("đã ghép đôi");
  await shot(page, info, "match");
  await page.getByRole("button", { name: "Bắt đầu trò chuyện" }).click();
  await expect(page).toHaveURL(/\/chat\/conversation-an$/);
  await page
    .getByLabel("Tin nhắn của bạn")
    .fill("Chào An! Cuối tuần mình cùng đi cà phê nhé?");
  await page.getByRole("button", { name: "Gửi tin nhắn", exact: true }).click();
  await expect(page.getByRole("log")).toContainText(
    "Chào An! Cuối tuần mình cùng đi cà phê nhé?",
  );
  await audit(page);
  await shot(page, info, "chat");
  await page.reload();
  await expect(page.getByRole("log")).toContainText(
    "Chào An! Cuối tuần mình cùng đi cà phê nhé?",
  );
  if (info.project.name === "mobile") {
    await page
      .getByRole("link", { name: "Quay lại danh sách trò chuyện" })
      .click();
    await expect(
      page.getByRole("region", { name: "Danh sách hội thoại" }),
    ).toBeVisible();
    await page.getByRole("link", { name: /Lê Hoài An/ }).click();
  }
  await nav(page, "Thông báo");
  await expect(
    page.getByRole("button", { name: /Bạn có một kết nối mới!/ }),
  ).toContainText("Chưa đọc");
  await audit(page);
  await shot(page, info, "notifications");
  await page.getByRole("button", { name: /Bạn có một kết nối mới!/ }).click();
  await expect(page).toHaveURL(/\/chat\/conversation-an$/);
  await nav(page, "Thông báo");
  await expect(
    page.getByRole("button", { name: /Bạn có một kết nối mới!/ }),
  ).toContainText("Đã đọc");
  await expect(
    page
      .getByRole("navigation")
      .getByRole("link", { name: "Thông báo", exact: true }),
  ).toBeVisible();
  await nav(page, "Hồ sơ");
  await page
    .getByLabel("Giới thiệu bản thân", { exact: true })
    .fill("Mình thích cà phê, nhạc indie và những buổi chiều bình yên.");
  await page.getByRole("button", { name: "Du lịch", exact: true }).click();
  await page.getByRole("button", { name: "Lưu hồ sơ", exact: true }).click();
  await expect(
    page.getByText("Đã lưu thành công", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByLabel("Giới thiệu bản thân", { exact: true }),
  ).toHaveValue("Mình thích cà phê, nhạc indie và những buổi chiều bình yên.");
  await expect(
    page.getByRole("button", { name: "Du lịch", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await audit(page);
  await shot(page, info, "profile");
  expect(errors).toEqual([]);
});

test("block cancellation, keyboard focus, filtering and exhausted discovery", async ({
  page,
}) => {
  await demo(page);
  const block = page.getByRole("button", {
    name: "Chặn Trần Khánh Linh",
    exact: true,
  });
  await block.click();
  await page.getByRole("button", { name: "Hủy, giữ hồ sơ" }).click();
  await expect(
    page.getByRole("heading", { name: /Trần Khánh Linh/ }),
  ).toBeVisible();
  await expect(block).toBeFocused();
  await block.click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(block).toBeFocused();
  await page.getByRole("button", { name: /^Bộ lọc/ }).click();
  await page.getByLabel("Tuổi tối thiểu").fill("24");
  await page.getByLabel("Tuổi tối đa").fill("18");
  await page.getByRole("button", { name: "Áp dụng bộ lọc" }).click();
  await expect(page.getByRole("alert")).toContainText("Tuổi tối thiểu");
  await page.getByLabel("Tuổi tối thiểu").fill("99");
  await page.getByLabel("Tuổi tối đa").fill("100");
  await page.getByRole("button", { name: "Áp dụng bộ lọc" }).click();
  await expect(
    page.getByRole("heading", { name: "Bạn đã gặp hết gợi ý hôm nay" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Điều chỉnh bộ lọc" }).click();
  await page.getByRole("button", { name: "Đặt mặc định" }).click();
  await page.getByRole("button", { name: "Áp dụng bộ lọc" }).click();
  await block.click();
  await page.getByRole("button", { name: "Xác nhận chặn" }).click();
  await page.reload();
  await expect(page.getByRole("heading", { name: /Lê Hoài An/ })).toBeVisible();
});

test("empty chats and notifications, and clearing read notifications", async ({
  page,
}) => {
  await demo(page);
  await nav(page, "Trò chuyện");
  await expect(
    page.getByRole("heading", { name: "Câu chuyện đầu tiên đang chờ bạn" }),
  ).toBeVisible();
  await nav(page, "Thông báo");
  await expect(
    page.getByRole("heading", { name: "Một chút yên tĩnh cũng thật dễ chịu" }),
  ).toBeVisible();
  await nav(page, "Khám phá");
  await page.getByRole("button", { name: "Bỏ qua Trần Khánh Linh" }).click();
  await page
    .getByRole("button", { name: "Thích Lê Hoài An", exact: true })
    .click();
  await page.getByRole("button", { name: "Tiếp tục khám phá" }).click();
  await nav(page, "Thông báo");
  await page.getByRole("button", { name: "Đọc tất cả" }).click();
  await page.getByRole("button", { name: /^Chưa đọc/ }).click();
  await expect(
    page.getByRole("heading", { name: "Bạn đã đọc hết thông báo" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /^Tất cả/ }).click();
  await page
    .getByRole("button", { name: "Ẩn thông báo từ Lê Hoài An" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Một chút yên tĩnh cũng thật dễ chịu" }),
  ).toBeVisible();
});

test("registration validation, adult setup and password exclusion", async ({
  page,
}) => {
  await page.goto("/register");
  await page.getByRole("button", { name: "Tạo hồ sơ demo" }).click();
  await expect(
    page.getByText("Sử dụng email sinh viên có đuôi .edu.vn."),
  ).toBeVisible();
  await page.getByLabel("Họ và tên", { exact: true }).fill("Đỗ Thanh Hà");
  await page.getByLabel("Email sinh viên").fill("24520002@gm.uit.edu.vn");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("DemoOnly123!");
  await page.getByLabel("Ngày sinh", { exact: true }).fill("2020-01-01");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Tạo hồ sơ demo" }).click();
  await expect(
    page.getByText("Student Dating dành cho sinh viên từ 18 đến 100 tuổi."),
  ).toBeVisible();
  await page.getByLabel("Ngày sinh", { exact: true }).fill("2004-02-29");
  await page.getByRole("button", { name: "Tạo hồ sơ demo" }).click();
  await expect(
    page.getByRole("heading", { name: /Làm quen một chút nhé/ }),
  ).toBeVisible();
  await expect(page.getByLabel("Họ và tên", { exact: true })).toHaveValue(
    "Đỗ Thanh Hà",
  );
  const persisted = await page.evaluate(() =>
    localStorage.getItem("student-dating:demo:v1"),
  );
  expect(persisted).not.toContain("DemoOnly123!");
  expect(persisted).not.toContain("password");
  await audit(page);
});

test("two matches route each notification to its own conversation", async ({
  page,
}) => {
  await demo(page);
  await page.getByRole("button", { name: "Bỏ qua Trần Khánh Linh" }).click();
  await page
    .getByRole("button", { name: "Thích Lê Hoài An", exact: true })
    .click();
  await page.getByRole("button", { name: "Tiếp tục khám phá" }).click();
  await page.getByRole("button", { name: "Bỏ qua Phạm Hải Nam" }).click();
  await page
    .getByRole("button", { name: "Thích Vũ Ngọc Mai", exact: true })
    .click();
  await page.getByRole("button", { name: "Tiếp tục khám phá" }).click();
  await nav(page, "Thông báo");
  await page
    .getByRole("button", { name: /Bạn có một kết nối mới! Lê Hoài An/ })
    .click();
  await expect(page).toHaveURL(/\/chat\/conversation-an$/);
  await nav(page, "Thông báo");
  await expect(
    page.getByRole("button", { name: /Bạn có một kết nối mới! Vũ Ngọc Mai/ }),
  ).toContainText("Chưa đọc");
  await page
    .getByRole("button", { name: /Bạn có một kết nối mới! Vũ Ngọc Mai/ })
    .click();
  await expect(page).toHaveURL(/\/chat\/conversation-mai$/);
});
