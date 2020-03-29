import { error, log } from "fp-ts/lib/Console";
import { newIORef } from "fp-ts/lib/IORef";
import { pipe } from "fp-ts/lib/pipeable";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import SwaggerParser from "swagger-parser";
import { Environment } from "./environment";
import { writeApis } from "./file-writer/apis";
import { writeModels } from "./file-writer/models";
import { parse } from "./parser";
import { parserState } from "./parser/parserState";

function onLeft(e: string): T.Task<void> {
  return T.fromIO(error(`Error: ${e}`));
}

function onRight(): T.Task<void> {
  return T.fromIO(log("Files generated succeessfully!"));
}

function parseDocument(inputFile: string) {
  return TE.tryCatch(
    () => SwaggerParser.bundle(inputFile),
    e => `Error in OpenApi file: ${String(e)}`
  );
}

export function generate(inputFile: string, outputDir: string): void {
  const env: Environment = {
    parseDocument,
    inputFile,
    outputDir,
    parserState: newIORef(parserState())()
  };

  const result = pipe(
    parse(),
    RTE.chain(() => writeModels()),
    RTE.chain(() => writeApis())
  )(env);

  pipe(result, TE.fold(onLeft, onRight))();
}
