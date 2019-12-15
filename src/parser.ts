import { error, log } from "fp-ts/lib/Console";
import { pipe } from "fp-ts/lib/pipeable";
import * as S from "fp-ts/lib/State";
import * as SRTE from "fp-ts/lib/StateReaderTaskEither";
import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import { writeModels } from "./file-writer";
import { openApiParser } from "./openapi-parser";
import { ParserConfiguration } from "./parser-configuration";
import { parserContext } from "./parser-context";
import { parseAllApis } from "./path-parser";
import { parseAllSchemas } from "./schema-parser";

function onLeft(e: string): T.Task<void> {
  return T.fromIO(error(`Error: ${e}`));
}

function onRight(): T.Task<void> {
  return T.fromIO(log("Files generated succeessfully!"));
}

export function parse(inputFile: string, outputDir: string): void {
  const configuration: ParserConfiguration = {
    inputFile,
    outputDir
  };
  const initialContext = parserContext();

  const schemaParser = pipe(
    parseAllSchemas(),
    S.chain(() => parseAllApis())
  );

  const result = pipe(
    openApiParser(),
    SRTE.chain(() => SRTE.rightState(schemaParser)),
    SRTE.chain(() => writeModels())
  )(initialContext)(configuration);

  pipe(result, TE.fold(onLeft, onRight))();
}
