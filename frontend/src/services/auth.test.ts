import { expect, it } from "vitest";
import { validateAuth } from "./auth";

const valid = {
  email: "24520001@gm.uit.edu.vn",
  password: "Demo12345",
  fullName: "Nguyễn Nhật Minh",
  birthDate: "2004-08-19",
  accepted: true,
};
it("requires student email and a password", () => {
  expect(
    validateAuth({ ...valid, email: "a@gmail.com", password: "123" }, false),
  ).toMatchObject({ email: expect.any(String), password: expect.any(String) });
});
it("requires real calendar dates and adult age at signup", () => {
  for (const birthDate of ["2020-01-01", "2004-02-31", "2090-01-01", ""]) {
    expect(validateAuth({ ...valid, birthDate }, true).birthDate).toBeTruthy();
  }
});
it("requires name and consent only for signup", () => {
  expect(
    validateAuth({ ...valid, fullName: "", accepted: false }, true),
  ).toMatchObject({
    fullName: expect.any(String),
    accepted: expect.any(String),
  });
  expect(validateAuth(valid, true)).toEqual({});
});
