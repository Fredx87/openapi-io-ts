import { pipe } from "fp-ts/lib/pipeable";
import * as S from "fp-ts/lib/State";
import { OpenAPIV3 } from "openapi-types";
import SwaggerParser from "swagger-parser";
import { writeModels } from "./file-writer";
import { parserContext } from "./parser-context";
import { parseAllApis } from "./path-parser";
import { parseAllSchemas } from "./schema-parser";

export function parse(inputFile: string, outputDir: string): void {
  SwaggerParser.bundle(inputFile)
    .then(res => {
      const document = res as OpenAPIV3.Document;
      const initialContext = parserContext(outputDir, document);

      pipe(
        parseAllSchemas(),
        S.chain(() => parseAllApis()),
        S.chain(() => writeModels())
      )(initialContext);
    })
    .catch(console.error);
}
