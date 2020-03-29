import { IORef } from "fp-ts/lib/IORef";
import { pipe } from "fp-ts/lib/pipeable";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
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
    RTE.chain(state => RTE.rightIO(state.read))
  );
}
