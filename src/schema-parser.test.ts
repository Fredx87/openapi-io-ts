import * as gen from "io-ts-codegen";
import { OpenAPIV3 } from "openapi-types";
import { ParserContext } from "./parser";
import { parseSchema, shouldGenerateModel } from "./schema-parser";

function toRuntime(
  schema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject
): string {
  const context: ParserContext = {
    document: { info: { title: "", version: "" }, openapi: "3", paths: {} },
    generatedModels: {
      namesMap: {},
      refNameMap: {}
    }
  };
  return gen.printRuntime(parseSchema(schema, context));
}

describe("Schema object parser", () => {
  describe("shouldGenerateModel", () => {
    test("models for base types should not be generated", () => {
      expect(shouldGenerateModel(gen.booleanType)).toBe(false);
      expect(shouldGenerateModel(gen.stringType)).toBe(false);
      expect(shouldGenerateModel(gen.numberType)).toBe(false);
      expect(shouldGenerateModel(gen.integerType)).toBe(false);
      expect(shouldGenerateModel(gen.intType)).toBe(false);
      expect(shouldGenerateModel(gen.nullType)).toBe(false);
      expect(shouldGenerateModel(gen.undefinedType)).toBe(false);
      expect(shouldGenerateModel(gen.unknownArrayType)).toBe(false);
      expect(shouldGenerateModel(gen.unknownRecordType)).toBe(false);
      expect(shouldGenerateModel(gen.unknownType)).toBe(false);
      expect(shouldGenerateModel(gen.literalCombinator("foo"))).toBe(false);
      expect(shouldGenerateModel(gen.identifier("foo"))).toBe(false);
    });

    test("model for iterface should be generated", () => {
      expect(
        shouldGenerateModel(
          gen.interfaceCombinator([gen.property("foo", gen.stringType)])
        )
      ).toBe(true);
    });

    test("model for array with basic types should not be generated", () => {
      expect(shouldGenerateModel(gen.arrayCombinator(gen.stringType))).toBe(
        false
      );
      expect(
        shouldGenerateModel(
          gen.arrayCombinator(gen.arrayCombinator(gen.booleanType))
        )
      ).toBe(false);
    });

    test("model for array with complex type should be generated", () => {
      expect(
        shouldGenerateModel(
          gen.arrayCombinator(
            gen.interfaceCombinator([gen.property("foo", gen.stringType)])
          )
        )
      ).toBe(true);
    });

    test("model for instersection with basic types should not be generated", () => {
      expect(
        shouldGenerateModel(
          gen.intersectionCombinator([gen.stringType, gen.intType])
        )
      ).toBe(false);
    });

    test("model for instersection with complex types should not be generated", () => {
      expect(
        shouldGenerateModel(
          gen.intersectionCombinator([
            gen.interfaceCombinator([gen.property("foo", gen.stringType)]),
            gen.intType
          ])
        )
      ).toBe(true);
      expect(
        shouldGenerateModel(
          gen.intersectionCombinator([
            gen.interfaceCombinator([gen.property("foo", gen.stringType)]),
            gen.interfaceCombinator([gen.property("bar", gen.booleanType)])
          ])
        )
      ).toBe(true);
    });

    test("model for union with basic types should not be generated", () => {
      expect(
        shouldGenerateModel(gen.unionCombinator([gen.stringType, gen.intType]))
      ).toBe(false);
    });

    test("model for union with complex types should not be generated", () => {
      expect(
        shouldGenerateModel(
          gen.unionCombinator([
            gen.interfaceCombinator([gen.property("foo", gen.stringType)]),
            gen.intType
          ])
        )
      ).toBe(true);
      expect(
        shouldGenerateModel(
          gen.unionCombinator([
            gen.interfaceCombinator([gen.property("foo", gen.stringType)]),
            gen.interfaceCombinator([gen.property("bar", gen.booleanType)])
          ])
        )
      ).toBe(true);
    });
  });

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

  test("free object parser", () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: "object"
    };
    expect(toRuntime(schema)).toMatchInlineSnapshot(`"t.UnknownRecord"`);
  });
});
