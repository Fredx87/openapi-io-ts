import { OpenAPIV3 } from "openapi-types";
import SwaggerParser from "swagger-parser";
import { inspect } from "util";
import { parseApi } from "./path-parser";
import { GeneratedModels, parseAllSchemas } from "./schema-parser";

export interface ParserContext {
  document: OpenAPIV3.Document;
  generatedModels: GeneratedModels;
}

function getModelFileName(name: string) {
  return `./out/models/${name}.ts`;
}

function writeModels(models: GeneratedModels): void {
  for (const [name, typeRef] of Object.entries(models.namesMap)) {
    // todo: check depende
  }
}

export function parse(jsonFile: string): void {
  SwaggerParser.bundle(jsonFile).then(res => {
    const document = res as OpenAPIV3.Document;
    const parserContext: ParserContext = {
      document,
      generatedModels: {
        namesMap: {},
        refNameMap: {}
      }
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
      console.log(inspect(gets, false, 10, true));
    }

    console.log(inspect(parserContext.generatedModels, false, 10, true));
  });
}
