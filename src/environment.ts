import * as RTE from "fp-ts/ReaderTaskEither";

export interface Environment {
  inputFile: string;
  outputDir: string;
}

export type ProgramRTE<A> = RTE.ReaderTaskEither<Environment, Error, A>;
