import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import { TypeDeclaration } from "io-ts-codegen";
import { GenRTE } from "../environment";
import {
  GenericComponent,
  ParsedComponents,
  SchemaComponent,
} from "../parser/common";
import { ParsedParameterObject } from "../parser/parameter";
import {
  generateSchemaIfDeclaration,
  getImports,
  writeFormatted,
} from "./common";
import { generateParameterDefinition } from "./parameter";
import { generateSchema } from "./schema";

export function generateComponents(components: ParsedComponents): GenRTE<void> {
  const { schemas, parameters, bodies, responses } = components;

  return pipe(
    generateSchemas(Object.values(schemas)),
    RTE.chain(() => generateParameters(Object.values(parameters)))
  );
}

function generateSchemas(schemas: SchemaComponent[]): GenRTE<void> {
  return pipe(
    schemas,
    RTE.traverseSeqArray((schema) => writeSchemaFile(schema.type)),
    RTE.chain(() =>
      writeIndex(
        `components/schemas/index.ts`,
        schemas.map((s) => s.type.name)
      )
    )
  );
}

function writeSchemaFile(declaration: TypeDeclaration): GenRTE<void> {
  const content = `${getImports()}
    ${generateSchema(declaration)}`;

  return writeFormatted(`components/schemas/${declaration.name}.ts`, content);
}

function generateParameters(
  parameters: GenericComponent<ParsedParameterObject>[]
): GenRTE<void> {
  return pipe(
    parameters,
    RTE.traverseSeqArray((p) => writeParameterFile(p)),
    RTE.chain(() =>
      writeIndex(
        `components/parameters/index.ts`,
        parameters.map((p) => p.name)
      )
    )
  );
}

function writeParameterFile(
  parameter: GenericComponent<ParsedParameterObject>
): GenRTE<void> {
  const content = `${getImports()}
    import { ParameterDefinition } from "../../openapi-client/parameter";
    
    ${generateSchemaIfDeclaration(parameter.object.type)}
    
    export const ${
      parameter.name
    }: ParameterDefinition = ${generateParameterDefinition(parameter.object)}`;

  return writeFormatted(`components/parameters/${parameter.name}.ts`, content);
}

function writeIndex(fileName: string, names: string[]): GenRTE<void> {
  const content = names.map((n) => `export * from "./${n}";`).join("\n");
  return writeFormatted(fileName, content);
}
