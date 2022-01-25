import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as gen from "io-ts-codegen";
import { parseSchema } from "./parseSchema";
import { ParseSchemaRTE } from "./ParseSchemaRTE";
import { readGeneratedModelsRef } from "./generatedModels";

export function parseJsonReference(pointer: string): ParseSchemaRTE {
  return pipe(
    getParsedReference(pointer),
    RTE.chainW(
      O.fold(
        () => parseNewReference(pointer),
        (r) => RTE.right(r)
      )
    )
  );
}

function getParsedReference(
  pointer: string
): ParseSchemaRTE<O.Option<gen.TypeReference>, never> {
  return pipe(
    readGeneratedModelsRef(),
    RTE.map((currentRes) =>
      pipe(
        currentRes.pointerModelNameMap[pointer],
        O.fromNullable,
        O.map((name) => gen.identifier(name))
      )
    )
  );
}

/**
 * Parse a new ref. If the ref was added to generated model, returns the model name.
 * Otherwise it returns the parsed schema.
 *
 * @param pointer JSON pointer of the reference to add
 * @returns the new parsed reference
 */
function parseNewReference(pointer: string): ParseSchemaRTE {
  return pipe(
    RTE.Do,
    RTE.bind("parsedSchema", () => parseSchema(pointer, true)),
    RTE.bindW("reference", () => getParsedReference(pointer)),
    RTE.map(({ parsedSchema, reference }) =>
      pipe(
        reference,
        O.fold(
          () => parsedSchema,
          (ref) => ref
        )
      )
    )
  );
}
