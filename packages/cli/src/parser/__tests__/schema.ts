import { OpenAPIV3 } from "openapi-types";
import { parseSchema } from "../schema";
import * as gen from "io-ts-codegen";
import * as E from "fp-ts/Either";

describe("OpenAPI schema", () => {
  it("parses empty schema", () => {
    const schema: OpenAPIV3.SchemaObject = {};

    const result = parseSchema(schema);
    const expected = gen.unknownType;

    expect(result).toEqual(E.right(expected));
  });

  it("parses basic string schema", () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: "string",
    };

    const result = parseSchema(schema);
    const expected = gen.stringType;

    expect(result).toEqual(E.right(expected));
  });

  it("parses number schema", () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: "number",
    };

    const result = parseSchema(schema);
    const expected = gen.numberType;

    expect(result).toEqual(E.right(expected));
  });

  it("parses integer schema", () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: "integer",
    };

    const result = parseSchema(schema);
    const expected = gen.numberType;

    expect(result).toEqual(E.right(expected));
  });

  it("parses boolean schema", () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: "boolean",
    };

    const result = parseSchema(schema);
    const expected = gen.booleanType;

    expect(result).toEqual(E.right(expected));
  });

  it("parses basic array schema", () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: "array",
      items: {
        type: "string",
      },
    };

    const result = parseSchema(schema);
    const expected = gen.arrayCombinator(gen.stringType);

    expect(result).toEqual(E.right(expected));
  });

  it("parses empty array schema", () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: "array",
      items: {},
    };

    const result = parseSchema(schema);
    const expected = gen.arrayCombinator(gen.unknownType);

    expect(result).toEqual(E.right(expected));
  });

  it("parses basic object schema", () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: "object",
      properties: {
        name: {
          type: "string",
        },
        age: {
          type: "number",
        },
      },
      required: ["name"],
    };

    const result = parseSchema(schema);
    const expected = gen.typeCombinator([
      gen.property("name", gen.stringType, false),
      gen.property("age", gen.numberType, true),
    ]);

    expect(result).toEqual(E.right(expected));
  });

  it("parses empty object schema", () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: "object",
    };

    const result = parseSchema(schema);
    const expected = gen.unknownRecordType;

    expect(result).toEqual(E.right(expected));
  });

  it("parses string schema with date format", () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: "string",
      format: "date",
    };

    const result = parseSchema(schema);
    const expected = gen.customCombinator("Date", "DateFromISOString", [
      "DateFromISOString",
    ]);

    expect(result).toEqual(E.right(expected));
  });

  it("parses string schema with date-time format", () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: "string",
      format: "date-time",
    };

    const result = parseSchema(schema);
    const expected = gen.customCombinator("Date", "DateFromISOString", [
      "DateFromISOString",
    ]);

    expect(result).toEqual(E.right(expected));
  });

  it("parses string schema with multiple enums", () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: "string",
      enum: ["foo", "bar", "baz"],
    };

    const result = parseSchema(schema);
    const expected = gen.unionCombinator([
      gen.literalCombinator("foo"),
      gen.literalCombinator("bar"),
      gen.literalCombinator("baz"),
    ]);

    expect(result).toEqual(E.right(expected));
  });

  it("parses string schema with single enum", () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: "string",
      enum: ["foo"],
    };

    const result = parseSchema(schema);
    const expected = gen.literalCombinator("foo");

    expect(result).toEqual(E.right(expected));
  });

  it("parses allOf schema", () => {
    const schema: OpenAPIV3.SchemaObject = {
      allOf: [{ type: "string" }, { type: "number" }],
    };

    const result = parseSchema(schema);
    const expected = gen.intersectionCombinator([
      gen.stringType,
      gen.numberType,
    ]);

    expect(result).toEqual(E.right(expected));
  });

  it("parses oneOf schema", () => {
    const schema: OpenAPIV3.SchemaObject = {
      oneOf: [{ type: "string" }, { type: "number" }],
      readOnly: false,
    };

    const result = parseSchema(schema);
    const expected = gen.unionCombinator([gen.stringType, gen.numberType]);

    expect(result).toEqual(E.right(expected));
  });

  it("parses anyOf schema", () => {
    const schema: OpenAPIV3.SchemaObject = {
      anyOf: [{ type: "string" }, { type: "number" }],
      readOnly: false,
    };

    const result = parseSchema(schema);
    const expected = gen.unionCombinator([gen.stringType, gen.numberType]);

    expect(result).toEqual(E.right(expected));
  });

  it("parses a nullable schema", () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: "string",
      nullable: true,
    };

    const result = parseSchema(schema);
    const expected = gen.unionCombinator([gen.stringType, gen.nullType]);

    expect(result).toEqual(E.right(expected));
  });

  it("parses a nullable schema with allOf", () => {
    const schema: OpenAPIV3.SchemaObject = {
      nullable: true,
      allOf: [
        {
          type: "array",
          items: { type: "string" },
        },
      ],
    };

    const result = parseSchema(schema);
    const expected = gen.unionCombinator([
      gen.arrayCombinator(gen.stringType),
      gen.nullType,
    ]);

    expect(result).toEqual(E.right(expected));
  });
});
