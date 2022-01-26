import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import {
  resolveReference,
  JsonReference,
  createJsonReference,
} from "../jsonReference";
import { SchemaOrRef } from "../types";
import { ParseSchemaRTE } from "./ParseSchemaRTE";
import {
  readCurrentDocumentUri,
  readUriDocumentMap,
} from "../ParseSchemaContext";

export function resolveStringReference(
  stringReference: string
): ParseSchemaRTE<JsonReference> {
  return pipe(
    readCurrentDocumentUri(),
    RTE.map((currentDocumentUri) =>
      createJsonReference(stringReference, currentDocumentUri)
    )
  );
}

export function resolveSchema(
  jsonReference: JsonReference
): ParseSchemaRTE<SchemaOrRef> {
  return pipe(
    RTE.Do,
    RTE.bind("uriDocumentMap", () => readUriDocumentMap()),
    RTE.chainW(({ uriDocumentMap }) => {
      return pipe(
        resolveReference<SchemaOrRef>(uriDocumentMap, jsonReference),
        RTE.fromOption(
          () =>
            new Error(
              `Cannot resolve JSON reference ${JSON.stringify(jsonReference)}`
            )
        )
      );
    })
  );
}
