import { pipe } from "fp-ts/function";
import * as IO from "fp-ts/IO";
import * as IORef from "fp-ts/IORef";
import * as RNEA from "fp-ts/ReadonlyNonEmptyArray";
import camelCase from "lodash/camelCase";
import upperFirst from "lodash/upperFirst";
import { JsonPointer } from "./JsonReference";
import { GeneratedModels } from "./GeneratedModels";
import { ParsableDocument } from "./types";

export type UriDocumentMap = Record<string, ParsableDocument>;

export interface ParseSchemaDocuments {
  rootDocumentUri: string;
  uriDocumentMap: UriDocumentMap;
}

export interface ModelGenerationInfo {
  name: string;
  importData?: {
    prefix: string;
    path: string;
  };
}

export type ModelGenerationInfoFn = (
  pointer: JsonPointer
) => ModelGenerationInfo;

export interface ParseSchemaContext {
  documents: ParseSchemaDocuments;
  generatedModelsRef: IORef.IORef<GeneratedModels>;
  modelGenerationInfoFn: ModelGenerationInfoFn;
}

const defaultModelGenerationInfo: ModelGenerationInfoFn = (pointer) =>
  pipe(pointer.tokens, RNEA.last, (lastToken) => ({
    name: upperFirst(camelCase(lastToken)),
  }));

const emptyParseSchemaResult: GeneratedModels = {
  modelNameTypeMap: {},
  pointerModelNameMap: {},
  prefixImportPathMap: {
    tTypes: "io-ts-types",
  },
};

export function createSchemaContext(
  documents: ParseSchemaDocuments,
  modelGenerationInfoFn = defaultModelGenerationInfo
): IO.IO<ParseSchemaContext> {
  return pipe(
    IORef.newIORef(emptyParseSchemaResult),
    IO.map((generatedModelsRef) => ({
      documents,
      generatedModelsRef,
      modelGenerationInfoFn,
    }))
  );
}
