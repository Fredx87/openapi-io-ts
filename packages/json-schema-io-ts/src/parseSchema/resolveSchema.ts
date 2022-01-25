import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import { JsonPointer, resolvePointer } from "../JsonReference";
import { ParseSchemaContext } from "../ParseSchemaContext";
import { SchemaOrRef } from "../types";
import { ParseSchemaRTE } from "./ParseSchemaRTE";

export function resolveSchema(
  jsonPointer: JsonPointer
): ParseSchemaRTE<SchemaOrRef> {
  return pipe(
    RTE.asks((r: ParseSchemaContext) => r.document),
    RTE.chainW((document) =>
      pipe(
        resolvePointer<SchemaOrRef>(document, jsonPointer),
        RTE.fromOption(
          () => new Error(`Cannot resolve pointer ${jsonPointer.toString()}`)
        )
      )
    )
  );
}
