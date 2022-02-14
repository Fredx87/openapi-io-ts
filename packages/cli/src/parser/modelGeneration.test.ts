import {
  createJsonReference,
  createSchemaContext,
  JsonReference,
  ModelGenerationInfo,
  ParseSchemaContext,
} from "json-schema-io-ts";
import { OpenAPIV3_1 } from "openapi-types";
import { modelGenerationInfoFn } from "./modelGeneration";

const ROOT_DOCUMENT_URI = "/tmp/openapi.yml";

describe("modelGeneration", () => {
  it("returns info for a schema component", () => {
    const jsonReference = createJsonReference(
      "#/components/schemas/Foo",
      ROOT_DOCUMENT_URI
    );

    const result = modelGenerationInfoFn(
      jsonReference,
      createSchemaContextFromDocument()
    );

    const expected: ModelGenerationInfo = {
      name: "Foo",
      filePath: "components/schemas/Foo.ts",
    };
    expect(result).toEqual(expected);
  });

  it("returns info for a parameter component schema", () => {
    const jsonReference = createJsonReference(
      "#/components/parameters/Bar/schema",
      ROOT_DOCUMENT_URI
    );

    const result = modelGenerationInfoFn(
      jsonReference,
      createSchemaContextFromDocument()
    );

    const expected: ModelGenerationInfo = {
      name: "BarSchema",
      filePath: "components/parameters/Bar.ts",
    };
    expect(result).toEqual(expected);
  });

  it("returns info for a requestBody component schema", () => {
    const jsonReference = createJsonReference(
      "#/components/requestBodies/Body/content/application~1json/schema",
      ROOT_DOCUMENT_URI
    );

    const result = modelGenerationInfoFn(
      jsonReference,
      createSchemaContextFromDocument()
    );

    const expected: ModelGenerationInfo = {
      name: "BodySchema",
      filePath: "components/requestBodies/Body.ts",
    };
    expect(result).toEqual(expected);
  });

  it("returns info for a response component schema", () => {
    const jsonReference = createJsonReference(
      "#/components/responses/Bar/content/application~1json/schema",
      ROOT_DOCUMENT_URI
    );

    const result = modelGenerationInfoFn(
      jsonReference,
      createSchemaContextFromDocument()
    );

    const expected: ModelGenerationInfo = {
      name: "BarSchema",
      filePath: "components/responses/Bar.ts",
    };
    expect(result).toEqual(expected);
  });

  it("returns info for an operation with operationId", () => {
    const jsonReference = createJsonReference(
      "#/paths/foo/get",
      ROOT_DOCUMENT_URI
    );

    const result = modelGenerationInfoFn(
      jsonReference,
      createSchemaContextFromDocument(documentWithGetFooPath)
    );

    const expected: ModelGenerationInfo = {
      name: "GetFoo",
      filePath: "operations/GetFoo.ts",
    };
    expect(result).toEqual(expected);
  });

  it("returns info for an operation without operationId", () => {
    const jsonReference = createJsonReference(
      "#/paths/foo/get",
      ROOT_DOCUMENT_URI
    );

    const partialDocument: Partial<OpenAPIV3_1.Document> = {
      paths: {
        foo: {
          get: {
            responses: {},
          },
        },
      },
    } as const;

    const result = modelGenerationInfoFn(
      jsonReference,
      createSchemaContextFromDocument(partialDocument)
    );

    const expected: ModelGenerationInfo = {
      name: "FooGet",
      filePath: "operations/FooGet.ts",
    };
    expect(result).toEqual(expected);
  });

  it("returns info for an operation parameter schema", () => {
    const jsonReference = createJsonReference(
      "#/paths/foo/get/parameters/0/schema",
      ROOT_DOCUMENT_URI
    );

    const result = modelGenerationInfoFn(
      jsonReference,
      createSchemaContextFromDocument(documentWithGetFooPath)
    );

    const expected: ModelGenerationInfo = {
      name: "GetFooParameter0Schema",
    };
    expect(result).toEqual(expected);
  });

  it("returns info for an operation body schema", () => {
    const jsonReference = createJsonReference(
      "#/paths/foo/get/requestBody/content/application~1json/schema",
      ROOT_DOCUMENT_URI
    );

    const result = modelGenerationInfoFn(
      jsonReference,
      createSchemaContextFromDocument(documentWithGetFooPath)
    );

    const expected: ModelGenerationInfo = {
      name: "GetFooRequestBodySchema",
    };
    expect(result).toEqual(expected);
  });

  it("returns info for an operation response schema", () => {
    const jsonReference = createJsonReference(
      "#/paths/foo/get/responses/200/content/application~1json/schema",
      ROOT_DOCUMENT_URI
    );

    const result = modelGenerationInfoFn(
      jsonReference,
      createSchemaContextFromDocument(documentWithGetFooPath)
    );

    const expected: ModelGenerationInfo = {
      name: "GetFooResponse200Schema",
    };
    expect(result).toEqual(expected);
  });

  it("returns info for external document", () => {
    const rootDocument: OpenAPIV3_1.Document = {
      openapi: "3.1",
      info: { title: "", version: "1" },
      components: {},
    };
    const externalDocumentUri = "/tmp/external-document.json";
    const externalDocument = {};
    const uriDocumentMap = {
      [ROOT_DOCUMENT_URI]: rootDocument,
      [externalDocumentUri]: externalDocument,
    };
    const schemaContext = createSchemaContext(
      ROOT_DOCUMENT_URI,
      uriDocumentMap,
      modelGenerationInfoFn
    )();

    const wholeDocumentRef: JsonReference = {
      uri: externalDocumentUri,
      jsonPointer: [],
    };
    const wholeDocumentResult = modelGenerationInfoFn(
      wholeDocumentRef,
      schemaContext
    );
    const wholeDocumentExpected: ModelGenerationInfo = {
      name: "ExternalDocument",
      filePath: "externals/externalDocument/ExternalDocument.ts",
    };

    expect(wholeDocumentResult).toEqual(wholeDocumentExpected);

    const defRef: JsonReference = {
      uri: externalDocumentUri,
      jsonPointer: ["defs", "Foo"],
    };
    const defResult = modelGenerationInfoFn(defRef, schemaContext);
    const defExpected: ModelGenerationInfo = {
      name: "Foo",
      filePath: "externals/externalDocument/Foo.ts",
    };

    expect(defResult).toEqual(defExpected);
  });

  it("returns info for an unknown reference", () => {
    const jsonReference = createJsonReference(
      "#/foo/bar/baz",
      ROOT_DOCUMENT_URI
    );

    const result = modelGenerationInfoFn(
      jsonReference,
      createSchemaContextFromDocument(documentWithGetFooPath)
    );

    const expected: ModelGenerationInfo = {
      name: "FooBarBaz",
      filePath: "others/FooBarBaz.ts",
    };
    expect(result).toEqual(expected);
  });
});

function createSchemaContextFromDocument(
  document: Partial<OpenAPIV3_1.Document> = {}
): ParseSchemaContext {
  const rootDocument: OpenAPIV3_1.Document = {
    ...document,
    openapi: "3.1",
    info: { title: "", version: "1" },
    components: {},
  };
  const uriDocumentMap = {
    [ROOT_DOCUMENT_URI]: rootDocument,
  };
  return createSchemaContext(
    ROOT_DOCUMENT_URI,
    uriDocumentMap,
    modelGenerationInfoFn
  )();
}

const documentWithGetFooPath: Partial<OpenAPIV3_1.Document> = {
  paths: {
    foo: {
      get: {
        operationId: "getFoo",
        responses: {},
      },
    },
  },
} as const;
