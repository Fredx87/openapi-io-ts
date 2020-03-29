import { pipe } from "fp-ts/lib/pipeable";
import * as TE from "fp-ts/lib/TaskEither";
import { OpenAPI, OpenAPIV3 } from "openapi-types";
import SwaggerParser from "swagger-parser";
import { GenRTE } from "../environment";

function isOpenApiV3Document(doc: OpenAPI.Document): doc is OpenAPIV3.Document {
  return "openapi" in doc;
}

export function openApiParser(): GenRTE<void> {
  return env =>
    pipe(
      TE.tryCatch(
        () => SwaggerParser.bundle(env.inputFile),
        (e: any) => `Error in OpenApi file: ${String(e)}`
      ),
      TE.chain(doc =>
        isOpenApiV3Document(doc)
          ? TE.right(doc)
          : TE.left("Cannot parse OpenAPI v2 document")
      ),
      TE.chain(document =>
        TE.rightIO(env.parserState.modify(s => ({ ...s, document })))
      )
    );
}
