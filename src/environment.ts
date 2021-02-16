import * as RTE from "fp-ts/ReaderTaskEither";

export interface Environment {
  inputFile: string;
  outputDir: string;
}

export type GenRTE<A> = RTE.ReaderTaskEither<Environment, string, A>;
