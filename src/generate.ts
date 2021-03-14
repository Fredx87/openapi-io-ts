import { error, log } from "fp-ts/Console";
import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as T from "fp-ts/Task";
import * as TE from "fp-ts/TaskEither";
import { Environment } from "./environment";
import { parse } from "./parser";

function onLeft(e: Error): T.Task<void> {
  return T.fromIO(error(e));
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
    RTE.bindTo("parseResult")
    // RTE.chainFirst(({ parseResult }) => writeModels(parseResult)),
    // RTE.chainFirst(({ parseResult }) => writeServices(parseResult))
  )(env);

  pipe(result, TE.fold(onLeft, onRight))();
}
