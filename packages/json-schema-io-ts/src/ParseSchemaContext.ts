import { pipe } from "fp-ts/function";
import * as IO from "fp-ts/IO";
import * as IORef from "fp-ts/IORef";
import * as O from "fp-ts/Option";
import * as RNEA from "fp-ts/ReadonlyNonEmptyArray";
import * as RTE from "fp-ts/ReaderTaskEither";
import camelCase from "lodash/camelCase";
import upperFirst from "lodash/upperFirst";
import { JsonPointer } from "./JsonReference";
import { GeneratedModels } from "./GeneratedModels";
import { ParsableDocument } from "./types";
import { ParseSchemaRTE } from "./parseSchema/ParseSchemaRTE";

export type UriDocumentMap = Record<string, ParsableDocument>;

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
  rootDocumentUri: string;
  uriDocumentMap: UriDocumentMap;
  currentDocumentUriRef: IORef.IORef<O.Option<string>>;
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
  rootDocumentUri: string,
  uriDocumentMap: UriDocumentMap,
  modelGenerationInfoFn = defaultModelGenerationInfo
): IO.IO<ParseSchemaContext> {
  return pipe(
    IO.Do,
    IO.bind("currentDocumentUriRef", () => IORef.newIORef(O.none)),
    IO.bind("generatedModelsRef", () => IORef.newIORef(emptyParseSchemaResult)),
    IO.map(({ currentDocumentUriRef, generatedModelsRef }) => ({
      rootDocumentUri,
      uriDocumentMap,
      currentDocumentUriRef,
      generatedModelsRef,
      modelGenerationInfoFn,
    }))
  );
}

export function readUriDocumentMap(): ParseSchemaRTE<UriDocumentMap, never> {
  return pipe(RTE.asks((r) => r.uriDocumentMap));
}

export function readCurrentDocumentUri(): ParseSchemaRTE<string, never> {
  return pipe(
    RTE.Do,
    RTE.bind("rootDocumentUri", () =>
      RTE.asks((r: ParseSchemaContext) => r.rootDocumentUri)
    ),
    RTE.bindW("currentDocumentUri", () =>
      pipe(
        RTE.asks((r: ParseSchemaContext) => r.currentDocumentUriRef),
        RTE.chainW((ref) => pipe(ref.read, RTE.rightIO))
      )
    ),
    RTE.map(({ rootDocumentUri, currentDocumentUri }) =>
      pipe(
        currentDocumentUri,
        O.getOrElse(() => rootDocumentUri)
      )
    )
  );
}

export function modifyCurrentDocumentUri(
  currentDocumentUri: O.Option<string>
): ParseSchemaRTE<void, never> {
  return pipe(
    RTE.asks((r: ParseSchemaContext) => r.currentDocumentUriRef),
    RTE.chainW((ref) =>
      pipe(
        ref.modify(() => currentDocumentUri),
        RTE.rightIO
      )
    )
  );
}
