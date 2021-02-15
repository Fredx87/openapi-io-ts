import { error, log } from "fp-ts/Console";
import { pipe } from "fp-ts/function";
import { newIORef } from "fp-ts/IORef";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as T from "fp-ts/Task";
import * as TE from "fp-ts/TaskEither";
import SwaggerParser from "swagger-parser";
import { Environment } from "./environment";
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
    () => SwaggerParser.default.bundle(inputFile),
    (e) => `Error in OpenApi file: ${String(e)}`
  );
}

export function generate(inputFile: string, outputDir: string): void {
  const env: Environment = {
    parseDocument,
    inputFile,
    outputDir,
    parserState: newIORef(parserState())(),
  };

  const result = pipe(
    parse(),
    RTE.chain(() => writeModels())
  )(env);

  pipe(result, TE.fold(onLeft, onRight))();
}
