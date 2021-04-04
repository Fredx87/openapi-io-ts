import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import { TypeDeclaration, TypeReference } from "io-ts-codegen";
import {
  ComponentRefItemType,
  ComponentType,
  ItemOrRef,
} from "../parser/common";
import { CodegenContext, CodegenRTE } from "./context";
import { generateSchema } from "./schema";

export const SCHEMAS_PATH = "components/schemas";
export const PARAMETERS_PATH = "components/parameters";
export const RESPONSES_PATH = "components/responses";
export const REQUEST_BODIES_PATH = "components/requestBodies";
export const OPERATIONS_PATH = "operations";
export const SERVICES_PATH = "services";
export const RUNTIME_PACKAGE = "openapi-io-ts/dist/runtime";

export function getImports(): string {
  return `import * as t from "io-ts";
    import * as schemas from "./";
    import { DateFromISOString } from "io-ts-types/DateFromISOString";
    `;
}

export function generateSchemaIfDeclaration(
  type: TypeDeclaration | TypeReference
): string {
  return type.kind === "TypeDeclaration" ? generateSchema(type) : "";
}

export function writeGeneratedFile(
  path: string,
  fileName: string,
  content: string
): CodegenRTE<void> {
  return pipe(
    RTE.asks((context: CodegenContext) => context.outputDir),
    RTE.bindTo("outputDir"),
    RTE.bind("writeFile", () =>
      RTE.asks((context: CodegenContext) => context.writeFile)
    ),
    RTE.chainFirst(({ outputDir, writeFile }) =>
      RTE.fromTaskEither(writeFile(`${outputDir}/${path}`, fileName, content))
    ),
    RTE.map(() => void 0)
  );
}

export function getParsedItem<C extends ComponentType>(
  itemOrRef: ItemOrRef<C>
): CodegenRTE<ComponentRefItemType<C>> {
  if (itemOrRef._tag === "ParsedItem") {
    return RTE.right(itemOrRef);
  }

  return RTE.asks(
    (context) =>
      context.parserOutput.components[itemOrRef.componentType][
        itemOrRef.pointer
      ] as ComponentRefItemType<C>
  );
}

export function isParsedItem<C extends ComponentType>(
  itemOrRef: ItemOrRef<C>
): itemOrRef is ComponentRefItemType<C> {
  return itemOrRef._tag === "ParsedItem";
}

export function getItemOrRefPrefix<C extends ComponentType>(
  itemOrRef: ItemOrRef<C>
): string {
  return isParsedItem(itemOrRef) ? "" : `${itemOrRef.componentType}.`;
}
