import assert from "assert";
import * as E from "fp-ts/Either";
import { newIORef } from "fp-ts/IORef";
import * as gen from "io-ts-codegen";
import { OpenAPIV3 } from "openapi-types";
import { parseApiResponses } from "../apis";
import { ParserContext } from "../context";
import { ApiResponse, parserState } from "../parserState";

function createContext(operation: OpenAPIV3.OperationObject): ParserContext {
  const state = parserState();
  state.document.paths = {
    "/pet": {
      get: operation,
    },
  };
  state.models["#/components/schemas/User"] = gen.typeDeclaration(
    "User",
    gen.unknownRecordType
  );

  return {
    inputFile: "",
    outputDir: "",
    parseDocument: jest.fn(),
    parserState: newIORef(state)(),
  };
}

describe("path-parser", () => {
  describe("responses parser", () => {
    let context: ParserContext;
    const basePointer = "#/paths/~1pet/get";

    test("should return empty array on operation without responses", async () => {
      const input: OpenAPIV3.OperationObject = {
        responses: undefined,
      };
      context = createContext(input);

      const result = await parseApiResponses(basePointer, input)(context)();
      const expected: ApiResponse[] = [];
      expect(result).toEqual(E.right(expected));
    });

    test("should return empty array on responses without content", async () => {
      const input: OpenAPIV3.OperationObject = {
        responses: {
          "400": {
            description: "Invalid ID supplied",
          },
          "404": {
            description: "Order not found",
          },
        },
      };
      context = createContext(input);

      const result = await parseApiResponses(basePointer, input)(context)();
      const expected: ApiResponse[] = [];
      expect(result).toEqual(E.right(expected));
    });

    test("should return only the response with schema and mediaType application/json", async () => {
      const input: OpenAPIV3.OperationObject = {
        responses: {
          "200": {
            description: "successful operation",
            content: {
              "application/json": {
                schema: {
                  type: "string",
                },
              },
              "application/xml": {
                schema: {
                  type: "string",
                },
              },
            },
          },
          "400": {
            description: "Invalid username/password supplied",
          },
        },
      };
      context = createContext(input);

      const result = await parseApiResponses(basePointer, input)(context)();
      const expected: ApiResponse[] = [
        { code: "200", mediaType: "application/json", type: gen.stringType },
      ];
      expect(result).toEqual(E.right(expected));
    });

    test("should return only the response with referenced schema and mediaType application/json", async () => {
      const input: OpenAPIV3.OperationObject = {
        responses: {
          "200": {
            description: "successful operation",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/User",
                },
              },
              "application/xml": {
                schema: {
                  $ref: "#/components/schemas/User",
                },
              },
            },
          },
          "400": {
            description: "Invalid username supplied",
          },
          "404": {
            description: "User not found",
          },
        },
      };
      context = createContext(input);

      const result = await parseApiResponses(basePointer, input)(context)();
      const expected: ApiResponse[] = [
        {
          code: "200",
          mediaType: "application/json",
          type: gen.customCombinator("models.User", "models.User"),
        },
      ];
      expect(result).toEqual(E.right(expected));
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
                      type: "string",
                    },
                    baz: {
                      type: "number",
                    },
                  },
                },
              },
              "application/xml": {
                schema: {
                  $ref: "#/components/schemas/User",
                },
              },
            },
          },
          "400": {
            description: "Invalid username supplied",
          },
          "404": {
            description: "User not found",
          },
        },
      };
      context = createContext(input);

      const result = await parseApiResponses(basePointer, input)(context)();
      const expected: ApiResponse[] = [
        {
          code: "200",
          mediaType: "application/json",
          type: gen.customCombinator(
            "models.FooResponse200",
            "models.FooResponse200"
          ),
        },
      ];
      expect(result).toEqual(E.right(expected));
      const models = context.parserState.read().models;
      const expectedPointer = `${basePointer}/responses/200/content/application~1json/schema`;
      assert(expectedPointer in models);
      expect(models[expectedPointer]).toMatchInlineSnapshot(`
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
