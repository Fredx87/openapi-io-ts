import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as R from "fp-ts/Record";
import * as A from "fp-ts/Array";
import { capitalize, CapitalizeCasing } from "../utils";
import { OPERATIONS_PATH, RUNTIME_PACKAGE, writeGeneratedFile } from "./common";
import { CodegenContext, CodegenRTE } from "./context";
import { operationName, operationTypesName } from "./operations";

export function generateOperationsIndex(): CodegenRTE<void> {
  return pipe(
    RTE.asks((context: CodegenContext) => context.parserOutput.tags),
    RTE.map(generateIndexContent),
    RTE.chain((content) =>
      writeGeneratedFile(OPERATIONS_PATH, `index.ts`, content)
    )
  );
}

function generateIndexContent(tags: Record<string, string[]>): string {
  const imports = pipe(Object.values(tags), A.flatten, generateImports);
  const tagsOperation = generateTagsOperations(tags);
  const requestFunctionsBuilder = generateRequestFunctionsBuilder(
    Object.keys(tags)
  );

  return `${imports}
  ${tagsOperation}
  ${requestFunctionsBuilder}`;
}

function generateImports(operationIds: string[]): string {
  const runtimeImports = `
  import {
    HttpRequestAdapter,
    MappedOperationRequestFunction,
    request,
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

function generateTagsOperations(tags: Record<string, string[]>): string {
  const generatedOperations = pipe(tags, R.mapWithIndex(generateTagOperations));
  return Object.values(generatedOperations).join("\n");
}

function generateTagOperations(tag: string, operationIds: string[]): string {
  return `
  export const ${tagOperationsName(tag)} = {
    ${operationIds.map((id) => `${id}: ${operationName(id)}, `).join("\n")}
   } as const;

   export interface ${tagOperationsTypeMapName(tag)} {
    ${operationIds.map((id) => `${id}: ${operationTypesName(id)}; `).join("\n")}
   }

   export const ${tagServiceBuilderName(tag)} = (
    requestAdapter: HttpRequestAdapter
  ): MappedOperationRequestFunction<
    typeof ${tagOperationsName(tag)},
    ${tagOperationsTypeMapName(tag)}
  > => ({
    ${operationIds
      .map(
        (id) =>
          `${id}: request(${tagOperationsName(tag)}.${id}, requestAdapter), `
      )
      .join("\n")}
  });
   `;
}

function generateRequestFunctionsBuilder(tags: string[]): string {
  return `export const requestFunctionsBuilder = (
    requestAdapter: HttpRequestAdapter
  ) => ({
    ${tags
      .map((tag) => `...${tagServiceBuilderName(tag)}(requestAdapter), `)
      .join("\n")}
  }); `;
}

function tagOperationsName(tag: string): string {
  return `${tagName(tag)}Operations`;
}

function tagOperationsTypeMapName(tag: string): string {
  return `${tagName(tag, "pascal")}OperationsTypesMap`;
}

function tagServiceBuilderName(tag: string): string {
  return `${tagName(tag)}ServiceBuilder`;
}

function tagName(tag: string, casing: CapitalizeCasing = "camel"): string {
  return `${capitalize(tag, casing)}`;
}
