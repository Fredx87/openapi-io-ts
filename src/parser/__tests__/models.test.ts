import * as E from "fp-ts/lib/Either";
import { newIORef } from "fp-ts/lib/IORef";
import { pipe } from "fp-ts/lib/pipeable";
import * as TE from "fp-ts/lib/TaskEither";
import * as gen from "io-ts-codegen";
import { OpenAPIV3 } from "openapi-types";
import { Environment } from "../../environment";
import { parseSchema } from "../models";
import { parserState } from "../parserState";

async function toRuntime(
  name: string,
  schema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject,
  env: Environment
): Promise<E.Either<string, string>> {
  return pipe(
    parseSchema(`#/components/schemas/${name}`, name, schema)(env),
    TE.map(res => gen.printRuntime(res))
  )();
}

describe("Schema object parser", () => {
  let env: Environment;

  beforeEach(() => {
    env = {
      inputFile: "",
      outputDir: "",
      parseDocument: jest.fn(),
      parserState: newIORef(parserState())()
    };
  });

  test("base string parser", async () => {
    const schema: OpenAPIV3.SchemaObject = { type: "string" };
    const result = await toRuntime("string", schema, env);
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
    const result = await toRuntime("foos", schema, env);
    expect(result).toMatchInlineSnapshot(`
      Object {
        "_tag": "Right",
        "right": "models.FoosEnum",
      }
    `);
  });

  test("date string parser", async () => {
    const schema: OpenAPIV3.SchemaObject = { type: "string", format: "date" };
    const result = await toRuntime("date", schema, env);
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
      format: "date-time"
    };
    const result = await toRuntime("dateTime", schema, env);
    expect(result).toMatchInlineSnapshot(`
      Object {
        "_tag": "Right",
        "right": "models.DateFromISOString",
      }
    `);
  });

  test("integer parser", async () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: "integer"
    };
    const result = await toRuntime("int", schema, env);
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
    const result = await toRuntime("number", schema, env);
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
    const result = await toRuntime("boolean", schema, env);
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
    const result = await toRuntime("strings", schema, env);
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
    const result = await toRuntime("numbers", schema, env);
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
    const result = await toRuntime("Pet", schema, env);
    expect(result).toMatchInlineSnapshot(`
      Object {
        "_tag": "Right",
        "right": "models.Pet",
      }
    `);
  });

  test("free object parser", async () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: "object"
    };
    const result = await toRuntime("unknown", schema, env);
    expect(result).toMatchInlineSnapshot(`
      Object {
        "_tag": "Right",
        "right": "t.UnknownRecord",
      }
    `);
  });
});
