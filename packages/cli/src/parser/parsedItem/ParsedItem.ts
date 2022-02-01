import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import {
  defaultModelGenerationInfo,
  JsonReference,
  ModelGenerationInfo,
  resolveStringReference,
} from "json-schema-io-ts";
import { ParsedBody } from "../body";
import {
  ComponentTypeParsedItemMap,
  ComponentReference,
  ComponentType,
} from "../components";
import { ParserContext, ParserRTE } from "../context";
import { ParsedParameter } from "../parameter";
import { ParsedResponse } from "../response";

interface BaseParsedItem<T> {
  name: string;
  item: T;
}

export interface ParsedItem<T> extends BaseParsedItem<T> {
  type: "ParsedItem";
}

export function parsedItem<T>(name: string, item: T): ParsedItem<T> {
  return {
    type: "ParsedItem",
    name,
    item,
  };
}

export interface ReferencedParsedItem<T> extends BaseParsedItem<T> {
  type: "ReferencedParsedItem";
  filePath: string;
}

export function referencedParsedItem<T>(
  name: string,
  item: T,
  filePath: string
): ReferencedParsedItem<T> {
  return {
    type: "ReferencedParsedItem",
    name,
    item,
    filePath,
  };
}

export interface ReferencedParsedItems {
  parameters: Record<string, ReferencedParsedItem<ParsedParameter>>;
  responses: Record<string, ReferencedParsedItem<ParsedResponse>>;
  requestBodies: Record<string, ReferencedParsedItem<ParsedBody>>;
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
    importData: {
      path: "externals",
      prefix: "externals",
    },
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
    importData: {
      path: `components/${componentType}`,
      prefix: componentType,
    },
  };

  return res;
}

// function getModelGenerationInfoForPathItem(
//   jsonReference: JsonReference
// ): ParserRTE<ModelGenerationInfo> {}

// function getOperationIdFromPath(path: string): ParserRTE<string> {
//   return pipe();
// }
