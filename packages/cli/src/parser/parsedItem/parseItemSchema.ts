import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as gen from "io-ts-codegen";
import {
  JsonReference,
  jsonReferenceToString,
  parseSchema,
  readGeneratedModelsRef,
} from "json-schema-io-ts";
import { ParserContext, ParserRTE } from "../context";
import { ParsedItemInternalSchema, ParsedItemSchema } from "./ParsedItemSchema";

export function parseItemSchema(
  jsonReference: JsonReference
): ParserRTE<ParsedItemSchema> {
  return pipe(
    RTE.asks((c: ParserContext) => c.parseSchemaContext),
    RTE.chainW((parseSchemaContext) =>
      pipe(
        parseSchema(jsonReferenceToString(jsonReference))(parseSchemaContext),
        RTE.fromTaskEither
      )
    ),
    RTE.chain((typeReference) =>
      getParsedItemSchema(typeReference, jsonReference)
    )
  );
}

function getParsedItemSchema(
  typeReference: gen.TypeReference,
  jsonReference: JsonReference
): ParserRTE<ParsedItemSchema> {
  if (typeReference.kind === "Identifier") {
    return getParsedItemInternalReference(typeReference, jsonReference);
  }

  return RTE.right({
    _tag: "ParsedItemTypeReference",
    typeReference,
  });
}

function getParsedItemInternalReference(
  identifier: gen.Identifier,
  jsonReference: JsonReference
): ParserRTE<ParsedItemInternalSchema> {
  const stringReference = jsonReferenceToString(jsonReference);

  return pipe(
    RTE.asks((c: ParserContext) => c.parseSchemaContext),
    RTE.chainW((parseSchemaContext) =>
      pipe(readGeneratedModelsRef()(parseSchemaContext), RTE.fromTaskEither)
    ),
    RTE.chainW((generatedModels): ParserRTE<ParsedItemInternalSchema> => {
      const model = generatedModels[stringReference];

      if (model == null) {
        return RTE.left(
          new Error(
            `Cannot find generated model for reference ${stringReference}`
          )
        );
      }

      if (model.kind !== "TypeDeclaration") {
        return RTE.left(
          new Error(
            `Find a model that is not a TypeReference for reference ${stringReference}`
          )
        );
      }

      return RTE.right({
        _tag: "ParsedItemInternalSchema",
        identifier,
        typeDeclaration: model,
      });
    })
  );
}
