import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as R from "fp-ts/Record";
import { capitalize, CapitalizeCasing } from "../utils";
import { OPERATIONS_PATH, RUNTIME_PACKAGE, writeGeneratedFile } from "./common";
import { CodegenContext, CodegenRTE } from "./context";
import { operationName, operationTypesName } from "./operations";

const OPERATIONS_OBJECT_NAME = "operations";
const OPERATIONS_TYPES_MAP_NAME = "OperationsTypesMap";
const MAPPED_OPERATION_REQUEST_FUNCTION_TYPE = `RequestFunctionsMap<${OPERATIONS_TYPES_MAP_NAME}>`;

export function generateOperationsIndex(): CodegenRTE<void> {
  return pipe(
    RTE.asks((context: CodegenContext) => context.parserOutput),
    RTE.map(({ operations, tags }) =>
      generateIndexContent(Object.keys(operations), tags)
    ),
    RTE.chain((content) =>
      writeGeneratedFile(OPERATIONS_PATH, `index.ts`, content)
    )
  );
}

function generateIndexContent(
  operationIds: string[],
  tags: Record<string, string[]>
): string {
  const imports = generateImports(operationIds);
  const requestFunctionsBuilder = generateRequestFunctionsBuilder(operationIds);
  const tagsOperation = generateTagsOperations(tags);

  return `${imports}

  ${requestFunctionsBuilder}

  ${tagsOperation}
  `;
}

function generateImports(operationIds: string[]): string {
  const runtimeImports = `
  import {
    HttpRequestAdapter,
    requestFunctionBuilder,
    RequestFunctionsMap,
  } from "${RUNTIME_PACKAGE}";`;

  const operationsImport = operationIds
    .map(
      (id) =>
        `import { ${operationName(id)}, ${operationTypesName(
          id
        )} } from "./${id}"`
    )
    .join("\n");

  return `${runtimeImports}
  ${operationsImport}`;
}

function generateRequestFunctionsBuilder(operationIds: string[]): string {
  return `
  export const ${OPERATIONS_OBJECT_NAME} = {
    ${operationIds.map((id) => `${id}: ${operationName(id)}, `).join("\n")}
   } as const;

   export interface ${OPERATIONS_TYPES_MAP_NAME} {
    ${operationIds.map((id) => `${id}: ${operationTypesName(id)}; `).join("\n")}
   }

  export const requestFunctionsBuilder = (
    requestAdapter: HttpRequestAdapter
  ): ${MAPPED_OPERATION_REQUEST_FUNCTION_TYPE} => ({
    ${operationIds
      .map(
        (id) =>
          `${id}: requestFunctionBuilder(${OPERATIONS_OBJECT_NAME}.${id}, requestAdapter),`
      )
      .join("\n")}
  })`;
}

function generateTagsOperations(tags: Record<string, string[]>): string {
  const generatedOperations = pipe(tags, R.mapWithIndex(generateTagOperations));
  return Object.values(generatedOperations).join("\n");
}

function generateTagOperations(tag: string, operationIds: string[]): string {
  return `
   export const ${tagServiceBuilderName(tag)} = (
    requestFunctions: ${MAPPED_OPERATION_REQUEST_FUNCTION_TYPE}
  ) => ({
    ${operationIds.map((id) => `${id}: requestFunctions.${id},`).join("\n")}
  });
   `;
}

function tagServiceBuilderName(tag: string): string {
  return `${tagName(tag)}ServiceBuilder`;
}

function tagName(tag: string, casing: CapitalizeCasing = "camel"): string {
  return `${capitalize(tag, casing)}`;
}
