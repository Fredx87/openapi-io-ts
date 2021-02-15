import * as A from "fp-ts/Array";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";
import { OpenAPIV3 } from "openapi-types";
import { createPointer } from "../common/JSONReference";
import { GenRTE, readParserState } from "../environment";
import { getOrCreateModel } from "./models";

function parseDocumentSchemas(
  schemas: Record<string, OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject>
): GenRTE<unknown> {
  return pipe(
    A.array.traverse(RTE.readerTaskEitherSeq)(Object.keys(schemas), (name) => {
      const pointer = createPointer("#/components/schemas", name);
      return getOrCreateModel(pointer, name);
    })
  );
}

function getSchemas(): GenRTE<
  O.Option<Record<string, OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject>>
> {
  return pipe(
    readParserState(),
    RTE.map((state) => O.fromNullable(state.document.components?.schemas))
  );
}

export function parseAllSchemas(): GenRTE<unknown> {
  return pipe(
    getSchemas(),
    RTE.chain(O.fold(() => RTE.right(undefined), parseDocumentSchemas))
  );
}
