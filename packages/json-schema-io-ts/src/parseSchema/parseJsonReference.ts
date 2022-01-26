import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as gen from "io-ts-codegen";
import { parseSchemaFromJsonReference } from "./parseSchema";
import { ParseSchemaRTE } from "./ParseSchemaRTE";
import { readGeneratedModelsRef } from "./generatedModels";
import {
  modifyCurrentDocumentUri,
  readCurrentDocumentUri,
} from "../ParseSchemaContext";
import { JsonReference } from "../jsonReference";
import { resolveStringReference } from "./resolvers";

export function parseJsonReference(reference: string): ParseSchemaRTE {
  return pipe(
    getParsedReference(reference),
    RTE.chainW(
      O.fold(
        () => parseNewReference(reference),
        (r) => RTE.right(r)
      )
    )
  );
}

function getParsedReference(
  stringReference: string
): ParseSchemaRTE<O.Option<gen.TypeReference>, never> {
  return pipe(
    readGeneratedModelsRef(),
    RTE.map((currentRes) =>
      pipe(
        currentRes.referenceModelNameMap[stringReference],
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
 * @param stringReference JSON pointer of the reference to add
 * @returns the new parsed reference
 */
function parseNewReference(stringReference: string): ParseSchemaRTE {
  return pipe(
    RTE.Do,
    RTE.bind("parsedSchema", () =>
      setCurrentDocumentUriAndParseSchema(stringReference)
    ),
    RTE.bindW("reference", () => getParsedReference(stringReference)),
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

function setCurrentDocumentUriAndParseSchema(
  stringReference: string
): ParseSchemaRTE {
  return pipe(
    RTE.Do,
    RTE.bind("jsonReference", () => resolveStringReference(stringReference)),
    RTE.bind("documentUri", ({ jsonReference }) =>
      setCurrentDocumentUri(jsonReference)
    ),
    RTE.chainW(({ jsonReference }) =>
      parseSchemaFromJsonReference(jsonReference, true)
    ),
    RTE.chainFirstW(() => modifyCurrentDocumentUri(O.none))
  );
}

function setCurrentDocumentUri({ uri }: JsonReference): ParseSchemaRTE<void> {
  return pipe(
    readCurrentDocumentUri(),
    RTE.chain((currentDocumentUri) =>
      uri !== currentDocumentUri
        ? modifyCurrentDocumentUri(O.some(uri))
        : RTE.right(undefined)
    )
  );
}
