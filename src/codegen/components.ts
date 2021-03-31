import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import { TypeDeclaration } from "io-ts-codegen";
import { ParsedParameter } from "../parser/parameter";
import {
  generateSchemaIfDeclaration,
  getImports,
  PARAMETERS_PATH,
  SCHEMAS_PATH,
  writeGeneratedFile,
} from "./common";
import { CodegenContext, CodegenRTE } from "./context";
import { generateParameterDefinition } from "./parameter";
import { generateSchema } from "./schema";
import { ParsedItem } from "../parser/common";

export function generateComponents(): CodegenRTE<void> {
  return pipe(
    RTE.asks((context: CodegenContext) => context.parserOutput.components),
    RTE.chain((components) =>
      pipe(
        generateSchemas(Object.values(components.schemas)),
        RTE.chain(() =>
          generateParameters(Object.values(components.parameters))
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
    import { ParameterDefinition } from "../../openapi-client/parameter";
    
    ${generateSchemaIfDeclaration(parameter.item.type)}
    
    export const ${
      parameter.name
    }: ParameterDefinition = ${generateParameterDefinition(parameter.item)}`;

  return writeGeneratedFile(PARAMETERS_PATH, `${parameter.name}.ts`, content);
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
  const content = names.map((n) => `export * from "./${n}";`).join("\n");
  return writeGeneratedFile(path, "index.ts", content);
}
