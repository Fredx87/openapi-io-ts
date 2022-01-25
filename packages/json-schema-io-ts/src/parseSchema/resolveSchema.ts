import { pipe } from "fp-ts/function";
import * as RNEA from "fp-ts/ReadonlyNonEmptyArray";
import * as RTE from "fp-ts/ReaderTaskEither";
import { JsonPointer, resolvePointer } from "../JsonReference";
import { ParseSchemaContext } from "../ParseSchemaContext";
import { SchemaOrRef } from "../types";
import { ParseSchemaRTE } from "./ParseSchemaRTE";

export function resolveSchema(
  jsonPointer: JsonPointer
): ParseSchemaRTE<SchemaOrRef> {
  return pipe(
    RTE.asks((r: ParseSchemaContext) => r.documents),
    RTE.chainW(({ rootDocumentUri, uriDocumentMap }) => {
      if (jsonPointer.tokens.length === 1 && jsonPointer.tokens[0] === "#") {
        return RTE.right(uriDocumentMap[rootDocumentUri]);
      }

      const absolutePointer = convertToAbsolutePointer(
        jsonPointer,
        rootDocumentUri
      );

      return pipe(
        resolvePointer<SchemaOrRef>(uriDocumentMap, absolutePointer),
        RTE.fromOption(
          () => new Error(`Cannot resolve pointer ${jsonPointer.toString()}`)
        )
      );
    })
  );
}

function convertToAbsolutePointer(
  jsonPointer: JsonPointer,
  rootDocumentUri: string
): JsonPointer {
  if (jsonPointer.tokens[0] !== "#") {
    return jsonPointer;
  }

  const absoluteTokens = pipe(
    jsonPointer.tokens,
    RNEA.updateHead(rootDocumentUri)
  );
  return new JsonPointer(absoluteTokens);
}
