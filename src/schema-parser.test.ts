import * as gen from "io-ts-codegen";
import { OpenAPIV3 } from "openapi-types";
import { parseSchema } from "./schema-parser";

function toRuntime(schema: OpenAPIV3.SchemaObject): string {
  return gen.printRuntime(parseSchema(schema));
}

describe("Schema object parser", () => {
  test("base string parser", () => {
    const schema: OpenAPIV3.SchemaObject = { type: "string" };
    expect(toRuntime(schema)).toMatchInlineSnapshot(`"t.string"`);
  });

  test("enum string parser", () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: "string",
      enum: ["foo", "bar", "baz"]
    };
    expect(toRuntime(schema)).toMatchInlineSnapshot(`
      "t.union([
        t.literal('foo'),
        t.literal('bar'),
        t.literal('baz')
      ])"
    `);
  });

  test("date string parser", () => {
    const schema: OpenAPIV3.SchemaObject = { type: "string", format: "date" };
    expect(toRuntime(schema)).toMatchInlineSnapshot(`"DateFromISOString"`);
  });

  test("date-time string parser", () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: "string",
      format: "date-time"
    };
    expect(toRuntime(schema)).toMatchInlineSnapshot(`"DateFromISOString"`);
  });

  test("integer parser", () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: "integer"
    };
    expect(toRuntime(schema)).toMatchInlineSnapshot(`"t.Integer"`);
  });

  test("number parser", () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: "number"
    };
    expect(toRuntime(schema)).toMatchInlineSnapshot(`"t.number"`);
  });

  test("boolean parser", () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: "boolean"
    };
    expect(toRuntime(schema)).toMatchInlineSnapshot(`"t.boolean"`);
  });

  test("string array parser", () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: "array",
      items: { type: "string" }
    };
    expect(toRuntime(schema)).toMatchInlineSnapshot(`"t.array(t.string)"`);
  });

  test("number array parser", () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: "array",
      items: { type: "number" }
    };
    expect(toRuntime(schema)).toMatchInlineSnapshot(`"t.array(t.number)"`);
  });

  test("object parser", () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: "object",
      properties: {
        id: {
          type: "integer"
        },
        petId: {
          type: "integer"
        },
        quantity: {
          type: "integer"
        },
        shipDate: {
          type: "string",
          format: "date-time"
        },
        status: {
          type: "string",
          enum: ["placed", "approved", "delivered"]
        },
        complete: {
          type: "boolean"
        }
      },
      required: ["id"]
    };
    expect(toRuntime(schema)).toMatchInlineSnapshot(`
      "t.intersection([
        t.type({
          id: t.Integer
        }),
        t.partial({
          petId: t.Integer,
          quantity: t.Integer,
          shipDate: DateFromISOString,
          status: t.union([
            t.literal('placed'),
            t.literal('approved'),
            t.literal('delivered')
          ]),
          complete: t.boolean
        })
      ])"
    `);
  });

  test("free objecy parser", () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: "object"
    };
    expect(toRuntime(schema)).toMatchInlineSnapshot(`"t.UnknownRecord"`);
  });
});
