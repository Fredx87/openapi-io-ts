import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import { TypeDeclaration } from "io-ts-codegen";
import { ParsedBody } from "../parser/body";
import { ParsedItem } from "../parser/common";
import { ParsedParameter } from "../parser/parameter";
import { ParsedResponse } from "../parser/response";
import { generateRequestBody } from "./body";
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
import { generateParameterDefinition } from "./parameter";
import { generateResponseDefinition } from "./response";
import { generateSchema } from "./schema";

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
  const content = `${getImports()}

    ${generateSchema(declaration.item)}`;

  return writeGeneratedFile(SCHEMAS_PATH, `${declaration.name}.ts`, content);
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
    import { ParameterDefinition } from "${RUNTIME_PACKAGE}";
    
    ${generateSchemaIfDeclaration(parameter.item.type)}
    
    export const ${
      parameter.name
    }: ParameterDefinition = ${generateParameterDefinition(parameter.item)}`;

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
    generateResponseDefinition(response),
    RTE.map((def) => `export const ${response.name} = ${def};`),
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

function writeRequestBodyFile(body: ParsedItem<ParsedBody>): CodegenRTE<void> {
  return pipe(
    generateRequestBody(body),
    RTE.right,
    RTE.map(
      (def) => `import * as schemas from '../schemas';
    
    ${def}`
    ),
    RTE.chain((content) =>
      writeGeneratedFile(REQUEST_BODIES_PATH, `${body.name}.ts`, content)
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
