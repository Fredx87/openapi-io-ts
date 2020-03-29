import { error, log } from "fp-ts/lib/Console";
import { pipe } from "fp-ts/lib/pipeable";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import { environment } from "./environment";
import { writeModels } from "./file-writer/models";
import { parse } from "./parser";

function onLeft(e: string): T.Task<void> {
  return T.fromIO(error(`Error: ${e}`));
}

function onRight(): T.Task<void> {
  return T.fromIO(log("Files generated succeessfully!"));
}

export function generate(inputFile: string, outputDir: string): void {
  const env = environment(inputFile, outputDir);

  const result = pipe(
    parse(),
    RTE.chain(() => writeModels())
  )(env());

  pipe(result, TE.fold(onLeft, onRight))();
}
