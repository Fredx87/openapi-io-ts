import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import { TypeDeclaration } from "io-ts-codegen";
import {
  GenericComponent,
  ParsedComponents,
  SchemaComponent,
} from "../parser/common";
import { ParsedParameterObject } from "../parser/parameter";
import {
  generateSchemaIfDeclaration,
  getImports,
  PARAMETERS_PATH,
  SCHEMAS_PATH,
  writeGeneratedFile,
} from "./common";
import { CodegenRTE } from "./context";
import { generateParameterDefinition } from "./parameter";
import { generateSchema } from "./schema";

export function generateComponents(
  components: ParsedComponents
): CodegenRTE<void> {
  const { schemas, parameters, bodies, responses } = components;

  return pipe(
    generateSchemas(Object.values(schemas)),
    RTE.chain(() => generateParameters(Object.values(parameters)))
  );
}

function generateSchemas(schemas: SchemaComponent[]): CodegenRTE<void> {
  return pipe(
    schemas,
    RTE.traverseSeqArray((schema) => writeSchemaFile(schema.type)),
    RTE.chain(() =>
      writeIndex(
        SCHEMAS_PATH,
        schemas.map((s) => s.type.name)
      )
    )
  );
}

function writeSchemaFile(declaration: TypeDeclaration): CodegenRTE<void> {
  const content = `${getImports()}

    ${generateSchema(declaration)}`;

  return writeGeneratedFile(SCHEMAS_PATH, `${declaration.name}.ts`, content);
}

function generateParameters(
  parameters: GenericComponent<ParsedParameterObject>[]
): CodegenRTE<void> {
  return pipe(
    parameters,
    RTE.traverseSeqArray(writeParameterFile),
    RTE.chain(() =>
      writeIndex(
        PARAMETERS_PATH,
        parameters.map((p) => p.name)
      )
    )
  );
}

function writeParameterFile(
  parameter: GenericComponent<ParsedParameterObject>
): CodegenRTE<void> {
  const content = `${getImports()}
    import { ParameterDefinition } from "../../openapi-client/parameter";
    
    ${generateSchemaIfDeclaration(parameter.object.type)}
    
    export const ${
      parameter.name
    }: ParameterDefinition = ${generateParameterDefinition(parameter.object)}`;

  return writeGeneratedFile(PARAMETERS_PATH, `${parameter.name}.ts`, content);
}

function writeIndex(path: string, names: string[]): CodegenRTE<void> {
  const content = names.map((n) => `export * from "./${n}";`).join("\n");
  return writeGeneratedFile(path, "index.ts", content);
}
