import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import { newIORef } from "fp-ts/IORef";
import * as TE from "fp-ts/TaskEither";
import * as gen from "io-ts-codegen";
import { OpenAPIV3 } from "openapi-types";
import { ParserContext } from "../context";
import { parseSchema, simplifyModelName } from "../models";
import { parserState } from "../parserState";

async function toRuntime(
  name: string,
  schema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject,
  context: ParserContext
): Promise<E.Either<string, string>> {
  return pipe(
    parseSchema(`#/components/schemas/${name}`, name, schema)(context),
    TE.map((res) => gen.printRuntime(res))
  )();
}

describe("Schema object parser", () => {
  let context: ParserContext;

  beforeEach(() => {
    context = {
      inputFile: "",
      outputDir: "",
      parseDocument: jest.fn(),
      parserState: newIORef(parserState())(),
    };
  });

  test("base string parser", async () => {
    const schema: OpenAPIV3.SchemaObject = { type: "string" };
    const result = await toRuntime("string", schema, context);
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
      enum: ["foo", "bar", "baz"],
    };
    const result = await toRuntime("foos", schema, context);
    expect(result).toMatchInlineSnapshot(`
      Object {
        "_tag": "Right",
        "right": "models.Foos",
      }
    `);
  });

  test("date string parser", async () => {
    const schema: OpenAPIV3.SchemaObject = { type: "string", format: "date" };
    const result = await toRuntime("date", schema, context);
    expect(result).toMatchInlineSnapshot(`
      Object {
        "_tag": "Right",
        "right": "models.DateFromISOString",
      }
    `);
  });

  test("date-time string parser", async () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: "string",
      format: "date-time",
    };
    const result = await toRuntime("dateTime", schema, context);
    expect(result).toMatchInlineSnapshot(`
      Object {
        "_tag": "Right",
        "right": "models.DateFromISOString",
      }
    `);
  });

  test("integer parser", async () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: "integer",
    };
    const result = await toRuntime("int", schema, context);
    expect(result).toMatchInlineSnapshot(`
      Object {
        "_tag": "Right",
        "right": "t.Integer",
      }
    `);
  });

  test("number parser", async () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: "number",
    };
    const result = await toRuntime("number", schema, context);
    expect(result).toMatchInlineSnapshot(`
      Object {
        "_tag": "Right",
        "right": "t.number",
      }
    `);
  });

  test("boolean parser", async () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: "boolean",
    };
    const result = await toRuntime("boolean", schema, context);
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
      items: { type: "string" },
    };
    const result = await toRuntime("strings", schema, context);
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
      items: { type: "number" },
    };
    const result = await toRuntime("numbers", schema, context);
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
          type: "integer",
        },
        petId: {
          type: "integer",
        },
        quantity: {
          type: "integer",
        },
        shipDate: {
          type: "string",
          format: "date-time",
        },
        status: {
          type: "string",
          enum: ["placed", "approved", "delivered"],
        },
        complete: {
          type: "boolean",
        },
      },
      required: ["id"],
    };
    const result = await toRuntime("Pet", schema, context);
    expect(result).toMatchInlineSnapshot(`
      Object {
        "_tag": "Right",
        "right": "models.Pet",
      }
    `);
  });

  test("free object parser", async () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: "object",
    };
    const result = await toRuntime("unknown", schema, context);
    expect(result).toMatchInlineSnapshot(`
      Object {
        "_tag": "Right",
        "right": "t.UnknownRecord",
      }
    `);
  });

  test("simplify model name for a schema", () => {
    const result = simplifyModelName(
      "#/components/schemas/Model",
      "LongGeneratedName"
    );
    expect(result).toBe("Model");
  });

  test("not simplify model name for a schema property", () => {
    const result = simplifyModelName(
      "#/components/schemas/Model/status",
      "LongGeneratedName"
    );
    expect(result).toBe("LongGeneratedName");
  });

  test("not simplify model name for a generic item", () => {
    const result = simplifyModelName(
      "#/paths/~1pot/get/parameters/status",
      "LongGeneratedName"
    );
    expect(result).toBe("LongGeneratedName");
  });
});
