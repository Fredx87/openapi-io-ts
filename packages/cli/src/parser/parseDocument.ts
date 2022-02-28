import SwaggerParser from "@apidevtools/swagger-parser";
import { pipe } from "fp-ts/function";
import * as TE from "fp-ts/TaskEither";
import {
  createSchemaContext,
  ParsableDocument,
  ParseSchemaContext,
  UriDocumentMap,
} from "json-schema-io-ts";
import { OpenAPIV3_1 } from "openapi-types";
import { resolve } from "path";
import { schemaModelGenerationInfo } from "./modelGeneration";

interface ParsedDocumentResult {
  document: OpenAPIV3_1.Document;
  parseSchemaContext: ParseSchemaContext;
}

export function parseDocument(
  inputFile: string
): TE.TaskEither<Error, ParsedDocumentResult> {
  const absoluteUri = resolve(inputFile);

  return pipe(
    TE.Do,
    TE.bind("refs", () =>
      TE.tryCatch(
        () => pipe(SwaggerParser.resolve(inputFile)),
        (e) => new Error(`Error in OpenApi file: ${String(e)}`)
      )
    ),
    TE.bind("uriDocumentMap", ({ refs }) =>
      TE.right(refs.values() as UriDocumentMap)
    ),
    TE.bind("document", ({ uriDocumentMap }) => {
      const document = uriDocumentMap[absoluteUri];
      return isOpenApiV3Document(document)
        ? TE.right(document)
        : TE.left(new Error("Cannot parse OpenAPI v2 document"));
    }),
    TE.bindW("parseSchemaContext", ({ uriDocumentMap }) =>
      pipe(
        createSchemaContext(
          absoluteUri,
          uriDocumentMap,
          schemaModelGenerationInfo
        ),
        TE.rightIO
      )
    ),
    TE.map(({ document, parseSchemaContext }) => {
      return {
        document,
        parseSchemaContext,
      };
    })
  );
}

function isOpenApiV3Document(
  doc: ParsableDocument
): doc is OpenAPIV3_1.Document {
  return "openapi" in doc;
}
