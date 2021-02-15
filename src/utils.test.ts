import * as E from "fp-ts/Either";
import { pascalCase, pointerToPath } from "./utils";

describe("utils", () => {
  describe("pascalCase", () => {
    test("base string parser", () => {
      const pascal = pascalCase("string");
      expect(pascal).toBe("String");
    });
  });

  describe("pointerToPath", () => {
    test("base pointer to path", () => {
      const pointer = "#/components/schemas/User";

      const result = pointerToPath(pointer);
      const expected = E.right(["components", "schemas", "User"]);

      expect(result).toEqual(expected);
    });

    test("encoded pointer to path", () => {
      const pointer = "#/paths/~1store/get";

      const result = pointerToPath(pointer);
      const expected = E.right(["paths", "/store", "get"]);

      expect(result).toEqual(expected);
    });
  });
});
