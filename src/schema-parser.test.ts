import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/pipeable";
import * as TE from "fp-ts/lib/TaskEither";
import * as gen from "io-ts-codegen";
import { OpenAPIV3 } from "openapi-types";
import { parserContext } from "./parser-context";
import { parseSchema, shouldGenerateModel } from "./schema-parser";

async function toRuntime(
  schema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject
): Promise<E.Either<string, string>> {
  const context = parserContext("", "");
  return pipe(
    parseSchema(schema)(context),
    TE.map(res => gen.printRuntime(res[0]))
  )();
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

  test("base string parser", async () => {
    const schema: OpenAPIV3.SchemaObject = { type: "string" };
    const result = await toRuntime(schema);
    expect(result).toMatchInlineSnapshot(`
      Object {
        "_tag": "Right",
        "right": "t.string",
      }
    `);
  });

  test("enum string parser", async () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: "string",
      enum: ["foo", "bar", "baz"]
    };
    const result = await toRuntime(schema);
    expect(result).toMatchInlineSnapshot(`
      Object {
        "_tag": "Right",
        "right": "t.union([
        t.literal('foo'),
        t.literal('bar'),
        t.literal('baz')
      ])",
      }
    `);
  });

  test("date string parser", async () => {
    const schema: OpenAPIV3.SchemaObject = { type: "string", format: "date" };
    const result = await toRuntime(schema);
    expect(result).toMatchInlineSnapshot(`
      Object {
        "_tag": "Right",
        "right": "DateFromISOString",
      }
    `);
  });

  test("date-time string parser", async () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: "string",
      format: "date-time"
    };
    const result = await toRuntime(schema);
    expect(result).toMatchInlineSnapshot(`
      Object {
        "_tag": "Right",
        "right": "DateFromISOString",
      }
    `);
  });

  test("integer parser", async () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: "integer"
    };
    const result = await toRuntime(schema);
    expect(result).toMatchInlineSnapshot(`
      Object {
        "_tag": "Right",
        "right": "t.Integer",
      }
    `);
  });

  test("number parser", async () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: "number"
    };
    const result = await toRuntime(schema);
    expect(result).toMatchInlineSnapshot(`
      Object {
        "_tag": "Right",
        "right": "t.number",
      }
    `);
  });

  test("boolean parser", async () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: "boolean"
    };
    const result = await toRuntime(schema);
    expect(result).toMatchInlineSnapshot(`
      Object {
        "_tag": "Right",
        "right": "t.boolean",
      }
    `);
  });

  test("string array parser", async () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: "array",
      items: { type: "string" }
    };
    const result = await toRuntime(schema);
    expect(result).toMatchInlineSnapshot(`
      Object {
        "_tag": "Right",
        "right": "t.array(t.string)",
      }
    `);
  });

  test("number array parser", async () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: "array",
      items: { type: "number" }
    };
    const result = await toRuntime(schema);
    expect(result).toMatchInlineSnapshot(`
      Object {
        "_tag": "Right",
        "right": "t.array(t.number)",
      }
    `);
  });

  test("object parser", async () => {
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
    const result = await toRuntime(schema);
    expect(result).toMatchInlineSnapshot(`
      Object {
        "_tag": "Right",
        "right": "t.intersection([
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
      ])",
      }
    `);
  });

  test("free object parser", async () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: "object"
    };
    const result = await toRuntime(schema);
    expect(result).toMatchInlineSnapshot(`
      Object {
        "_tag": "Right",
        "right": "t.UnknownRecord",
      }
    `);
  });
});
