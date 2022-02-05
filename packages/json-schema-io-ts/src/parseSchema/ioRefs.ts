import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";
import { ParseSchemaContext, UriDocumentMap } from "./ParseSchemaContext";
import { GeneratedModels } from "./modelGeneration";
import { ParseSchemaRTE } from "./types";
import { JsonReference } from "../jsonReference";

export function readGeneratedModelsRef(): ParseSchemaRTE<
  GeneratedModels,
  never
> {
  return pipe(
    RTE.asks((r: ParseSchemaContext) => r.generatedModelsRef),
    RTE.chainW((resultRef) => pipe(resultRef.read, RTE.rightIO))
  );
}

export function modifyGeneratedModelsRef(
  fn: (currentRes: GeneratedModels) => GeneratedModels
): ParseSchemaRTE<void, never> {
  return pipe(
    RTE.asks((r: ParseSchemaContext) => r.generatedModelsRef),
    RTE.chainW((resultRef) => pipe(resultRef.modify(fn), RTE.rightIO))
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

export function setCurrentDocumentUriIfNeeded({
  uri,
}: JsonReference): ParseSchemaRTE<void> {
  return pipe(
    readCurrentDocumentUri(),
    RTE.chain((currentDocumentUri) =>
      uri !== currentDocumentUri
        ? modifyCurrentDocumentUri(O.some(uri))
        : RTE.right(undefined)
    )
  );
}

export function resetCurrentDocumentUri(): ParseSchemaRTE<void> {
  return modifyCurrentDocumentUri(O.none);
}

function modifyCurrentDocumentUri(
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
