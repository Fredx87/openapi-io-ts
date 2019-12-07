import * as gen from "io-ts-codegen";
import { OpenAPIV3 } from "openapi-types";
import * as prettier from "prettier";
import SwaggerParser from "swagger-parser";
import { parseSchema } from "./schema-parser";

function printSchema(
  name: string,
  type: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject
): string {
  return `export const ${name} = ${gen.printRuntime(parseSchema(type))};
  
  export type ${name} = t.TypeOf<typeof ${name}>;

  `;
}

function printSchemas(
  schemas: Record<string, OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject>
): string {
  let res = `import * as t from 'io-ts';
  import { DateFromISOString } from 'io-ts-types/lib/DateFromISOString';
  
  `;
  for (const [name, value] of Object.entries(schemas)) {
    res += printSchema(name, value);
  }
  return res;
}

export function parse(jsonFile: string): void {
  SwaggerParser.bundle(jsonFile).then(res => {
    const doc = res as OpenAPIV3.Document;

    if (doc.components) {
      if (doc.components.schemas) {
        console.log(
          prettier.format(printSchemas(doc.components.schemas), {
            parser: "typescript"
          })
        );
      }
    }
  });
}
