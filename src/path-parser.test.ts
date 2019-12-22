import assert from "assert";
import * as E from "fp-ts/lib/Either";
import * as gen from "io-ts-codegen";
import { OpenAPIV3 } from "openapi-types";
import { ApiResponse, parserContext, ParserContext } from "./parser-context";
import { parseApiResponses } from "./path-parser";
import { assertIsRight } from "./utils";

async function parseApiResponsesResult(
  input: OpenAPIV3.OperationObject
): Promise<E.Either<string, [ApiResponse[], ParserContext]>> {
  const context = parserContext("", "");
  context.generatedModels.namesMap["User"] = gen.typeDeclaration(
    "User",
    gen.unknownRecordType
  );
  context.generatedModels.refNameMap["#/components/schemas/User"] = "User";
  return parseApiResponses(input)(context)();
}

describe("path-parser", () => {
  describe("responses parser", () => {
    test("should return empty array on operation without responses", async () => {
      const input: OpenAPIV3.OperationObject = {
        responses: undefined
      };
      const result = await parseApiResponsesResult(input);
      const expected: ApiResponse[] = [];
      assertIsRight(result);
      assert.deepStrictEqual(result.right[0], expected);
    });

    test("should return empty array on responses without content", async () => {
      const input: OpenAPIV3.OperationObject = {
        responses: {
          "400": {
            description: "Invalid ID supplied"
          },
          "404": {
            description: "Order not found"
          }
        }
      };
      const result = await parseApiResponsesResult(input);
      const expected: ApiResponse[] = [];
      assertIsRight(result);
      assert.deepStrictEqual(result.right[0], expected);
    });

    test("should return only the response with schema and mediaType application/json", async () => {
      const input: OpenAPIV3.OperationObject = {
        responses: {
          "200": {
            description: "successful operation",
            content: {
              "application/json": {
                schema: {
                  type: "string"
                }
              },
              "application/xml": {
                schema: {
                  type: "string"
                }
              }
            }
          },
          "400": {
            description: "Invalid username/password supplied"
          }
        }
      };
      const result = await parseApiResponsesResult(input);
      const expected: ApiResponse[] = [
        { code: "200", mediaType: "application/json", type: gen.stringType }
      ];
      assertIsRight(result);
      assert.deepStrictEqual(result.right[0], expected);
    });

    test("should return only the response with referenced schema and mediaType application/json", async () => {
      const input: OpenAPIV3.OperationObject = {
        responses: {
          "200": {
            description: "successful operation",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/User"
                }
              },
              "application/xml": {
                schema: {
                  $ref: "#/components/schemas/User"
                }
              }
            }
          },
          "400": {
            description: "Invalid username supplied"
          },
          "404": {
            description: "User not found"
          }
        }
      };
      const result = await parseApiResponsesResult(input);
      const expected: ApiResponse[] = [
        {
          code: "200",
          mediaType: "application/json",
          type: gen.identifier("User")
        }
      ];
      assertIsRight(result);
      assert.deepStrictEqual(result.right[0], expected);
    });

    test("should return only the response with complex schema and should generate model", async () => {
      const input: OpenAPIV3.OperationObject = {
        operationId: "foo",
        responses: {
          "200": {
            description: "successful operation",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    bar: {
                      type: "string"
                    },
                    baz: {
                      type: "number"
                    }
                  }
                }
              },
              "application/xml": {
                schema: {
                  $ref: "#/components/schemas/User"
                }
              }
            }
          },
          "400": {
            description: "Invalid username supplied"
          },
          "404": {
            description: "User not found"
          }
        }
      };
      const result = await parseApiResponsesResult(input);
      const expected: ApiResponse[] = [
        {
          code: "200",
          mediaType: "application/json",
          type: gen.identifier("FooResponse200")
        }
      ];
      assertIsRight(result);
      assert.deepStrictEqual(result.right[0], expected);
      assert("FooResponse200" in result.right[1].generatedModels.namesMap);
      expect(result.right[1].generatedModels.namesMap["FooResponse200"])
        .toMatchInlineSnapshot(`
        Object {
          "description": undefined,
          "isExported": true,
          "isReadonly": false,
          "kind": "TypeDeclaration",
          "name": "FooResponse200",
          "type": Object {
            "kind": "InterfaceCombinator",
            "name": undefined,
            "properties": Array [
              Object {
                "description": undefined,
                "isOptional": false,
                "key": "bar",
                "kind": "Property",
                "type": Object {
                  "kind": "StringType",
                  "name": "string",
                },
              },
              Object {
                "description": undefined,
                "isOptional": false,
                "key": "baz",
                "kind": "Property",
                "type": Object {
                  "kind": "NumberType",
                  "name": "number",
                },
              },
            ],
          },
        }
      `);
    });
  });
});
