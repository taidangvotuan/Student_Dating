import { describe, expect, it } from "vitest";
import { createInitialState } from "../mocks/data";
import { loadDemo, saveDemo } from "./storage";

describe("demo persistence boundary", () => {
  it("recovers safely from corrupt or outdated storage", () => {
    for (const raw of ["{", '{"version":0}', '{"version":1,"session":true}']) {
      expect(
        loadDemo({ getItem: () => raw, setItem: () => {} }).recovered,
      ).toBe(true);
    }
  });
  it("does not persist unknown fields such as a password", () => {
    let saved = "";
    const state = { ...createInitialState(), password: "never-save-this" };
    expect(
      saveDemo(
        {
          getItem: () => null,
          setItem: (_key, value) => {
            saved = value;
          },
        },
        state,
      ),
    ).toBe(true);
    expect(saved).not.toContain("password");
    expect(loadDemo({ getItem: () => saved, setItem: () => {} }).state).toEqual(
      createInitialState(),
    );
  });
  it("reports storage denial without crashing", () => {
    expect(
      saveDemo(
        {
          getItem: () => null,
          setItem: () => {
            throw Error("quota");
          },
        },
        createInitialState(),
      ),
    ).toBe(false);
  });
});
