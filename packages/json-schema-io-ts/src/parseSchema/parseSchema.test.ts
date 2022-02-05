import * as E from "fp-ts/Either";
import * as gen from "io-ts-codegen";
import {
  createSchemaContext,
  ParseSchemaContext,
  UriDocumentMap,
} from "./ParseSchemaContext";
import { ParsableDocument, NonArraySchemaObject } from "./types";
import { parseSchema } from "./parseSchema";
import { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";
import { ModelGenerationInfoFn } from "./modelGeneration";

const SINGLE_DOCUMENT_ROOT_URI = "/tmp/canned-schema.json";
const EXPECTED_SINGLE_DOCUMENT_MODEL_NAME = "CannedSchema";

describe("parseSchema", () => {
  it("should parse an empty schema", async () => {
    const document: ParsableDocument = {};
    const context = createContextFromSingleDocument(document);

    const result = await parseSchema("#")(context)();
    const expected = gen.unknownType;

    expect(result).toEqual(E.right(expected));
  });

  it("should parse a basic string schema", async () => {
    const document: ParsableDocument = { type: "string" };
    const context = createContextFromSingleDocument(document);

    const result = await parseSchema("#")(context)();
    const expected = gen.stringType;

    expect(result).toEqual(E.right(expected));
  });

  it("should parse a basic number schema", async () => {
    const document: ParsableDocument = { type: "number" };
    const context = createContextFromSingleDocument(document);

    const result = await parseSchema("#")(context)();
    const expected = gen.numberType;

    expect(result).toEqual(E.right(expected));
  });

  it("should parse a basic integer schema", async () => {
    const document: ParsableDocument = { type: "integer" };
    const context = createContextFromSingleDocument(document);

    const result = await parseSchema("#")(context)();
    const expected = gen.numberType;

    expect(result).toEqual(E.right(expected));
  });

  it("should parse a basic boolean schema", async () => {
    const document: ParsableDocument = { type: "boolean" };
    const context = createContextFromSingleDocument(document);

    const result = await parseSchema("#")(context)();
    const expected = gen.booleanType;

    expect(result).toEqual(E.right(expected));
  });

  it("should parse an empty array schema", async () => {
    const document: ParsableDocument = { type: "array", items: {} };
    const context = createContextFromSingleDocument(document);

    const result = await parseSchema("#")(context)();
    const expected = gen.arrayCombinator(gen.unknownType);

    expect(result).toEqual(E.right(expected));
  });

  it("should parse an array schema", async () => {
    const document: ParsableDocument = {
      type: "array",
      items: { type: "string" },
    };
    const context = createContextFromSingleDocument(document);

    const result = await parseSchema("#")(context)();
    const expected = gen.arrayCombinator(gen.stringType);

    expect(result).toEqual(E.right(expected));
  });

  it("should parse an empty object schema", async () => {
    const document: ParsableDocument = { type: "object" };
    const context = createContextFromSingleDocument(document);

    const result = await parseSchema("#")(context)();
    const expected = gen.unknownRecordType;

    expect(result).toEqual(E.right(expected));
  });

  it("should parse a basic object schema", async () => {
    const document: ParsableDocument = {
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
    const context = createContextFromSingleDocument(document);

    const result = await parseSchema("#")(context)();
    const generatedModels = context.generatedModelsRef.read();

    const expectedSchema = gen.typeCombinator([
      gen.property("name", gen.stringType, false),
      gen.property("age", gen.numberType, true),
    ]);

    const expectedDeclaration = gen.typeDeclaration(
      EXPECTED_SINGLE_DOCUMENT_MODEL_NAME,
      expectedSchema,
      true
    );

    const expectedResult = gen.identifier(EXPECTED_SINGLE_DOCUMENT_MODEL_NAME);

    const expectedGeneratedModels = {
      [SINGLE_DOCUMENT_ROOT_URI]: expectedDeclaration,
    };

    expect(result).toEqual(E.right(expectedResult));
    expect(generatedModels).toEqual(expectedGeneratedModels);
  });

  it("should parse a string schema with date format", async () => {
    const document: ParsableDocument = { type: "string", format: "date" };
    const context = createContextFromSingleDocument(document);

    const result = await parseSchema("#")(context)();
    const expected = gen.importedIdentifier("DateFromIsoString", "io-ts-types");

    expect(result).toEqual(E.right(expected));
  });

  it("should parse a string schema with date-time format", async () => {
    const document: ParsableDocument = { type: "string", format: "date-time" };
    const context = createContextFromSingleDocument(document);

    const result = await parseSchema("#")(context)();
    const expected = gen.importedIdentifier("DateFromIsoString", "io-ts-types");

    expect(result).toEqual(E.right(expected));
  });

  it("should parse a string schema with single enum", async () => {
    const document: ParsableDocument = { type: "string", enum: ["foo"] };
    const context = createContextFromSingleDocument(document);

    const result = await parseSchema("#")(context)();
    const expected = gen.literalCombinator("foo");

    expect(result).toEqual(E.right(expected));
  });

  it("should parse a string schema with multiple enums", async () => {
    const document: ParsableDocument = {
      type: "string",
      enum: ["foo", "bar", "baz"],
    };
    const context = createContextFromSingleDocument(document);

    const result = await parseSchema("#")(context)();
    const expected = gen.unionCombinator([
      gen.literalCombinator("foo"),
      gen.literalCombinator("bar"),
      gen.literalCombinator("baz"),
    ]);

    expect(result).toEqual(E.right(expected));
  });

  it("should parse a schema with allOf", async () => {
    const document: ParsableDocument = {
      allOf: [{ type: "string" }, { type: "number" }],
    };
    const context = createContextFromSingleDocument(document);

    const result = await parseSchema("#")(context)();
    const expected = gen.intersectionCombinator([
      gen.stringType,
      gen.numberType,
    ]);

    expect(result).toEqual(E.right(expected));
  });

  it("should parse a schema with oneOf", async () => {
    const document: ParsableDocument = {
      oneOf: [{ type: "string" }, { type: "number" }],
    };
    const context = createContextFromSingleDocument(document);

    const result = await parseSchema("#")(context)();
    const expected = gen.unionCombinator([gen.stringType, gen.numberType]);

    expect(result).toEqual(E.right(expected));
  });

  it("should parse a schema with anyOf", async () => {
    const document: ParsableDocument = {
      anyOf: [{ type: "string" }, { type: "number" }],
    };
    const context = createContextFromSingleDocument(document);

    const result = await parseSchema("#")(context)();
    const expected = gen.unionCombinator([gen.stringType, gen.numberType]);

    expect(result).toEqual(E.right(expected));
  });

  it("should parse a schema with multiple types", async () => {
    const document: ParsableDocument = {
      type: ["string", "number", "null"],
    };
    const context = createContextFromSingleDocument(document);

    const result = await parseSchema("#")(context)();
    const expected = gen.unionCombinator([
      gen.stringType,
      gen.numberType,
      gen.nullType,
    ]);

    expect(result).toEqual(E.right(expected));
  });

  it("should parse a JSON Schema with internal references", async () => {
    const document = {
      type: "object",
      properties: {
        Foo: { $ref: "#/$defs/Foo" },
        Bar: { $ref: "#/$defs/Bar" },
      },
      required: ["Foo"],
      $defs: {
        Foo: {
          type: "array",
          items: { type: "string" },
        },
        Bar: {
          type: "object",
          properties: {
            name: { type: "string" },
            address: { type: "string" },
          },
        },
      },
    } as NonArraySchemaObject;
    const context = createContextFromSingleDocument(document);

    const result = await parseSchema("#")(context)();
    const generatedModels = context.generatedModelsRef.read();

    const expectedFooModel = gen.arrayCombinator(gen.stringType);

    const expectedSchemaModel = gen.typeCombinator([
      gen.property("Foo", expectedFooModel, false),
      gen.property("Bar", gen.identifier("Bar"), true),
    ]);

    const expectedBarModel = gen.typeCombinator([
      gen.property("name", gen.stringType, true),
      gen.property("address", gen.stringType, true),
    ]);

    const expectedResult = gen.identifier(EXPECTED_SINGLE_DOCUMENT_MODEL_NAME);

    const expectedGeneratedModels = {
      [SINGLE_DOCUMENT_ROOT_URI]: gen.typeDeclaration(
        EXPECTED_SINGLE_DOCUMENT_MODEL_NAME,
        expectedSchemaModel,
        true
      ),
      [`${SINGLE_DOCUMENT_ROOT_URI}#/$defs/Foo`]: expectedFooModel,
      [`${SINGLE_DOCUMENT_ROOT_URI}#/$defs/Bar`]: gen.typeDeclaration(
        "Bar",
        expectedBarModel,
        true
      ),
    };

    expect(result).toEqual(E.right(expectedResult));
    expect(generatedModels).toEqual(expectedGeneratedModels);
  });

  it("should parse an OpenAPI 3.0 schema with nullable", async () => {
    const document: OpenAPIV3.Document = {
      openapi: "3.0",
      info: { title: "dummy document", version: "1" },
      paths: {},
      components: {
        schemas: {
          Foo: {
            type: "string",
            nullable: true,
          },
        },
      },
    };
    const context = createContextFromSingleDocument(document);

    const result = await parseSchema("#/components/schemas/Foo")(context)();
    const expected = gen.unionCombinator([gen.stringType, gen.nullType]);

    expect(result).toEqual(E.right(expected));
  });

  it("should parse external references", async () => {
    const rootDocumentUri = "/tmp/openapi.yml";
    const externalDocumentName = "json-schema.yml";

    const rootDocument: OpenAPIV3_1.Document = {
      openapi: "3.1",
      info: { title: "dummy document", version: "1" },
      components: {
        schemas: {
          Foo: {
            type: "object",
            properties: {
              Bar: { $ref: `./${externalDocumentName}` },
              NullableString: {
                $ref: `./${externalDocumentName}#/$defs/NullableString`,
              },
            },
          },
        },
      },
    };

    const externalDocument = {
      type: "object",
      properties: {
        A: {
          type: "string",
        },
        B: { $ref: "#/$defs/NullableString" },
      },
      $defs: {
        NullableString: {
          type: ["string", "null"],
        },
      },
    } as ParsableDocument;

    const externalDocumentAbsoluteUri = `/tmp/${externalDocumentName}`;
    const schemaToParse = "#/components/schemas/Foo";

    const uriDocumentMap: UriDocumentMap = {
      [rootDocumentUri]: rootDocument,
      [externalDocumentAbsoluteUri]: externalDocument,
    };
    const context = createSchemaContext(rootDocumentUri, uriDocumentMap)();

    const result = await parseSchema(schemaToParse)(context)();
    const generatedModels = context.generatedModelsRef.read();

    const expectedNullableString = gen.unionCombinator([
      gen.stringType,
      gen.nullType,
    ]);

    const expectedFoo = gen.typeCombinator([
      gen.property("Bar", gen.identifier("JsonSchema"), true),
      gen.property("NullableString", expectedNullableString, true),
    ]);
    const expectedExternalModel = gen.typeCombinator([
      gen.property("A", gen.stringType, true),
      gen.property("B", expectedNullableString, true),
    ]);

    const expectedGeneratedModels = {
      [`${rootDocumentUri}${schemaToParse}`]: gen.typeDeclaration(
        "Foo",
        expectedFoo,
        true
      ),
      [`${externalDocumentAbsoluteUri}`]: gen.typeDeclaration(
        "JsonSchema",
        expectedExternalModel,
        true
      ),
      [`${externalDocumentAbsoluteUri}#/$defs/NullableString`]:
        expectedNullableString,
    };

    expect(result).toEqual(E.right(gen.identifier("Foo")));
    expect(generatedModels).toEqual(expectedGeneratedModels);
  });

  it("should generate models using ModelGenerationInfoFn", async () => {
    const modelGenerationInfoFn: ModelGenerationInfoFn = ({ jsonPointer }) => {
      if (jsonPointer.length >= 3) {
        return {
          name: jsonPointer[2],
          filePath: jsonPointer[2] === "Bar" ? "components/schemas" : undefined,
        };
      }

      return {
        name: "Unknown",
      };
    };

    const document: OpenAPIV3.Document = {
      openapi: "3.0",
      info: { title: "dummy document", version: "1" },
      paths: {},
      components: {
        schemas: {
          Foo: {
            type: "array",
            items: {
              $ref: "#/components/schemas/Bar",
            },
          },
          Bar: {
            type: "object",
            properties: {
              A: {
                type: "string",
              },
              B: {
                type: "number",
              },
            },
          },
        },
        requestBodies: {
          Body: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    x: { $ref: "#/components/schemas/Foo" },
                  },
                },
              },
            },
          },
        },
      },
    };

    const context = createContextFromSingleDocument(
      document,
      modelGenerationInfoFn
    );

    const fooRef = "#/components/schemas/Foo";
    const barRef = "#/components/schemas/Bar";
    const bodyRef =
      "#/components/requestBodies/Body/content/application~1json/schema";

    const resultFoo = await parseSchema(fooRef)(context)();
    const resultBar = await parseSchema(barRef)(context)();
    const resultBody = await parseSchema(bodyRef)(context)();
    const generatedModels = context.generatedModelsRef.read();

    const expectedFoo = gen.arrayCombinator(
      gen.importedIdentifier("Bar", "components/schemas")
    );
    const expectedBar = gen.typeCombinator([
      gen.property("A", gen.stringType, true),
      gen.property("B", gen.numberType, true),
    ]);
    const expectedBody = gen.typeCombinator([
      gen.property("x", expectedFoo, true),
    ]);
    const expectedBarTypeDeclaration = gen.typeDeclaration(
      "Bar",
      expectedBar,
      true,
      undefined,
      undefined,
      "components/schemas"
    );
    const expectedBodyTypeDeclaration = gen.typeDeclaration(
      "Body",
      expectedBody,
      true
    );

    const expectedGeneratedModels = {
      [`${SINGLE_DOCUMENT_ROOT_URI}${fooRef}`]: expectedFoo,
      [`${SINGLE_DOCUMENT_ROOT_URI}${barRef}`]: expectedBarTypeDeclaration,
      [`${SINGLE_DOCUMENT_ROOT_URI}${bodyRef}`]: expectedBodyTypeDeclaration,
    };

    expect(resultFoo).toEqual(E.right(expectedFoo));
    expect(resultBar).toEqual(
      E.right(gen.importedIdentifier("Bar", "components/schemas"))
    );
    expect(resultBody).toEqual(E.right(gen.identifier("Body")));
    expect(generatedModels).toEqual(expectedGeneratedModels);
  });

  it("should parse a recursive schema", async () => {
    const document = {
      $defs: {
        Foo: {
          type: "object",
          properties: {
            Bar: { type: "string" },
            Foo: { $ref: "#/$defs/Foo" },
          },
        },
      },
    } as NonArraySchemaObject;
    const context = createContextFromSingleDocument(document);

    await parseSchema("#/$defs/Foo")(context)();
    const generatedModels = context.generatedModelsRef.read();

    const expectedFoo = gen.typeDeclaration(
      "Foo",
      gen.recursiveCombinator(
        gen.identifier("Foo"),
        "Foo",
        gen.typeCombinator([
          gen.property("Bar", gen.stringType, true),
          gen.property("Foo", gen.identifier("Foo"), true),
        ])
      ),
      true
    );

    const expectedGeneratedModels = {
      [`${SINGLE_DOCUMENT_ROOT_URI}#/$defs/Foo`]: expectedFoo,
    };

    expect(generatedModels).toEqual(expectedGeneratedModels);
  });

  it("should parse mutually recursive schemas", async () => {
    const document = {
      $defs: {
        Foo: {
          type: "object",
          properties: {
            Baz: { type: "string" },
            Bar: { $ref: "#/$defs/Bar" },
          },
        },
        Bar: {
          type: "array",
          items: { $ref: "#/$defs/Foo" },
        },
      },
    } as NonArraySchemaObject;
    const context = createContextFromSingleDocument(document);

    await parseSchema("#/$defs/Foo")(context)();
    const generatedModels = context.generatedModelsRef.read();

    const expectedFoo = gen.typeDeclaration(
      "Foo",
      gen.recursiveCombinator(
        gen.identifier("Foo"),
        "Foo",
        gen.typeCombinator([
          gen.property("Baz", gen.stringType, true),
          gen.property("Bar", gen.arrayCombinator(gen.identifier("Foo")), true),
        ])
      ),
      true
    );

    const expectedBar = gen.arrayCombinator(gen.identifier("Foo"));

    const expectedGeneratedModels = {
      [`${SINGLE_DOCUMENT_ROOT_URI}#/$defs/Foo`]: expectedFoo,
      [`${SINGLE_DOCUMENT_ROOT_URI}#/$defs/Bar`]: expectedBar,
    };

    expect(generatedModels).toEqual(expectedGeneratedModels);
  });
});

function createContextFromSingleDocument(
  document: ParsableDocument,
  modelGenerationInfoFn?: ModelGenerationInfoFn
): ParseSchemaContext {
  const uriDocumentMap: UriDocumentMap = {
    [SINGLE_DOCUMENT_ROOT_URI]: document,
  };
  return createSchemaContext(
    SINGLE_DOCUMENT_ROOT_URI,
    uriDocumentMap,
    modelGenerationInfoFn
  )();
}
