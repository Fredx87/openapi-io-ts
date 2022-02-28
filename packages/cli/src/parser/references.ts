import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import {
  JsonReference,
  resolveReferenceFromContext,
  resolveStringReference,
} from "json-schema-io-ts";
import { ParserContext, ParserRTE } from "./context";

export function getObjectFromStringReference<T>(
  reference: string
): ParserRTE<T> {
  return pipe(
    resolveStringReferenceInParser(reference),
    RTE.chain((jsonReference) =>
      resolveObjectFromJsonReference<T>(jsonReference)
    )
  );
}

export function resolveStringReferenceInParser(
  reference: string
): ParserRTE<JsonReference> {
  return pipe(
    RTE.asks((c: ParserContext) => c.parseSchemaContext),
    RTE.chainW((parseSchemaContext) =>
      pipe(
        resolveStringReference(reference)(parseSchemaContext),
        RTE.fromTaskEither
      )
    )
  );
}

export function resolveObjectFromJsonReference<T>(
  jsonReference: JsonReference
): ParserRTE<T> {
  return pipe(
    RTE.asks((c: ParserContext) => c.parseSchemaContext),
    RTE.chainW((parseSchemaContext) =>
      pipe(
        resolveReferenceFromContext<T>(jsonReference)(parseSchemaContext),
        RTE.fromTaskEither
      )
    )
  );
}
