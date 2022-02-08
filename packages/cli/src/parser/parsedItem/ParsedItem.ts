import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import {
  defaultModelGenerationInfo,
  JsonReference,
  ModelGenerationInfo,
  resolveStringReference,
} from "json-schema-io-ts";
import { ParsedBody } from "../body";
import { ParserContext, ParserRTE } from "../context";
import { ParsedParameter } from "../parameter";
import { ParsedResponse } from "../response";

export type ParsedItemType = ParsedBody | ParsedParameter | ParsedResponse;

export interface ParsedItem<T extends ParsedItemType> {
  type: "ParsedItem";
  name: string;
  item: T;
  filePath: string;
}

export function parsedItem<T extends ParsedItemType>(
  name: string,
  item: T,
  filePath: string
): ParsedItem<T> {
  return {
    type: "ParsedItem",
    name,
    item,
    filePath,
  };
}

export function getModelGenerationInfoFromReference(
  reference: string
): ParserRTE<ModelGenerationInfo> {
  return pipe(
    RTE.Do,
    RTE.bind("parseSchemaContext", () =>
      RTE.asks((c: ParserContext) => c.parseSchemaContext)
    ),
    RTE.bindW("jsonReference", ({ parseSchemaContext }) =>
      pipe(
        resolveStringReference(reference)(parseSchemaContext),
        RTE.fromTaskEither
      )
    ),
    RTE.chain(({ parseSchemaContext, jsonReference }) =>
      getModelGenerationInfoFromJsonReference(
        parseSchemaContext.rootDocumentUri,
        jsonReference
      )
    )
  );
}

function getModelGenerationInfoFromJsonReference(
  rootDocumentUri: string,
  jsonReference: JsonReference
): ParserRTE<ModelGenerationInfo> {
  if (jsonReference.uri !== rootDocumentUri) {
    return RTE.right(getModelGenerationInfoForExternalReference(jsonReference));
  }

  if (
    jsonReference.jsonPointer[0] === "components" &&
    jsonReference.jsonPointer.length > 2
  ) {
    return RTE.right(getModelGenerationInfoForComponent(jsonReference));
  }

  return RTE.right(defaultModelGenerationInfo(jsonReference));
}

function getModelGenerationInfoForExternalReference(
  jsonReference: JsonReference
): ModelGenerationInfo {
  const { name } = defaultModelGenerationInfo(jsonReference);

  const res: ModelGenerationInfo = {
    name,
    filePath: `externals/${name}.ts`,
  };

  return res;
}

function getModelGenerationInfoForComponent(
  jsonReference: JsonReference
): ModelGenerationInfo {
  const componentType = jsonReference.jsonPointer[1];

  const { name } = defaultModelGenerationInfo(jsonReference);

  const res: ModelGenerationInfo = {
    name,
    filePath: `components/${componentType}/${name}.ts`,
  };

  return res;
}

// function getModelGenerationInfoForPathItem(
//   jsonReference: JsonReference
// ): ParserRTE<ModelGenerationInfo> {}

// function getOperationIdFromPath(path: string): ParserRTE<string> {
//   return pipe();
// }
