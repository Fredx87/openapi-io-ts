import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as gen from "io-ts-codegen";
import { parseSchemaFromJsonReference } from "./parseSchema";
import { JsonReference } from "../jsonReference";
import { resolveStringReference } from "./resolvers";
import { ParseResolvedSchemaResult, ParseSchemaRTE } from "./types";
import {
  modifyCurrentDocumentUri,
  readCurrentDocumentUri,
  readGeneratedModelsRef,
} from "./ioRefs";
import {
  getModelGenerationInfo,
  getReferenceFromGeneratedModel,
} from "./generateModel";

export function parseJsonReference(
  reference: string,
  visitedReferences: string[]
): ParseSchemaRTE<ParseResolvedSchemaResult> {
  const isRecursive = visitedReferences.includes(reference);

  if (isRecursive) {
    return pipe(
      getIdentifierFromReference(reference),
      RTE.map((identifier) => ({
        isRecursive: true,
        typeReference: identifier,
      }))
    );
  }

  return pipe(
    getParsedReference(reference),
    RTE.chainW(
      O.foldW(
        () => parseNewReference(reference, visitedReferences),
        (typeReference) => RTE.right({ isRecursive: false, typeReference })
      )
    )
  );
}

function getIdentifierFromReference(
  reference: string
): ParseSchemaRTE<gen.Identifier | gen.ImportedIdentifier> {
  return pipe(
    resolveStringReference(reference),
    RTE.chain((jsonReference) => getModelGenerationInfo(jsonReference)),
    RTE.map(({ name, filePath }) =>
      filePath == null
        ? gen.identifier(name)
        : gen.importedIdentifier(name, filePath)
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
        currentRes[stringReference] as
          | gen.TypeReference
          | gen.TypeDeclaration
          | undefined,
        O.fromNullable,
        O.map(getReferenceFromGeneratedModel)
      )
    )
  );
}

function parseNewReference(
  stringReference: string,
  visitedReferences: string[]
): ParseSchemaRTE<ParseResolvedSchemaResult> {
  const newVisitedReferences = visitedReferences.concat(stringReference);

  return pipe(
    RTE.Do,
    RTE.bind("jsonReference", () => resolveStringReference(stringReference)),
    RTE.bind("parseSchemaRes", ({ jsonReference }) =>
      setCurrentDocumentUriAndParseSchema(jsonReference, newVisitedReferences)
    ),
    RTE.map(({ parseSchemaRes }) => parseSchemaRes)
  );
}

function setCurrentDocumentUriAndParseSchema(
  jsonReference: JsonReference,
  visitedReferences: string[]
): ParseSchemaRTE<ParseResolvedSchemaResult> {
  return pipe(
    setCurrentDocumentUri(jsonReference),
    RTE.chainW(() =>
      parseSchemaFromJsonReference(jsonReference, visitedReferences)
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
