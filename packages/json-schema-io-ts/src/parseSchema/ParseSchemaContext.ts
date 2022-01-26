import { pipe } from "fp-ts/function";
import * as IO from "fp-ts/IO";
import * as IORef from "fp-ts/IORef";
import * as O from "fp-ts/Option";
import {
  defaultModelGenerationInfo,
  initialGeneratedModels,
  GeneratedModels,
  ModelGenerationInfoFn,
} from "./modelGeneration";
import { ParsableDocument } from "./types";

export type UriDocumentMap = Record<string, ParsableDocument>;

export interface ParseSchemaContext {
  rootDocumentUri: string;
  uriDocumentMap: UriDocumentMap;
  currentDocumentUriRef: IORef.IORef<O.Option<string>>;
  generatedModelsRef: IORef.IORef<GeneratedModels>;
  modelGenerationInfoFn: ModelGenerationInfoFn;
}

export function createSchemaContext(
  rootDocumentUri: string,
  uriDocumentMap: UriDocumentMap,
  modelGenerationInfoFn = defaultModelGenerationInfo
): IO.IO<ParseSchemaContext> {
  return pipe(
    IO.Do,
    IO.bind("currentDocumentUriRef", () => IORef.newIORef(O.none)),
    IO.bind("generatedModelsRef", () => IORef.newIORef(initialGeneratedModels)),
    IO.map(({ currentDocumentUriRef, generatedModelsRef }) => ({
      rootDocumentUri,
      uriDocumentMap,
      currentDocumentUriRef,
      generatedModelsRef,
      modelGenerationInfoFn,
    }))
  );
}
