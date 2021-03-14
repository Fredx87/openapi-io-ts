import SwaggerParser from "@apidevtools/swagger-parser";
import { pipe } from "fp-ts/function";
import * as TE from "fp-ts/TaskEither";
import { OpenAPI, OpenAPIV3 } from "openapi-types";

export function openApiParser(
  inputFile: string
): TE.TaskEither<Error, OpenAPIV3.Document> {
  return pipe(
    parseDocument(inputFile),
    TE.chain((document) =>
      isOpenApiV3Document(document)
        ? TE.right(document)
        : TE.left(new Error("Cannot parse OpenAPI v2 document"))
    )
  );
}

function parseDocument(inputFile: string) {
  return TE.tryCatch(
    () => SwaggerParser.bundle(inputFile),
    (e) => new Error(`Error in OpenApi file: ${String(e)}`)
  );
}

function isOpenApiV3Document(doc: OpenAPI.Document): doc is OpenAPIV3.Document {
  return "openapi" in doc;
}
