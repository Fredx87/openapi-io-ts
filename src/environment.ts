import { pipe } from "fp-ts/function";
import { IORef } from "fp-ts/IORef";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as TE from "fp-ts/TaskEither";
import { OpenAPI } from "openapi-types";
import { ParserState } from "./parser/parserState";

export interface Environment {
  parseDocument: (inputFile: string) => TE.TaskEither<string, OpenAPI.Document>;
  inputFile: string;
  outputDir: string;
  parserState: IORef<ParserState>;
}

export type GenRTE<A> = RTE.ReaderTaskEither<Environment, string, A>;

export function readParserState(): GenRTE<ParserState> {
  return pipe(
    RTE.asks((e: Environment) => e.parserState),
    RTE.chain((state) => RTE.rightIO(state.read))
  );
}
