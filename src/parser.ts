import { pipe } from "fp-ts/lib/pipeable";
import * as S from "fp-ts/lib/State";
import * as SRTE from "fp-ts/lib/StateReaderTaskEither";
import { OpenAPIV3 } from "openapi-types";
import SwaggerParser from "swagger-parser";
import { writeModels } from "./file-writer";
import { ParserConfiguration } from "./parser-configuration";
import { parserContext } from "./parser-context";
import { parseAllApis } from "./path-parser";
import { parseAllSchemas } from "./schema-parser";

export function parse(inputFile: string, outputDir: string): void {
  const configuration: ParserConfiguration = {
    inputFile,
    outputDir
  };
  SwaggerParser.bundle(inputFile)
    .then(res => {
      const document = res as OpenAPIV3.Document;
      const initialContext = parserContext(document);

      const schemaParser = pipe(
        parseAllSchemas(),
        S.chain(() => parseAllApis())
      );

      pipe(
        SRTE.rightState(schemaParser),
        SRTE.chain(() => writeModels())
      )(initialContext)(configuration)();
    })
    .catch(console.error);
}
