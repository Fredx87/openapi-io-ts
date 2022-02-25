import { createJsonReference, ModelGenerationInfo } from "json-schema-io-ts";
import { schemaModelGenerationInfo } from ".";
import {
  createSchemaContextFromDocument,
  documentWithGetFooPath,
  ROOT_DOCUMENT_URI,
} from "./testUtils";

describe("schemaModelGenerationInfo", () => {
  it("returns info for a schema component", () => {
    const jsonReference = createJsonReference(
      "#/components/schemas/Foo",
      ROOT_DOCUMENT_URI
    );

    const result = schemaModelGenerationInfo(
      jsonReference,
      createSchemaContextFromDocument(schemaModelGenerationInfo)
    );

    const expected: ModelGenerationInfo = {
      name: "Foo",
      filePath: "components/schemas/Foo.ts",
    };
    expect(result).toEqual(expected);
  });

  it("returns info for a requestBody component schema", () => {
    const jsonReference = createJsonReference(
      "#/components/requestBodies/Body/content/application~1json/schema",
      ROOT_DOCUMENT_URI
    );

    const result = schemaModelGenerationInfo(
      jsonReference,
      createSchemaContextFromDocument(schemaModelGenerationInfo)
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

    const result = schemaModelGenerationInfo(
      jsonReference,
      createSchemaContextFromDocument(schemaModelGenerationInfo)
    );

    const expected: ModelGenerationInfo = {
      name: "BarSchema",
      filePath: "components/responses/Bar.ts",
    };
    expect(result).toEqual(expected);
  });

  it("returns info for an operation parameter schema", () => {
    const jsonReference = createJsonReference(
      "#/paths/foo/get/parameters/0/schema",
      ROOT_DOCUMENT_URI
    );

    const result = schemaModelGenerationInfo(
      jsonReference,
      createSchemaContextFromDocument(
        schemaModelGenerationInfo,
        documentWithGetFooPath
      )
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

    const result = schemaModelGenerationInfo(
      jsonReference,
      createSchemaContextFromDocument(
        schemaModelGenerationInfo,
        documentWithGetFooPath
      )
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

    const result = schemaModelGenerationInfo(
      jsonReference,
      createSchemaContextFromDocument(
        schemaModelGenerationInfo,
        documentWithGetFooPath
      )
    );

    const expected: ModelGenerationInfo = {
      name: "GetFooResponse200Schema",
    };
    expect(result).toEqual(expected);
  });
});
