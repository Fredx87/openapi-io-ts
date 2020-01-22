import * as STE from "fp-ts-contrib/lib/StateTaskEither";
import { error, log } from "fp-ts/lib/Console";
import { pipe } from "fp-ts/lib/pipeable";
import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import { writeModels } from "./file-writer";
import { openApiParser } from "./openapi-parser";
import { parserContext, ParserContext } from "./parser-context";
import { parseAllApis } from "./path-parser";
import { parseAllSchemas } from "./schema-parser";
import { ParserSTE } from "./utils";
import { inspect } from "util";

function onLeft(e: string): T.Task<void> {
  return T.fromIO(error(`Error: ${e}`));
}

function onRight(): T.Task<void> {
  return T.fromIO(log("Files generated succeessfully!"));
}

export function parse(inputFile: string, outputDir: string): void {
  const initialContext = parserContext(inputFile, outputDir);

  function printModels(): ParserSTE {
    return pipe(
      STE.get<ParserContext>(),
      STE.map((a: any) => {
        console.log(JSON.stringify(a));
      })
    );
  }

  const result = pipe(
    openApiParser(),
    STE.chain(() => parseAllSchemas()),
    STE.chain(() => parseAllApis()),
    STE.chain(printModels),
    STE.chain(() => writeModels())
  )(initialContext);

  pipe(result, TE.fold(onLeft, onRight))();
}
