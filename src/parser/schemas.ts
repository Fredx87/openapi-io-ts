import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";
import { TypeReference } from "io-ts-codegen";
import { OpenAPIV3 } from "openapi-types";
import { createPointer } from "../common/JSONReference";
import { ParserRTE, readParserState } from "./context";
import { getOrCreateModel } from "./models";

function parseDocumentSchemas(
  schemas: Record<string, OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject>
): ParserRTE<TypeReference[]> {
  const tasks = Object.keys(schemas).map((name) => {
    const pointer = createPointer("#/components/schemas", name);
    return getOrCreateModel(pointer, name);
  });
  return RTE.sequenceSeqArray(tasks) as ParserRTE<TypeReference[]>;
}

function getSchemas(): ParserRTE<
  O.Option<Record<string, OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject>>
> {
  return pipe(
    readParserState(),
    RTE.map((state) => O.fromNullable(state.document.components?.schemas))
  );
}

export function parseAllSchemas(): ParserRTE<void> {
  return pipe(
    getSchemas(),
    RTE.chain(
      O.fold(
        () => RTE.right(undefined),
        (schemas) =>
          pipe(
            parseDocumentSchemas(schemas),
            RTE.map(() => {})
          )
      )
    )
  );
}
