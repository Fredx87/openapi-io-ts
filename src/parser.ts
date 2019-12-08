import * as gen from "io-ts-codegen";
import { OpenAPIV3 } from "openapi-types";

import SwaggerParser from "swagger-parser";
import { parseSchema, getReferenceName } from "./schema-parser";
import { writeFile, writeFileSync, appendFileSync } from "fs";
import { pascalCase } from "./utils";
import * as prettier from "prettier";
import { parseApi } from "./path-parser";
import { inspect } from "util";

export function printSchema(name: string, type: gen.TypeReference): string {
  return `export const ${name} = ${gen.printRuntime(type)};
  
  export type ${name} = t.TypeOf<typeof ${name}>;

  `;
}

export function getComponentParameterName(name: string): string {
  return `${name}Parameter`;
}

export function getComponentRequestBodyName(name: string): string {
  return `${name}RequestBody`;
}

function generateComponentsTypesDeclaration(
  components: OpenAPIV3.ComponentsObject
) {
  const { schemas, parameters, requestBodies } = components;
  let res = `import * as t from 'io-ts';
  import { DateFromISOString } from 'io-ts-types/lib/DateFromISOString';
  
  `;

  if (schemas) {
    for (const [name, value] of Object.entries(schemas)) {
      res += printSchema(name, parseSchema(value));
    }
  }

  if (parameters) {
    for (const [name, value] of Object.entries(parameters)) {
      if ("$ref" in value) {
        continue;
      }
      if (value.schema) {
        res += printSchema(
          getComponentParameterName(name),
          parseSchema(value.schema)
        );
      }
    }
  }

  if (requestBodies) {
    for (const [name, value] of Object.entries(requestBodies)) {
      if ("$ref" in value) {
        continue;
      }
      if (value.content["application/json"].schema) {
        res += printSchema(
          getComponentRequestBodyName(name),
          parseSchema(value.content["application/json"].schema)
        );
      }
    }
  }

  const content = prettier.format(res, {
    parser: "typescript"
  });
  writeFileSync("./out/models.ts", content);
}

export function parse(jsonFile: string): void {
  SwaggerParser.bundle(jsonFile).then(res => {
    const doc = res as OpenAPIV3.Document;

    if (doc.components) {
      generateComponentsTypesDeclaration(doc.components);
    }

    if (doc.paths) {
      const gets = Object.entries(doc.paths).reduce(
        (pathsMap, [path, pathObject]) => {
          if (pathObject.get) {
            const api = parseApi(path, "get", pathObject.get, doc);
            pathsMap.set(api.name, api);
          }

          return pathsMap;
        },
        new Map()
      );
      console.log(inspect(gets, false, 10, true));
    }
  });
}
