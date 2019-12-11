import { OpenAPIV3 } from "openapi-types";
import SwaggerParser from "swagger-parser";
import { writeModels } from "./file-writer";
import { parseApi } from "./path-parser";
import { GeneratedModels, parseAllSchemas } from "./schema-parser";

export interface ParserContext {
  document: OpenAPIV3.Document;
  generatedModels: GeneratedModels;
  outputDir: string;
}

export function parse(jsonFile: string): void {
  SwaggerParser.bundle(jsonFile).then(res => {
    const document = res as OpenAPIV3.Document;
    const parserContext: ParserContext = {
      document,
      generatedModels: {
        namesMap: {},
        refNameMap: {}
      },
      outputDir: "./out"
    };

    parseAllSchemas(parserContext);

    if (document.paths) {
      const gets = Object.entries(document.paths).reduce(
        (pathsMap, [path, pathObject]) => {
          if (pathObject.get) {
            const api = parseApi(path, "get", pathObject.get, parserContext);
            pathsMap.set(api.name, api);
          }
          return pathsMap;
        },
        new Map()
      );
    }

    writeModels(parserContext);
  });
}
