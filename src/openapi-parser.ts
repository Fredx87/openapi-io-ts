import { pipe } from "fp-ts/lib/pipeable";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as SRTE from "fp-ts/lib/StateReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import produce from "immer";
import { OpenAPI, OpenAPIV3 } from "openapi-types";
import SwaggerParser from "swagger-parser";
import { ParserConfiguration } from "./parser-configuration";
import { ParserContext } from "./parser-context";
import { ParserSRTE } from "./utils";

function isOpenApiV3Document(doc: OpenAPI.Document): doc is OpenAPIV3.Document {
  return "openapi" in doc;
}

function parseFile(): RTE.ReaderTaskEither<
  ParserConfiguration,
  string,
  OpenAPIV3.Document
> {
  return pipe(
    RTE.asks((config: ParserConfiguration) => config.inputFile),
    RTE.chain(file =>
      RTE.fromTaskEither(
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

export function openApiParser(): ParserSRTE {
  return pipe(
    SRTE.fromReaderTaskEither<
      ParserContext,
      ParserConfiguration,
      string,
      OpenAPIV3.Document
    >(parseFile()),
    SRTE.chain(doc =>
      SRTE.modify(context =>
        produce(context, draft => {
          draft.document = doc;
        })
      )
    )
  );
}
