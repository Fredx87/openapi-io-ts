import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import { TypeDeclaration } from "io-ts-codegen";
import { ParsedBody } from "../parser/body";
import { ParsedItem } from "../parser/common";
import { ParsedParameter } from "../parser/parameter";
import { ParsedResponse } from "../parser/response";
import { generateOperationBody, generateOperationBodySchema } from "./body";
import {
  generateSchemaIfDeclaration,
  getImports,
  PARAMETERS_PATH,
  REQUEST_BODIES_PATH,
  RESPONSES_PATH,
  RUNTIME_PACKAGE,
  SCHEMAS_PATH,
  writeGeneratedFile,
} from "./common";
import { CodegenContext, CodegenRTE } from "./context";
import { generateOperationParameter } from "./parameter";
import { generateComponentResponse } from "./response";
import { generateSchema } from "./schema";
import * as gen from "io-ts-codegen";

export function generateComponents(): CodegenRTE<void> {
  return pipe(
    RTE.asks((context: CodegenContext) => context.parserOutput.components),
    RTE.chain((components) =>
      pipe(
        generateSchemas(Object.values(components.schemas)),
        RTE.chain(() =>
          generateParameters(Object.values(components.parameters))
        ),
        RTE.chain(() => generateResponses(Object.values(components.responses))),
        RTE.chain(() =>
          generateRequestBodies(Object.values(components.requestBodies))
        )
      )
    )
  );
}

function generateSchemas(
  schemas: ParsedItem<TypeDeclaration>[]
): CodegenRTE<void> {
  return writeComponentsFiles(SCHEMAS_PATH, schemas, writeSchemaFile);
}

function writeSchemaFile(
  declaration: ParsedItem<TypeDeclaration>
): CodegenRTE<void> {
  const content = `${getSchemaFileImports(declaration)}

    ${generateSchema(declaration.item).replace(/schemas./g, "")}`;

  return writeGeneratedFile(SCHEMAS_PATH, `${declaration.name}.ts`, content);
}

function getSchemaFileImports(
  declaration: ParsedItem<TypeDeclaration>
): string {
  const dependencies = gen.getNodeDependencies(declaration.item);
  const imports = dependencies.map((d) => {
    if (d.startsWith("schemas.")) {
      const schemaName = d.replace("schemas.", "");
      return `import { ${schemaName} } from "./${schemaName}"`;
    }

    if (d === "DateFromISOString") {
      return `import { DateFromISOString } from "io-ts-types/DateFromISOString"`;
    }

    return "";
  });

  return `import * as t from "io-ts";
  ${imports.join("\n")}`;
}

function generateParameters(
  parameters: ParsedItem<ParsedParameter>[]
): CodegenRTE<void> {
  return writeComponentsFiles(PARAMETERS_PATH, parameters, writeParameterFile);
}

function writeParameterFile(
  parameter: ParsedItem<ParsedParameter>
): CodegenRTE<void> {
  const content = `${getImports()}
    import { OperationParameter } from "${RUNTIME_PACKAGE}";
    
    ${generateSchemaIfDeclaration(parameter.item.type)}
    
    export const ${
      parameter.name
    }: OperationParameter = ${generateOperationParameter(parameter.item)}`;

  return writeGeneratedFile(PARAMETERS_PATH, `${parameter.name}.ts`, content);
}

function generateResponses(
  responses: ParsedItem<ParsedResponse>[]
): CodegenRTE<void> {
  return writeComponentsFiles(RESPONSES_PATH, responses, writeResponseFile);
}

function writeResponseFile(
  response: ParsedItem<ParsedResponse>
): CodegenRTE<void> {
  return pipe(
    generateComponentResponse(response),
    RTE.map(
      (code) => `import * as t from "io-ts";
      import * as schemas from "../schemas";
      import * as responses from "../responses";

      ${code}`
    ),
    RTE.chain((content) =>
      writeGeneratedFile(RESPONSES_PATH, `${response.name}.ts`, content)
    )
  );
}

function generateRequestBodies(
  bodies: ParsedItem<ParsedBody>[]
): CodegenRTE<void> {
  return writeComponentsFiles(
    REQUEST_BODIES_PATH,
    bodies,
    writeRequestBodyFile
  );
}

function writeRequestBodyFile(
  parsedBody: ParsedItem<ParsedBody>
): CodegenRTE<void> {
  return pipe(
    RTE.Do,
    RTE.bind("schema", () =>
      RTE.right(generateOperationBodySchema(parsedBody.item))
    ),
    RTE.bind("body", () => RTE.right(generateOperationBody(parsedBody))),
    RTE.map(
      ({ schema, body }) => `import { OperationBody } from "${RUNTIME_PACKAGE}";
      import * as t from "io-ts";
      import * as schemas from "../schemas";
      ${schema}
      
      export const ${parsedBody.name}: OperationBody = ${body}`
    ),
    RTE.chain((content) =>
      writeGeneratedFile(REQUEST_BODIES_PATH, `${parsedBody.name}.ts`, content)
    )
  );
}

function writeComponentsFiles<T>(
  indexPath: string,
  components: ParsedItem<T>[],
  writeFile: (item: ParsedItem<T>) => CodegenRTE<void>
): CodegenRTE<void> {
  return pipe(
    components,
    RTE.traverseSeqArray((component) =>
      pipe(
        writeFile(component),
        RTE.map(() => component.name)
      )
    ),
    RTE.chain((names) => writeIndex(indexPath, names))
  );
}

function writeIndex(path: string, names: readonly string[]): CodegenRTE<void> {
  if (names.length === 0) {
    return RTE.right(void 0);
  }

  const content = names.map((n) => `export * from "./${n}";`).join("\n");
  return writeGeneratedFile(path, "index.ts", content);
}
