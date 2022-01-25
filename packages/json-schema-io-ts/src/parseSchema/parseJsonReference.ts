import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as gen from "io-ts-codegen";
import { parseSchema } from "./parseSchema";
import { ParseSchemaRTE } from "./ParseSchemaRTE";
import { readResultRef } from "./resultRef";

export function parseJsonReference(pointer: string): ParseSchemaRTE {
  return pipe(
    getParsedReference(pointer),
    RTE.chainW(
      O.fold(
        () => parseSchema(pointer),
        (r) => RTE.right(r)
      )
    )
  );
}

function getParsedReference(
  pointer: string
): ParseSchemaRTE<O.Option<gen.TypeReference>, never> {
  return pipe(
    readResultRef(),
    RTE.map((currentRes) =>
      pipe(
        currentRes.pointerModelNameMap[pointer],
        O.fromNullable,
        O.map((name) => gen.customCombinator(name, name))
      )
    )
  );
}
