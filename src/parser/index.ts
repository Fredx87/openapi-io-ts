import SwaggerParser from "@apidevtools/swagger-parser";
import { pipe } from "fp-ts/function";
import { newIORef } from "fp-ts/lib/IORef";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as TE from "fp-ts/TaskEither";
import { GenRTE } from "../environment";
import { parseAllApis } from "./apis";
import { ParserContext, ParserRTE, readParserState } from "./context";
import { openApiParser } from "./openapi";
import { parserState, ParserState } from "./parserState";
import { parseAllSchemas } from "./schemas";

export function parseOpenApiDocument(): ParserRTE<ParserState> {
  return pipe(
    openApiParser(),
    RTE.chain(() => parseAllSchemas()),
    RTE.chain(() => parseAllApis()),
    RTE.chain(() => readParserState())
  );
}

function parseDocument(inputFile: string) {
  return TE.tryCatch(
    () => SwaggerParser.bundle(inputFile),
    (e) => `Error in OpenApi file: ${String(e)}`
  );
}

export function parse(): GenRTE<ParserState> {
  return (env) =>
    pipe(
      TE.rightIO(newIORef(parserState())),
      TE.map(
        (initialState): ParserContext => ({
          ...env,
          parserState: initialState,
          parseDocument,
        })
      ),
      TE.chain((context) => parseOpenApiDocument()(context))
    );
}
