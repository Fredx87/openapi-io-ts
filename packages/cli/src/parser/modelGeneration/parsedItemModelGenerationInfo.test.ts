import * as O from "fp-ts/Option";
import {
  createJsonReference,
  defaultModelGenerationInfo,
  ModelGenerationInfo,
} from "json-schema-io-ts";
import { OpenAPIV3_1 } from "openapi-types";
import { parsedItemModelGenerationInfo } from "./parsedItemModelGenerationInfo";
import {
  createSchemaContextFromDocument,
  documentWithGetFooPath,
  ROOT_DOCUMENT_URI,
} from "./testUtils";

describe("parsedItemModelGenerationInfo", () => {
  it("returns info for a component", () => {
    const jsonReference = createJsonReference(
      "#/components/parameters/Foo",
      ROOT_DOCUMENT_URI
    );

    const result = parsedItemModelGenerationInfo(
      jsonReference,
      createSchemaContextFromDocument(defaultModelGenerationInfo)
    );

    const expected: ModelGenerationInfo = {
      name: "Foo",
      filePath: "components/parameters/Foo.ts",
    };

    expect(result).toEqual(O.some(expected));
  });

  it("returns info for an operation with operationId", () => {
    const jsonReference = createJsonReference(
      "#/paths/foo/get",
      ROOT_DOCUMENT_URI
    );

    const result = parsedItemModelGenerationInfo(
      jsonReference,
      createSchemaContextFromDocument(
        defaultModelGenerationInfo,
        documentWithGetFooPath
      )
    );

    const expected: ModelGenerationInfo = {
      name: "GetFoo",
      filePath: "operations/getFoo.ts",
    };
    expect(result).toEqual(O.some(expected));
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

    const result = parsedItemModelGenerationInfo(
      jsonReference,
      createSchemaContextFromDocument(
        defaultModelGenerationInfo,
        partialDocument
      )
    );

    const expected: ModelGenerationInfo = {
      name: "FooGet",
      filePath: "operations/fooGet.ts",
    };
    expect(result).toEqual(O.some(expected));
  });

  it("returns none for an operation item", () => {
    const jsonReference = createJsonReference(
      "#/paths/foo/get/requestBody",
      ROOT_DOCUMENT_URI
    );

    const result = parsedItemModelGenerationInfo(
      jsonReference,
      createSchemaContextFromDocument(
        defaultModelGenerationInfo,
        documentWithGetFooPath
      )
    );

    expect(result).toEqual(O.none);
  });
});
