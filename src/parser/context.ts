import { IORef } from "fp-ts/IORef";
import { pipe } from "fp-ts/lib/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as TE from "fp-ts/TaskEither";
import { OpenAPI } from "openapi-types";
import { Environment } from "../environment";
import { ParserState } from "./parserState";

export interface ParserContext extends Environment {
  parseDocument: (inputFile: string) => TE.TaskEither<string, OpenAPI.Document>;
  parserState: IORef<ParserState>;
}

export type ParserRTE<A> = RTE.ReaderTaskEither<ParserContext, string, A>;

export function readParserState(): ParserRTE<ParserState> {
  return pipe(
    RTE.asks((e: ParserContext) => e.parserState),
    RTE.chain((state) => RTE.rightIO(state.read))
  );
}
