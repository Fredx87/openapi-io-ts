import { pipe } from "fp-ts/function";
import { newIORef } from "fp-ts/lib/IORef";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as TE from "fp-ts/TaskEither";
import { GenRTE } from "../environment";
import { parseAllComponents } from "./components";
import { ParserRTE, readParserOutput } from "./context";
import { openApiParser } from "./openapi";
import { parseAllPaths } from "./operation";
import { ParserOutput, parserOutput } from "./parserOutput";

export function parseOpenApiDocument(): ParserRTE<ParserOutput> {
  return pipe(
    parseAllComponents(),
    RTE.chain(() => parseAllPaths()),
    RTE.chain(() => readParserOutput())
  );
}

export function parse(): GenRTE<ParserOutput> {
  return (env) =>
    pipe(
      openApiParser(env.inputFile),
      TE.bindTo("document"),
      TE.bind("initialState", () => TE.rightIO(newIORef(parserOutput()))),
      TE.bind("context", ({ initialState, document }) =>
        TE.of({
          outputRef: initialState,
          document,
        })
      ),
      TE.chain(({ context }) => parseOpenApiDocument()(context))
    );
}
