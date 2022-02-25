import {
  createSchemaContext,
  ModelGenerationInfoFn,
  ParseSchemaContext,
} from "json-schema-io-ts";
import { OpenAPIV3_1 } from "openapi-types";

export const ROOT_DOCUMENT_URI = "/tmp/openapi.yml";

export function createSchemaContextFromDocument(
  modelGenerationInfoFn: ModelGenerationInfoFn,
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

export const documentWithGetFooPath: Partial<OpenAPIV3_1.Document> = {
  paths: {
    foo: {
      get: {
        operationId: "getFoo",
        responses: {},
      },
    },
  },
} as const;
