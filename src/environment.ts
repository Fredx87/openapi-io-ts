import * as IO from "fp-ts/lib/IO";
import { IORef, newIORef } from "fp-ts/lib/IORef";
import { pipe } from "fp-ts/lib/pipeable";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import { ParserState, parserState } from "./parser/parserState";

export interface Environment {
  inputFile: string;
  outputDir: string;
  parserState: IORef<ParserState>;
}

export type GenRTE<A> = RTE.ReaderTaskEither<Environment, string, A>;

export function environment(
  inputFile: string,
  outputDir: string
): IO.IO<Environment> {
  return pipe(
    newIORef(parserState()),
    IO.map(parserState => ({
      inputFile,
      outputDir,
      parserState
    }))
  );
}

export function readParserState(): GenRTE<ParserState> {
  return pipe(
    RTE.asks((e: Environment) => e.parserState),
    RTE.chain(state => RTE.rightIO(state.read))
  );
}
