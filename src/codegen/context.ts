import * as RTE from "fp-ts/ReaderTaskEither";
import * as TE from "fp-ts/TaskEither";
import { Environment } from "../environment";

export interface CodegenContext extends Environment {
  writeFile: (
    path: string,
    fileName: string,
    content: string
  ) => TE.TaskEither<Error, void>;
  createDir: (dirName: string) => TE.TaskEither<Error, void>;
}

export type CodegenRTE<A> = RTE.ReaderTaskEither<CodegenContext, Error, A>;
