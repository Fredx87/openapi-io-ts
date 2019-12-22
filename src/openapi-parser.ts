import * as STE from "fp-ts-contrib/lib/StateTaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as TE from "fp-ts/lib/TaskEither";
import produce from "immer";
import { OpenAPI, OpenAPIV3 } from "openapi-types";
import SwaggerParser from "swagger-parser";
import { ParserContext } from "./parser-context";
import { ParserSTE } from "./utils";

function isOpenApiV3Document(doc: OpenAPI.Document): doc is OpenAPIV3.Document {
  return "openapi" in doc;
}

function parseFile(): ParserSTE<OpenAPIV3.Document> {
  return pipe(
    STE.gets<ParserContext, string>(context => context.inputFile),
    STE.chain(file =>
      STE.fromTaskEither(
        pipe(
          TE.tryCatch(
            () => SwaggerParser.bundle(file),
            (e: any) => `Error in OpenApi file: ${String(e)}`
          ),
          TE.chain(doc =>
            isOpenApiV3Document(doc)
              ? TE.right(doc)
              : TE.left("Cannot parse OpenAPI v2 document")
          )
        )
      )
    )
  );
}

export function openApiParser(): ParserSTE {
  return pipe(
    parseFile(),
    STE.chain<ParserContext, string, OpenAPIV3.Document, void>(doc =>
      STE.modify(context =>
        produce(context, draft => {
          draft.document = doc;
        })
      )
    )
  );
}
