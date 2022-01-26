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
import {
  initialGeneratedModels,
  ModelGenerationInfoFn,
} from "./modelGeneration";

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
    const { modelNameTypeMap } = context.generatedModelsRef.read();

    const expectedResult = gen.identifier("CannedSchema");

    const expectedSchema = gen.typeCombinator([
      gen.property("name", gen.stringType, false),
      gen.property("age", gen.numberType, true),
    ]);
    const expectedModelNameTypeMap = {
      CannedSchema: expectedSchema,
    };

    expect(result).toEqual(E.right(expectedResult));
    expect(modelNameTypeMap).toEqual(expectedModelNameTypeMap);
  });

  it("should parse a string schema with date format", async () => {
    const document: ParsableDocument = { type: "string", format: "date" };
    const context = createContextFromSingleDocument(document);

    const result = await parseSchema("#")(context)();
    const expected = gen.customCombinator("Date", "tTypes.DateFromISOString");

    expect(result).toEqual(E.right(expected));
  });

  it("should parse a string schema with date-time format", async () => {
    const document: ParsableDocument = { type: "string", format: "date-time" };
    const context = createContextFromSingleDocument(document);

    const result = await parseSchema("#")(context)();
    const expected = gen.customCombinator("Date", "tTypes.DateFromISOString");

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
    const { modelNameTypeMap } = context.generatedModelsRef.read();

    const expectedResult = gen.identifier("CannedSchema");

    const expectedSchemaModel = gen.typeCombinator([
      gen.property("Foo", gen.arrayCombinator(gen.stringType), false),
      gen.property("Bar", gen.identifier("Bar"), true),
    ]);
    const expectedBarModel = gen.typeCombinator([
      gen.property("name", gen.stringType, true),
      gen.property("address", gen.stringType, true),
    ]);
    const expectedModelNameTypeMap = {
      CannedSchema: expectedSchemaModel,
      Bar: expectedBarModel,
    };

    expect(result).toEqual(E.right(expectedResult));
    expect(modelNameTypeMap).toEqual(expectedModelNameTypeMap);
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

    const uriDocumentMap: UriDocumentMap = {
      [rootDocumentUri]: rootDocument,
      [`/tmp/${externalDocumentName}`]: externalDocument,
    };
    const context = createSchemaContext(rootDocumentUri, uriDocumentMap)();

    const result = await parseSchema("#/components/schemas/Foo")(context)();
    const { modelNameTypeMap, referenceModelNameMap } =
      context.generatedModelsRef.read();

    const expectedResult = gen.identifier("Foo");

    const expectedFoo = gen.typeCombinator([
      gen.property("Bar", gen.identifier("JsonSchema"), true),
      gen.property(
        "NullableString",
        gen.unionCombinator([gen.stringType, gen.nullType]),
        true
      ),
    ]);
    const expectedExternalModel = gen.typeCombinator([
      gen.property("A", gen.stringType, true),
      gen.property(
        "B",
        gen.unionCombinator([gen.stringType, gen.nullType]),
        true
      ),
    ]);

    const expectedModelNameTypeMap = {
      Foo: expectedFoo,
      JsonSchema: expectedExternalModel,
    };

    const expectedReferenceModelNameMap = {
      [`${rootDocumentUri}#/components/schemas/Foo`]: "Foo",
      [`/tmp/${externalDocumentName}`]: "JsonSchema",
    };

    expect(result).toEqual(E.right(expectedResult));
    expect(modelNameTypeMap).toEqual(expectedModelNameTypeMap);
    expect(referenceModelNameMap).toEqual(expectedReferenceModelNameMap);
  });

  it("should generate models using ModelGenerationInfoFn", async () => {
    const modelGenerationInfoFn: ModelGenerationInfoFn = ({ jsonPointer }) => {
      if (jsonPointer.length >= 3) {
        return {
          name: jsonPointer[2],
          importData: {
            prefix: jsonPointer[1],
            path: `${jsonPointer[0]}/${jsonPointer[1]}`,
          },
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
                    x: { $ref: "#/components/schemas/Bar" },
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

    const resultFoo = await parseSchema("#/components/schemas/Foo")(context)();
    const resultBar = await parseSchema("#/components/schemas/Bar")(context)();
    const resultBody = await parseSchema(
      "#/components/requestBodies/Body/content/application~1json/schema"
    )(context)();
    const { modelNameTypeMap, prefixImportPathMap } =
      context.generatedModelsRef.read();

    const expectedParsedFoo = gen.arrayCombinator(
      gen.identifier("schemas.Bar")
    );
    const expectedParsedBar = gen.identifier("schemas.Bar");
    const expectedParsedBody = gen.identifier("requestBodies.Body");

    const expectedGeneratedBar = gen.typeCombinator([
      gen.property("A", gen.stringType, true),
      gen.property("B", gen.numberType, true),
    ]);
    const expectedGeneratedBody = gen.typeCombinator([
      gen.property("x", gen.identifier("schemas.Bar"), true),
    ]);

    const expectedModelNameTypeMap = {
      "schemas.Bar": expectedGeneratedBar,
      "requestBodies.Body": expectedGeneratedBody,
    };

    const expectedPrefixImportPathMap = {
      ...initialGeneratedModels.prefixImportPathMap,
      schemas: "components/schemas",
      requestBodies: "components/requestBodies",
    };

    expect(resultFoo).toEqual(E.right(expectedParsedFoo));
    expect(resultBar).toEqual(E.right(expectedParsedBar));
    expect(resultBody).toEqual(E.right(expectedParsedBody));
    expect(modelNameTypeMap).toEqual(expectedModelNameTypeMap);
    expect(prefixImportPathMap).toEqual(expectedPrefixImportPathMap);
  });
});

function createContextFromSingleDocument(
  document: ParsableDocument,
  modelGenerationInfoFn?: ModelGenerationInfoFn
): ParseSchemaContext {
  const dummyUri = "/tmp/canned-schema.json";
  const uriDocumentMap: UriDocumentMap = {
    [dummyUri]: document,
  };
  return createSchemaContext(dummyUri, uriDocumentMap, modelGenerationInfoFn)();
}
