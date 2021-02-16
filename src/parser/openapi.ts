import { pipe } from "fp-ts/function";
import * as TE from "fp-ts/TaskEither";
import { OpenAPI, OpenAPIV3 } from "openapi-types";
import { ParserRTE } from "./context";

function isOpenApiV3Document(doc: OpenAPI.Document): doc is OpenAPIV3.Document {
  return "openapi" in doc;
}

export function openApiParser(): ParserRTE<void> {
  return (context) =>
    pipe(
      context.parseDocument(context.inputFile),
      TE.chain((doc) =>
        isOpenApiV3Document(doc)
          ? TE.right(doc)
          : TE.left("Cannot parse OpenAPI v2 document")
      ),
      TE.chain((document) =>
        TE.rightIO(context.parserState.modify((s) => ({ ...s, document })))
      )
    );
}
