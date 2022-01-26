import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as gen from "io-ts-codegen";
import { parseSchemaFromJsonReference } from "./parseSchema";
import { JsonReference } from "../jsonReference";
import { resolveStringReference } from "./resolvers";
import { ParseSchemaRTE } from "./types";
import {
  modifyCurrentDocumentUri,
  readCurrentDocumentUri,
  readGeneratedModelsRef,
} from "./ioRefs";

export function parseJsonReference(reference: string): ParseSchemaRTE {
  return pipe(
    getParsedReference(reference),
    RTE.chainW(O.fold(() => parseNewReference(reference), RTE.right))
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
        O.map(gen.identifier)
      )
    )
  );
}

function parseNewReference(stringReference: string): ParseSchemaRTE {
  return pipe(
    RTE.Do,
    RTE.bind("jsonReference", () => resolveStringReference(stringReference)),
    RTE.bind("parsedSchema", ({ jsonReference }) =>
      setCurrentDocumentUriAndParseSchema(jsonReference)
    ),
    RTE.map(({ parsedSchema }) => parsedSchema)
  );
}

function setCurrentDocumentUriAndParseSchema(
  jsonReference: JsonReference
): ParseSchemaRTE {
  return pipe(
    setCurrentDocumentUri(jsonReference),
    RTE.chainW(() => parseSchemaFromJsonReference(jsonReference)),
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
