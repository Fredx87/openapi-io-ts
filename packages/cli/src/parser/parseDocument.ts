import SwaggerParser from "@apidevtools/swagger-parser";
import { pipe } from "fp-ts/function";
import * as TE from "fp-ts/TaskEither";
import { OpenAPI, OpenAPIV3 } from "openapi-types";

export function parseDocument(
  inputFile: string
): TE.TaskEither<Error, OpenAPIV3.Document> {
  return pipe(
    TE.tryCatch(
      () => SwaggerParser.bundle(inputFile),
      (e) => new Error(`Error in OpenApi file: ${String(e)}`)
    ),
    TE.chain((document) =>
      isOpenApiV3Document(document)
        ? TE.right(document)
        : TE.left(new Error("Cannot parse OpenAPI v2 document"))
    )
  );
}

function isOpenApiV3Document(doc: OpenAPI.Document): doc is OpenAPIV3.Document {
  return "openapi" in doc;
}
