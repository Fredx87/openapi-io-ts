import { error, log } from "fp-ts/Console";
import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as T from "fp-ts/Task";
import * as TE from "fp-ts/TaskEither";
import { Environment } from "./environment";
import { writeModels } from "./file-writer/models";
import { parse } from "./parser";

function onLeft(e: string): T.Task<void> {
  return T.fromIO(error(`Error: ${e}`));
}

function onRight(): T.Task<void> {
  return T.fromIO(log("Files generated successfully!"));
}

export function generate(inputFile: string, outputDir: string): void {
  const env: Environment = {
    inputFile,
    outputDir,
  };

  const result = pipe(
    parse(),
    RTE.chain((parseResult) => writeModels(parseResult))
  )(env);

  pipe(result, TE.fold(onLeft, onRight))();
}
