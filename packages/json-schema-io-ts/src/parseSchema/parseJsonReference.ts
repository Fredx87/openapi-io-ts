import { pipe, identity } from "fp-ts/function";
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
import { JsonReference, jsonReferenceToString } from "../jsonReference";
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

function parseNewReference(stringReference: string): ParseSchemaRTE {
  return pipe(
    RTE.Do,
    RTE.bind("jsonReference", () => resolveStringReference(stringReference)),
    RTE.bind("parsedSchema", ({ jsonReference }) =>
      setCurrentDocumentUriAndParseSchema(jsonReference)
    ),
    /* 
      Try to get the model from the parsed references. 
      If found, returns the identifier of the model.
      If not found, no model was generated and the parsed type is returned
     */
    RTE.bindW("parsedReference", ({ jsonReference }) =>
      getParsedReference(jsonReferenceToString(jsonReference))
    ),
    RTE.map(({ parsedSchema, parsedReference }) =>
      pipe(
        parsedReference,
        O.fold(() => parsedSchema, identity)
      )
    )
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
