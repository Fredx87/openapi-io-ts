import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as gen from "io-ts-codegen";
import { parseSchemaFromJsonReference } from "./parseSchema";
import { JsonReference, jsonReferenceToString } from "../jsonReference";
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
  visitedReferences: JsonReference[]
): ParseSchemaRTE<ParseResolvedSchemaResult> {
  return pipe(
    resolveStringReference(reference),
    RTE.chain((jsonReference) => {
      if (isRecursive(jsonReference, visitedReferences)) {
        return pipe(
          getIdentifierFromReference(jsonReference),
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
            () => parseNewReference(jsonReference, visitedReferences),
            (typeReference) => RTE.right({ isRecursive: false, typeReference })
          )
        )
      );
    })
  );
}

function isRecursive(
  jsonReference: JsonReference,
  visitedReferences: JsonReference[]
): boolean {
  return (
    visitedReferences.find(
      (r) => jsonReferenceToString(r) === jsonReferenceToString(jsonReference)
    ) != null
  );
}

function getIdentifierFromReference(
  jsonReference: JsonReference
): ParseSchemaRTE<gen.Identifier | gen.ImportedIdentifier> {
  return pipe(
    getModelGenerationInfo(jsonReference),
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
  jsonReference: JsonReference,
  visitedReferences: JsonReference[]
): ParseSchemaRTE<ParseResolvedSchemaResult> {
  const newVisitedReferences = visitedReferences.concat(jsonReference);
  return setCurrentDocumentUriAndParseSchema(
    jsonReference,
    newVisitedReferences
  );
}

function setCurrentDocumentUriAndParseSchema(
  jsonReference: JsonReference,
  visitedReferences: JsonReference[]
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
