import { pascalCase } from "./utils";

describe("pascalCase", () => {
  test("base string parser", () => {
    const pascal = pascalCase("string");
    expect(pascal).toBe("String");
  });
});
